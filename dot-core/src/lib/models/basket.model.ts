import { Language } from './language.model';

export interface Basket {
    Order: BasketOrder;
    MsgInOut: string;
    MsgQty: string;
    MsgTotal: string;
    Title: string;
}

export interface BasketOrder {
    BCSecurity: string;
    Closed: boolean;
    TotalInitialPrice: string;
    OrderExtID: string;
    OrderVer: string;
    OrderEnd: string;
    TotalTAX: string;
    TotalQty: number;
    POSResult: number;
    OrderRefInt: string;
    POSDetails: number;
    IntegrationStart: string;
    OrderStart: string;
    GrossAmount: string;
    OrderElogLocation: number;
    DeliveryPointName: string;
    GrandTotalInteger: number;
    DeliveryPointDesc: string;
    PromoUsed2: string;
    PAYDetails_txt: string;
    SvcCharge: {
        OrderTenderItems: any[];
        OrderAmountStr: string;
        OrderAmountInt: number;
    };
    OrderNr: number;
    OrderTime: string;
    TotalPrice: string;
    Amounts: {
        OrderTenderItems: any[];
        OrderAmountStr: string;
        OrderAmountInt: number;
    };
    OrderNrStr: string;
    PAYDetails: number;
    ComboGroups: any[];
    TotalTAXInteger: number;
    POSTovStatus: number;
    TaxAmount: string;
    TotalInitialPriceInteger: number;
    TableService: number;
    PaymentStart: string;
    OrderKiosk: string;
    PaymentDuration: string;
    BusinessDay: Date;
    Operations: OperationItem[];
    POSTovDetails_txt: string;
    EndStatus: number;
    POSStatus: number;
    OrderInOut: number;
    OrderStoreNo: string;
    PromoOfferTime: string;
    TotalPriceInteger: number;
    Combos: any[];
    BrandID: string;
    OrderStoreName: string;
    PromoBar: string;
    POSDetails_txt: string;
    IntegrationDuration: string;
    ReceiptText: string;
    PaidAmount: string;
    POSTovDetails: number;
    GrandTotal: string;
    PreOrder: boolean;
    CustomInfo: string;
    PAYStatus: number;
    FirstItem: string;
    VATInfo: any[];
    OrderSIM: string;
}
// export interface BasketItem {

// }
export interface OperationItem {
    DeviceType: string;
    Time: string;
    ID: string;
    Name: string;
    Operation: string;
    Status: string;
    Code: string;
}
