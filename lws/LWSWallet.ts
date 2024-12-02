import LWSClient, { Output, Rates, Spend, Transaction } from "./LWSClient";

export interface WalletInfo {
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

export default class LWSWallet {
    private readonly client: LWSClient;

    public readonly address: string;
    public readonly viewKey: string;

    constructor(address: string, viewKey: string, serverUrl: string) {
        this.address = address;
        this.viewKey = viewKey;
        this.client = new LWSClient(serverUrl);
    }

    public async login(): Promise<void> {
        const result = await this.client.login(this.address, this.viewKey);
        console.debug(result);
    }

    public async getTxs(): Promise<Transaction[]> {
        const result = await this.client.getAddressTxs(this.address, this.viewKey);

        return result.transactions;
    }

    public async getOuts(): Promise<Output[]> {
        const result = await this.client.getUnspentOuts(this.address, this.viewKey, 0, 0, true);

        return result.outputs;
    }

    public async getInfo(): Promise<WalletInfo> {
        return await this.client.getAddressInfo(this.address, this.viewKey);
    }
}