import { EcwidStoreService } from "./EcwidStoreService";

export abstract class EcwidStoreManagerService {
    private static _stores: EcwidStoreService[] = [];

    public static getStore(storeId: number, token: string): EcwidStoreService {
        let store = this._stores.find((s) => s.storeId === storeId && s.token === token);

        if (store) 
        {
            return store;
        }

        store = new EcwidStoreService(storeId, token);

        this._stores.push(store);

        return store;
    }

}