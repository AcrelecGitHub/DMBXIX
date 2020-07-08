import { CODProduct } from './cod-product.model';

export interface CODOrderItem extends CODProduct {
    totalPrice: {
        value: number;
        type: 'points' | 'currency'
    };
    voided: boolean;
}
