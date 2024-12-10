export interface EcwidAppStorageEntry {
    key: string;
    value: string;
}

export type EcwidAppStorageData = EcwidAppStorageEntry[];

export interface EcwidAppStorageDataUpdateResult {
    success: boolean;
}