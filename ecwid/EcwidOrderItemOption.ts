import { EcwidOrderItemOptionFile } from "./EcwidOrderItemOptionFile";

export interface EcwidOrderItemOption {
    name: string;
    type: string;
    value: string;
    valuesArray: any[];
    files: EcwidOrderItemOptionFile[];
}