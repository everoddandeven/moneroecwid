export interface EcwidOrderItemTax {
    name: string;
    value: number;
    total: number;
    taxOnDiscountedSubtotal: number;
    taxOnShipping: number;
}