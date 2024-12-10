import { Router, Request, Response, NextFunction } from 'express';
import { EcwidPaymentData, EcwidPaymentStatus, EcwidRequestDecoder, EcwidStoreManagerService } from '../ecwid';
import { MoneroWalletFull, MoneroUtils, MoneroDaemonConfig, MoneroDaemonRpc, connectToDaemonRpc, MoneroDaemon, MoneroSubaddress, createWalletFull, MoneroNetworkType, MoneroWalletConfig } from 'monero-ts';
import { makeRequest, PaymentData } from '../utils';
import fs from 'fs';
import Datastore from 'nedb';

type ProcessorHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

interface PaymentRequest {
    txId: string;
    data: EcwidPaymentData;
    accountIndex: number;
    addressIndex: number;
    xmrAmount: number;
    status: EcwidPaymentStatus;
    timestamp: number;
    expire: number;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONERO_RPC_TESTNET: string;
            MONERO_RPC_MAINNET: string;
        }
    }
}

abstract class PaymentProcessor {
    private static testnet: boolean = process.env.TESTNET === '1' || process.env.TESTNET === 'true';
    private static moneroRpcServer: string = this.testnet ? process.env.MONERO_RPC_TESTNET : process.env.MONERO_RPC_MAINNET;
    private static paymentRequests: Datastore<PaymentRequest> = new Datastore<PaymentRequest>({ filename: './data/paymentRequests.db', autoload: true });
    private static daemon?: MoneroDaemonRpc;
    private static wallet?: MoneroWalletFull;

    private static checkTimeouts: { [key: string]: NodeJS.Timeout | undefined };

    public static readonly clientSecret: string = process.env.CLIENT_SECRET || '';
    public static readonly paymentHandler: ProcessorHandler = (req: Request, res: Response, next: NextFunction) => this.onPayment(req, res, next);
    public static readonly updatePaymentStatusHandler: ProcessorHandler = (req: Request, res: Response, next: NextFunction) => this.onUpdatePaymentStatus(req, res, next);
    public static readonly getPaymentStatusHandler: ProcessorHandler = (req: Request, res: Response, next: NextFunction) => this.onGetPaymentStatus(req, res, next);

    private static getWalletConfig(): Partial<MoneroWalletConfig> {
        const config: Partial<MoneroWalletConfig> = {
            path: 'wallet_ecwid',
            server: this.moneroRpcServer,
            networkType: this.testnet ? MoneroNetworkType.TESTNET : MoneroNetworkType.MAINNET
        };

        return config;
    }

    private static async getWallet(sync: boolean = false): Promise<MoneroWalletFull> {       
        console.log(`PaymentProcess.getWallet()`); 
        let wallet: MoneroWalletFull;

        if (!this.wallet) {
            const config = this.getWalletConfig();

            if (await MoneroWalletFull.walletExists('wallet_ecwid', fs.promises)) {
                console.log(`PaymentProcess.getWallet(): wallet exists`); 

                wallet = await MoneroWalletFull.openWallet(config);

                console.log(`PaymentProcess.getWallet(): wallet opened`); 
            }
            else {
                console.log(`PaymentProcess.getWallet(): creating wallet`); 
                try {
                    wallet = await createWalletFull(config);

                }
                catch (error: any) {
                    console.error(error);
                    wallet = await createWalletFull(config);
                }

                console.log(`PaymentProcess.getWallet(): created wallet`); 
            }

            this.wallet = wallet;
        }
        else {
            wallet = this.wallet;
        }

        if (sync) {
            console.log(`PaymentProcess.getWallet(): syncing wallet`); 
            await wallet.sync();
            console.log(`PaymentProcess.getWallet(): wallet synced`); 
        }

        return wallet;
    }   

    private static async usdToXmr(usdAmount: number): Promise<number> {
        const response: any = await makeRequest('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd', 'GET');

        return 1e12/response.monero.usd;
    }

    private static async getDaemon(): Promise<MoneroDaemonRpc> {
        if (!this.daemon) {
            this.daemon = await connectToDaemonRpc('https://node.monerodevs.org:28083');
        }

        return this.daemon;
    } 

    private static async isSubaddressUsed(address: MoneroSubaddress): Promise<boolean> {
        if (address.balance > 0) {
            return true;
        }

        return (await this.getPaymentRequests()).find((pr) => pr.accountIndex === address.getAccountIndex() && pr.addressIndex === address.getIndex()) != undefined;
    }

    private static setResponseCookies(res: Response, paymentData: EcwidPaymentData): void {
        const { referenceTransactionId } = paymentData.cart.order;
        const { storeId, token } = paymentData;
        const { merchantkey } = paymentData.merchantAppSettings;

        res.cookie('refrenceTransactionId', referenceTransactionId);
        res.cookie('storeId', storeId);
        res.cookie('token', token);
        res.cookie('merchantKey', merchantkey);
    }

    private static async getPaymentRequests(): Promise<PaymentRequest[]> {
        return this.paymentRequests.getAllData() as PaymentRequest[];
    }

    private static async insertPaymentRequest(paymentRequest: PaymentRequest): Promise<void> {
        console.log('PaymentProcessor.insertPaymentRequest()');

        await new Promise<void>((resolve, reject) => {
            this.paymentRequests.insert(paymentRequest, ((err: Error | null, request: PaymentRequest) => {
                if (err) reject(err);
                else resolve();
            }));
        });
    }

    private static async getPaymentRequestByTxId(txId: string): Promise<PaymentRequest | undefined> {
        return await new Promise<PaymentRequest | undefined>((resolve) => {
            this.paymentRequests.findOne({referenceTransactionId: txId}, (err: Error | null, request: PaymentRequest) => {
                if (err) resolve(undefined);
                else resolve(request);
            });
        });
    }

    private static async createPaymentRequest(paymentData: EcwidPaymentData, timeoutMinutes: number = 15): Promise<PaymentRequest> {
        console.log('PaymentProcessor.createPaymentRequest()');
        const wallet = await this.getWallet();
        console.log('PaymentProcessor.createPaymentRequest(): got wallet');
        const txId = paymentData.cart.order.referenceTransactionId;
        const { storeId, token } = paymentData;
        
        const store = EcwidStoreManagerService.getStore(storeId, token);

        let subaddress = await wallet.createSubaddress(0);


        while(this.isSubaddressUsed(subaddress)) {
            subaddress = await wallet.createSubaddress(0);
        }

        console.log('PaymentProcessor.createPaymentRequest(): created subaddress ' + subaddress);

        await wallet.setSubaddressLabel(subaddress.accountIndex, subaddress.getIndex(), txId);

        const now = Date.now();

        const request: PaymentRequest = {
            txId: txId,
            accountIndex: subaddress.getAccountIndex(),
            addressIndex: subaddress.getIndex(),
            data: paymentData,
            status: 'AWAITING_PAYMENT',
            xmrAmount: await this.usdToXmr(paymentData.cart.order.usdTotal),
            timestamp: now,
            expire: now + timeoutMinutes * 60 * 1000
        };

        console.log('PaymentProcessor.createPaymentRequest(): before update order');

        await store.updateOrder(txId, 'AWAITING_PAYMENT');

        this.checkTimeouts[txId] = setInterval(async () => {
            const now = Date.now();
            const self = this.checkTimeouts[txId];

            if (request.status == 'AWAITING_PAYMENT') {
                const balance = await wallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex());

                if (balance >= request.xmrAmount) {
                    request.status = 'PAID';
                    await store.updatePaidOrder(txId);
                    clearInterval(self);
                    this.checkTimeouts[txId] = undefined;
                    return;
                }
                
                if (now > request.expire) {
                    request.status = 'CANCELLED';
                    await store.updateCancelledOrder(txId);
                    this.checkTimeouts[txId] = undefined;
                    clearInterval(self);
                    return;
                }
            }

            if (now > request.expire) {
                this.checkTimeouts[txId] = undefined;
                clearInterval(self);
                return;
            }

        }, 5000);

        await this.insertPaymentRequest(request);

        return request;
    }

    private static async onPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        console.log('PaymentProcessor.onPaymentRequest()');
        try {
            console.log(req.body);
            //const paymentData = EcwidRequestDecoder.decodePaymentData(this.clientSecret, req.body.data);

            const paymentData = req.body as EcwidPaymentData;
            console.log("AAAA");
            const paymentRequest = await this.createPaymentRequest(paymentData);

            console.log("created request");
            console.log(paymentRequest);
    
            this.setResponseCookies(res, paymentData);
        } catch {
            console.log(__filename);
            //const _filename = fileURLToPath(__filename);
            // res.sendFile('/public/process.html', path.dirname(__filename));
            res.redirect('/index.html');
            
            
        }

    }

    private static async onUpdatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        console.log('PaymentProcessor.onUpdatePaymentStatus()');

        const store = EcwidStoreManagerService.getStore(req.cookies.storeId, req.cookies.token);
        const transactionId = req.cookies.refrenceTransactionId;

        const { status } = req.body;

        await store.updateOrder(transactionId, status);
    }

    private static async onGetPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        console.log('PaymentProcessor.onGetPaymentStatus()');

        const refrenceTransactionId = req.body.refrenceTransactionId;
        const request = await this.getPaymentRequestByTxId(refrenceTransactionId);

        if (!request) {
            res.status(200).json({
                error: 'Request not found'
            });

            return;
        }

        const wallet = await this.getWallet(true);

        await wallet.getSubaddress(request.accountIndex, request.addressIndex);

    }
}

const paymentRouter = Router();

paymentRouter.post('/', PaymentProcessor.paymentHandler);
paymentRouter.post('/updatePaymentStatus', PaymentProcessor.updatePaymentStatusHandler);
paymentRouter.post('/getPaymentStatus', PaymentProcessor.getPaymentStatusHandler);

export { paymentRouter }; 