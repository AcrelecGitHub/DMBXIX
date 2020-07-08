import { CODOrderState } from './cod-order-state.model';
import { CODOrderItem } from './cod-order-item.model';

export interface CODOrderView {
    state: CODOrderState;
    currentScreen: string;
    totals: {
        value: number;
        tax: number;
        due: number;
    };
    items: CODOrderItem[];
    customData: { [key: string]: any };
}
