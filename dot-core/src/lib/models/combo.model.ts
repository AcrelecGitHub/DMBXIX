import { ProductHistory } from './page.model';

export interface Combo {
    AuxID: string;
    ComboGroup: number;
    POSID: string;
    Qty: number;
    Col: string;
    ComponentID: string;
    Visibility: number;
    PromoType: number;
    Quantity: number;
    GroupType: string;
    ComboPriceStr: string;
    LName: string;
    DefaultQuantity: number;
    UnitPrice: number;
    KVSLName: string;
    PrefixID: string;
    FeatureID: string;
    FeatureType: string;
    ComboPrice: number;
    Image: string;
    IsVirtual: boolean;
    UnitPriceStr: string;
    ModifierLabel: string;
    PrefixName: string;
    VatAmount: number;
    IsValid: boolean;
    ItemID: string;
    FamilyID: string;
    PriceLevel: number;
    VatID: number;
    InvalidityCode: number;
    Combos: Combo[];
    PromoRef: number;
    UUID: string;
    SName: string;
    BasketElemType: string;
    BasketSubType: number;
    CustomInfo: string;
    RName: string;
    KVSSName: string;
    Modifiable: boolean;
    BItem: string;
    Price: number;
    AllowQtyZero?: boolean;
    IceModifier?: boolean;
    PickupModifier?: boolean;
    AddedFromMultiSelectPopupPage?: boolean;
    History: ProductHistory;
}


export interface PromoInfo {
    transactionCoupon?: string;
    productCoupon?: string;
    Type: string;
    ID: number;
    PageID: string;
    SubType: number;
    Active: number;
    Description: PromoDescription;
}

export interface PromoDescription {
    MinUAmount: number;
    Qty: number;
    Avlb: AvailabilityPromo;
    LblNameDictionary?: DictionaryName;
    LblNoItemDictionary?: DictionaryName;
    Barcode: string;
    PosDiscountID?: number;
    PromoButtonList?: PromoButton[];
}

interface AvailabilityPromo {
    DOW: string;
}

interface DictionaryName {
    ES: string;
    EN: string;
    DEF: string;
}
interface PromoButton {
    ButtonType: string;
    ID: number;
    IF: string;
}
export interface SuggestionInfo {
    Items?: Item[];
    Menus?: Item[];
    Orders?: Order[];
}
interface Item {
    ID: string;
    SaleList: Sale[];
}
interface Sale {
    SaleGrpID: string;
    JoinToCombo?: string;
    Avlb?: AvailabilitySuggestion;
}
interface Order {
    SaleList: Sale[];
}
interface AvailabilitySuggestion {
    Service: '1' | '2' | '3';
}

