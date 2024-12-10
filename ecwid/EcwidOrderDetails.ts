import { EcwidExtraFieldsInfo } from "./EcwidExtraFieldsInfo";
import { EcwidFulfillmentStatus } from "./EcwidFulfillmentStatus";
import { EcwidHandlingFeeInfo } from "./EcwidHandlingFeeInfo";
import { EcwidOrderItem } from "./EcwidOrderItem";
import { EcwidPaymentStatus } from "./EcwidPaymentStatus";
import { EcwidShippingOptionInfo } from "./EcwidShippingOptionInfo";

export interface EcwidOrderDetails {
    id: string;
    subtotal: number;
    referenceTransactionId: string;
    total: number;
    email: string;
    paymentMethod: string;
    paymentModule: string;
    tax: number;
    ipAddress: string;
    couponDiscount: number;
    paymentStatus: EcwidPaymentStatus;
    fulfillmentStatus: EcwidFulfillmentStatus;
    refererUrl: string;
    volumeDiscount: number;
    membershipBasedDiscount: number;
    totalAndMembershipBasedDiscount: number;
    discount: number;
    usdTotal: number;
    globalReferer: string;
    createDate: string;
    createTimestamp: number;
    items: EcwidOrderItem[];
    shippingPerson: EcwidShippingOptionInfo;
    handlingFee: EcwidHandlingFeeInfo;
    additionalInfo: { [key: string]: string };
    paymentParams: { [key: string]: string };
    hidden: boolean;
    extraFields: EcwidExtraFieldsInfo[];
    [key: string]: any;
}