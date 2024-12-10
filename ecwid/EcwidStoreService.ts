import { MoneroUtils } from "monero-ts";
import { makeRequest, RequestBody, RequestError, RequestResult } from "../utils";
import { EcwidAppStorageData, EcwidAppStorageDataUpdateResult, EcwidAppStorageEntry } from "./EcwidAppStorageData";
import { EcwidPaymentStatus } from "./EcwidPaymentStatus";
import { EcwidUpdateOrderRequest } from "./EcwidUpdateOrderRequest";

export class EcwidStoreService {
    public readonly storeId: number;
    public readonly token: string;

    public get storageUrl(): string {
        return `https://app.ecwid.com/api/v3/${this.storeId}/storage`;
    }

    constructor(storeId: number, token: string) {
        this.storeId = storeId;
        this.token = token;
    }

    private buildUpdateUrl(referenceTransactionId: string): string {
        return `https://app.ecwid.com/api/v3/${this.storeId}/orders/${referenceTransactionId}?token=${this.token}`;
    }

    private buildErrorUrl(returnUrl: string, referenceTransactionId: string, errorMessage: string): string {
        return `${returnUrl}?transaction=${referenceTransactionId}&errorMsg=${errorMessage}`;
    }

    public async updateOrder(referenceTransactionId: string, status: EcwidPaymentStatus): Promise<void> {
        const updateUrl = this.buildUpdateUrl(referenceTransactionId);
        
        const body: EcwidUpdateOrderRequest = {
            paymentStatus: status
        };

        const result = await this.put(updateUrl, body);

        console.log(result);
    }

    public async updatePaidOrder(referenceTransactionId: string): Promise<void> {
        return await this.updateOrder(referenceTransactionId, 'PAID');
    }

    public async updateCancelledOrder(referenceTransactionId: string): Promise<void> {
        return await this.updateOrder(referenceTransactionId, 'CANCELLED');
    }

    public async updateIncompleteOrder(referenceTransactionId: string): Promise<void> {
        return await this.updateOrder(referenceTransactionId, 'INCOMPLETE');
    }

    public async updateAwaitingPaymentOrder(referenceTransactionId: string): Promise<void> {
        return await this.updateOrder(referenceTransactionId, 'AWAITING_PAYMENT');
    }

    public async getStorageData(): Promise<RequestResult<EcwidAppStorageData>> {
        return await this.get<EcwidAppStorageData>(this.storageUrl, undefined, this.token);
    }

    public async getStorageDataByKey(key: string): Promise<RequestResult<EcwidAppStorageEntry>> {
        return await this.get<EcwidAppStorageEntry>(`${this.storageUrl}/${key}`, undefined, this.token);
    }

    public async updateStorageData(key: string, value: string): Promise<RequestResult<EcwidAppStorageDataUpdateResult>> {
        const body: { [key: string]: string } = {
            'value': value
        };

        return await this.put<EcwidAppStorageDataUpdateResult>(`${this.storageUrl}/${key}`, body, this.token);
    }

    public async addStorageData(key: string, data: { [key: string]: string }): Promise<RequestResult<{ updateCount: number }>> {
        return await this.post<{ updateCount: number }>(`${this.storageUrl}/${key}`, data, this.token);
    }

    public async deleteStorageData(key: string): Promise<void> {
        await this.delete(`${this.storageUrl}/${key}`, this.token);
    }

    private async get<T>(url: string, body?: RequestBody, authentication?: string): Promise<RequestResult<T>> {
        return await makeRequest<T>(url, 'GET', body, authentication);
    }

    private async post<T>(url: string, body?: RequestBody, authentication?: string): Promise<RequestResult<T>> {
        return await makeRequest<T>(url, 'POST', body, authentication);
    }

    private async delete<T>(url: string, authentication?: string): Promise<RequestResult<T>> {
        return await makeRequest<T>(url, 'DELETE', undefined, authentication);
    }

    private async put<T>(url: string, body: RequestBody, authentication?: string): Promise<RequestResult<T>> {
        return await makeRequest<T>(url, 'PUT', body, authentication);
    }
}