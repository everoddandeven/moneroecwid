import { EcwidPaymentStatus } from "./EcwidPaymentStatus";

export interface EcwidUpdateOrderRequest {
    paymentStatus: EcwidPaymentStatus;
    [key: string]: any;
}