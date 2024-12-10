export interface EcwidOrderItemProductFile {
    productFileId: string;
    maxDownloads: number;
    remainingDownloads: number;
    expire: string;
    name: string;
    description: string;
    size: number;
    adminUrl: string;
    customerUrl: string;
}