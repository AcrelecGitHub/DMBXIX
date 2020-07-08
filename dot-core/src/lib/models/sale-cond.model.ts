export interface SaleCond {
    readonly Items: Items[];
    readonly Orders: Orders[];
    readonly Menus: Menus[];
}

export interface Items {
    readonly ID: string;
    readonly SaleList: SaleItems[];
}
export interface SaleItems {
    readonly SaleGrpID: string;
    readonly JoinToCombo: string;
}
export interface Orders {
    readonly SaleList: SaleOrders[];
    readonly Condition: string;
}
export interface SaleOrders {
    readonly SaleGrpID: string;
    readonly Avlb: Availability;
}
export interface Menus {
    readonly ID: string;
    readonly SaleList: SaleMenus[];
}
export interface SaleMenus {
    readonly SaleGrpID: string;
    readonly JoinToCombo: string;
    readonly Size: string;
}
export interface Availability {
    Service: string;
}

