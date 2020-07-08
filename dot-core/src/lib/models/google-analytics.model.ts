export interface GoogleAnalyticsObject {
    CommonData: CommonDataObject;
    SpecificContext: ContextObject;
}
interface CommonDataObject {
    ProtocolVersion: string;
    TrackingID: string;
    KioskID: string;
    UserID: string;
    HitType: string;
    HostName: string;
    PageURL: string;
    PageTitle: string;
}

interface ContextObject {
    EventData?: EventObject;
    PageViewData?: PageViewObject;
    ProductImpressionView?: Array<ProductImpressionView>;
    ProductImpressionClick?: ProductData;
    CustomDimension?: 'Eat In'|'DineOut';
    SesionControl?: 'start'|'end';
    Promotion?: Array<PromoObject>;
    CheckOut?: CheckOut;
    Transaction?: TransactionData;
}
interface EventObject {
    EventCategory: string;
    EventAction: string;
    EventLabel?: string;
    NonInteractionHit?: 0|1;
}
interface PageViewObject {
    ScreenResolution: string;
    GeoID: string;
    UserLanguage: string;
}
interface ProductImpressionView {
    ListName: string;
    Products: Array<ProductObject>;
}
interface ProductObject {
    ID: string;
    Name: string;
    Category: string;
    Brand: string;
    Variant: string;
    Position?: number;
    Price?: string;
    Quantity?: number;
    CuponCode?: string;
}

interface ProductData {
    ProductAction: string;
    ProductActionList: string;
    Product: ProductObject;
}

interface PromoObject {
    ID: string;
    Name: string;
    Creative: string;
    Position: string;
    Action: string;
}
interface CheckOut {
    Step: number;
    StepOption: string;
}
interface TransactionData {
    ID: string;
    Affiliation: string;
    Revenue: string;        // currency
    Tax: string;            // currency
    CouponCode: string;
}

