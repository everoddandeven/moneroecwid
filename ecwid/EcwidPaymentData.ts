import { EcwidCartDetails } from "./EcwidCartDetails";
import { EcwidMerchantAppSettings } from "./EcwidMerchantAppSettings";

export interface EcwidPaymentData {
    /** Ecwid store ID */
    storeId: number;
    /** Storefront language. Use it to show error message and payment interface in correct language  */
    lang: string;
    /** A temporary URL to send customer to after the payment. */
    returnUrl: string;
    /** Merchant settings for your integration set up by your code. */
    merchantAppSettings: EcwidMerchantAppSettings;
    /** All available cart information after customer hit the Continue button for your payment method. */
    cart: EcwidCartDetails;
    /** Access token of the Ecwid store. Use it to update order status after the payment. */
    token: string;
    
    [key: string]: any;
}