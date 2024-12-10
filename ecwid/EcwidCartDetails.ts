import { EcwidOrderDetails } from "./EcwidOrderDetails";

export interface EcwidCartDetails {
    currency: string;
    order: EcwidOrderDetails;
}