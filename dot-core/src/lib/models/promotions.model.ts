export interface Promotions {
    readonly PromoGroupList: string[];
    readonly PromoList: Promo[];
}
export interface Promo {
    readonly Type: string;
    readonly ID: number;
    readonly PageID?: string;
    readonly PageIDList?: string[];
    readonly Active: number;
    readonly SubType: number;
    readonly Group?: string;
    readonly Description: PromoDescripion;
    readonly ConditionsList?: PromoConditions[];

}

export interface PromoDescripion {
    readonly LblName?: string;
    readonly LblNameDictionary?: Dictionary[];
    readonly LblNoItem?: string;
    readonly LblNoItemDictionary?: Dictionary[];
    readonly Barcode?: string;
    readonly Family?: string;
    readonly PosDiscountID?: number;
    readonly Show?: ShowCondition;
    readonly PromoButtonList?: PromoButton[];
}

export interface ShowCondition {
    readonly OnPromoButton: number;
    readonly OnOrderList: number;
    readonly OnCodView: number;
}

export interface PromoButton {
    readonly ButtonType: string;
    readonly ID: number;
    readonly IF?: string;
    readonly IFC?: string;
    readonly IFP?: string;
    readonly IFM?: string;
    readonly ForcePriceIN?: number;
    readonly ForcePriceOUT?: number;
    readonly ForcePriceFromPOS?: number;
}

export interface PromoConditions {
    readonly AmountsList: PromoAmounts[];
}

export interface PromoAmounts {
    readonly Percent: number;
    readonly MinUAmount: number;
    readonly MaxAmount: number;
    readonly POSDiscountID: number;
    readonly Name?: string;
    readonly NameDictionary?: Dictionary;
}


export interface Dictionary {
    name: string;
    value: string;
}

