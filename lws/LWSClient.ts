import axios from "axios";


export interface Output {
    txId: number;
    amount: string;
    index: number;
    globalIndex: number;
    rct: string;
    txHash: string;
    txPrefixHash: string;
    txPubKey: string;
    publicKey: string;
    spendKeyImages: string[];
    timestamp: string;
    height: number;
}

export interface Rates {
    AUD?: number;
    BRL?: number;
    BTC?: number;
    CAD?: number;
    CHF?: number;
    CNY?: number;
    EUR?: number;
    GBP?: number;
    HKD?: number;
    INR?: number;
    JPY?: number;
    KRW?: number;
    MXN?: number;
    NOK?: number;
    NZD?: number;
    SEK?: number;
    SGD?: number;
    TRY?: number;
    USD?: number;
    RUB?: number;
    ZAR?: number;
}

export interface Spend {
    amount: string;
    keyImage: string;
    txPubKey: string;
    outIndex: number;
    mixin: number;
}

export interface Transaction {
    id: number;
    hash: string;
    timestamp?: string;
    totalReceived: string;
    totalSent: string;
    unlockTime: number;
    height?: number;
    spentOutputs: Spend[];
    paymentId?: string;
    coinbase: boolean;
    mempool: boolean;
    mixin: number;
}

interface AccountRequest {
    address: string;
    view_key: string;
}

interface GetAddressInfoRequest extends AccountRequest {

}

interface GetAddressInfoResponse {
    lockedFunds: string;
    totalReceived: string;
    totalSent: string;
    scannedHeight: number;
    scannedBlockHeight: number;
    startHeight: number;
    transactionHeight: number;
    blockchainHeight: number;
    spentOutputs: Spend[];
    rates?: Rates;
}

interface GetAddressTxsResponse {
    totalReceived: string,
    scannedHeight: number,
    scannedBlockHeight: number,
    startHeight: number,
    blockchainHeight: number,
    transactions: Transaction[]
}

interface GetUnspentOutsRequest extends AccountRequest {
    amount: string;
    mixin: number;
    use_dust: boolean,
    dust_threshold?: string;
}

interface GetUnspentOutsResponse {
    perByteFee: string;
    feeMask: string,
    amount: string,
    outputs: Output[]
}

interface LoginRequest extends AccountRequest {
    create_account: boolean;
    generated_locally: boolean;
};

interface LoginResponse {
    newAddress: boolean;
    generatedLocally?: boolean;
    startHeight?: number;
};

export default class LWSClient {
    private readonly httpClient: typeof axios;

    public get Url(): string {
        return this.httpClient.defaults.baseURL ? this.httpClient.defaults.baseURL : '';
    }

    constructor(url: string) {
        this.httpClient = axios;

        this.httpClient.defaults.baseURL = url;
    }


    private parseRates(rates: any): Rates | undefined {
        if (rates == null || rates == undefined) {
            return undefined;
        }

        return {
            AUD: rates.AUD,
            BTC: rates.BTC,
        };
    }

    private parseSpends(spends: any[]): Spend[] {
        if (!spends) {
            return [];
        }

        const result: Spend[] = [];

        spends.forEach((spend) => result.push({
            amount: spend.amount,
            keyImage: spend.key_image,
            txPubKey: spend.tx_pub_key,
            outIndex: spend.out_index,
            mixin: spend.mixin
        }));

        return result;
    }

    private parseTransactions(transactions: any[]): Transaction[] {
        if (!transactions) {
            return [];
        }

        const result: Transaction[] = [];

        transactions.forEach((tx) => result.push({
            id: tx.id,
            hash: tx.hash,
            timestamp: tx.timestamp,
            totalReceived: tx.total_received,
            totalSent: tx.total_sent,
            unlockTime: tx.unlock_time,
            height: tx.height,
            spentOutputs: this.parseSpends(tx.spent_outputs),
            paymentId: tx.payment_id,
            coinbase: tx.coinbase,
            mempool: tx.mempool,
            mixin: tx.mixin
        }));

        return result;
    }

    private parseOutputs(outputs: any[]): Output[] {
        if(!outputs) {
            return [];
        }

        const result: Output[] = [];

        outputs.forEach((output) => result.push({
            txId: output.tx_id,
            amount: output.amout,
            index: output.index,
            globalIndex: output.global_index,
            rct: output.rct,
            txHash: output.tx_hash,
            txPrefixHash: output.tx_prefix_hash,
            txPubKey: output.tx_pub_key,
            publicKey: output.public_key,
            spendKeyImages: output.spend_key_images,
            timestamp: output.timestamp,
            height: output.height
        }));

        return result;
    }

    /**
     * Check for the existence of an account or create a new one.
     * 
     * @param address Address to create/probe
     * @param viewKey View key bytes
     * @param createAccount Try to create new account
     * @param generatedLocally Indicate that the address is new
     * @returns 
     */
    public async login (address: string, viewKey: string, createAccount: boolean = false, generatedLocally: boolean = true): Promise<LoginResponse> {
        const requestBody: LoginRequest = {
            address: address,
            view_key: viewKey,
            create_account: createAccount,
            generated_locally: generatedLocally
        };

        const response = await this.httpClient.post('/login', requestBody).catch(err => 
        {
            if (err.response === undefined) {
                throw new Error('no response')
            }
            
            if (err.response.status === 403) {
                throw new Error('account does not exist')
            }
            
            if (err.response.status === 422) 
            {
                throw new Error('missing or invalid parameters')
            }
            
            throw err;
        });

        const result: LoginResponse = {
          newAddress: response.data.new_address,
          generatedLocally: response.data.generated_locally,
          startHeight: response.data.start_height
        };
    
        return result
    }

    /**
     * Returns the minimal set of information needed to calculate a wallet balance. 
     * The server cannot calculate when a spend occurs without the spend key, 
     * so a list of candidate spends is returned.
     * 
     * @param address Address to retrieve
     * @param viewKey View key bytes for authorization
     * @returns 
     */
    public async getAddressInfo(address: string, viewKey: string): Promise<GetAddressInfoResponse> {
        const requestBody: GetAddressInfoRequest = {
            address: address,
            view_key: viewKey
        };

        const response = await this.httpClient.post('/get_address_info', requestBody).catch((reason: any) => {
            if (reason.response.status === 403) {
                throw new Error('account does not exist')
            }

            throw reason;
        });

        const result: GetAddressInfoResponse = {
            lockedFunds: response.data.locked_funds,
            totalReceived: response.data.total_received,
            totalSent: response.data.total_sent,
            scannedHeight: response.data.scanned_height,
            scannedBlockHeight: response.data.scanned_block_height,
            startHeight: response.data.start_height,
            transactionHeight: response.data.transaction_height,
            blockchainHeight: response.data.blockchain_height,
            spentOutputs: this.parseSpends(response.data.spent_outputs),
            rates: this.parseRates(response.data.rates)
        };

        return result;
    }

    /**
     * Returns information needed to show transaction history. 
     * The server cannot calculate when a spend occurs without the spend key, 
     * so a list of candidate spends is returned.
     * @param address Address to retrieve
     * @param viewKey View key bytes for authorization
     * @returns 
     */
    public async getAddressTxs(address: string, viewKey: string): Promise<GetAddressTxsResponse> {
        const requestBody: AccountRequest = {
            address: address,
            view_key: viewKey
        };

        const response = await this.httpClient.post('/get_address_txs', requestBody).catch((reason: any) => {
            if (reason.response.status === 403) {
                throw new Error('account does not exist')
            }

            throw reason;
        });

        return {
            totalReceived: response.data.total_received,
            scannedHeight: response.data.scanned_height,
            scannedBlockHeight: response.data.scanned_block_height,
            startHeight: response.data.start_height,
            blockchainHeight: response.data.blockchain_height,
            transactions: this.parseTransactions(response.data.transactions)
        }
    }

    /**
     * Returns a list of received outputs. The client must determine when the output was actually spent.
     * 
     * @param address Address to create/probe
     * @param viewKey View key bytes
     * @param amount XMR send amount
     * @param mixin Minimum mixin for source output
     * @param useDust Return all available outputs
     * @param dustThreshold Ignore outputs below this amount
     * @returns 
     */
    public async getUnspentOuts(address: string, viewKey: string, amount: number, mixin: number, useDust: boolean, dustThreshold?: number): Promise<GetUnspentOutsResponse> {
        const requestBody: GetUnspentOutsRequest = {
            address: address,
            view_key: viewKey,
            amount: `${amount}`,
            mixin: mixin,
            use_dust: useDust,
            dust_threshold: dustThreshold ? `${dustThreshold}` : undefined
        }

        const result = await this.httpClient.post('/get_unspent_outs', requestBody).catch((error: any) => {
            if (error.response.status === 400) {
                throw new Error('Total received outputs less than amount');
            }

            throw error;
        });

        return {
            perByteFee: result.data.per_byte_fee,
            feeMask: result.data.fee_mask,
            amount: result.data.amount,
            outputs: this.parseOutputs(result.data.outputs)
        }
    }

}