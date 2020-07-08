import { BIEventTypes } from '../enums/bi-event-types';
import { ProductHistory } from './page.model';

export interface BiLogs {
    EventType: BIEventTypes;
    LogDateTime: string;
    CommonRawData: CommonRawData;
    CurrentContext: CurrentContext;
}

export interface CommonRawData {
    // Start CommonRawData – contained all generated raw data
    BIDestionationParams: string;
    Brand: string;
    CampaignName: string;

    SourceHost: SourceHostData;
    Application: ApplicationData;
    MarketTags: MarketTagsData;
    GeneralContext: GeneralContextData;
}
interface SourceHostData {
    StoreName: string;
    StoreCode: string;
    KioskId: string;
}
interface ApplicationData {
    Provider: string;
    Category: string;
    Name: string;
    Version: string;
}
interface MarketTagsData {
    Store: string;
    Kiosk: string;
}
interface GeneralContextData {
    Language: string;
    SessionId: string;
    ScreenResolution: string;
    CustomerChoice: 'EAT_IN' | 'TAKE_OUT';
    DisplayMode: 'FULL_HD' | 'ACCESSIBILITY';
    Currency: CurrencyData;
}
interface CurrencyData {
    Name: string;
    Symbol: string;
}

// Navigation Models
export interface CurrentContext {
    BITags?: string;
    PageName: string;
    Breadcrumb: string;
    DOTXIXHit: DOTXIXHit;
}

export interface DOTXIXHit {
    Category: string;
    Action: string;
    ActionSourceType: string;
    ActionDetails: ActionDetails;
    ProductList?: ProductListData[];
    Product?: ProductData;
    // Products?: ProductListData[];
    CheckoutDetails?: CheckoutData;
    TransactionDetails?: TransactionData;
    PageDetails?: PageDetails;
  }

interface ActionDetails {
    Value?: string;
    // PlaceHolder?: string;
    Position?: number;
}

export interface ProductListData {
    ListName?: string;
    Products: ProductData[];
}
export interface ProductData {
    Position?: number;
    ItemID: string;
    Name: string;
    Categ: string;
    Price?: string;
    Combos?: ProductData[];
    Visibility?: Boolean;
    Quantity?: number;
    ProductCoupon?: string;
    History?: ProductHistory;
    Creative?: string;
}

interface CheckoutData {
    Step?: number;
    Option?: string;
    Products: ProductData[];
}
interface TransactionData {
    TransactionId: string;
    OrderTotal: string;
    Taxes: string;
    TransactionCoupon?: string;
    Paid?: 'YES'|'NO';
}

export interface PageDetails {
    Buttons: BiButton[];
    PageType: string;
    AutoTopology?: boolean;
    ID: string;
    Title: string;
    Name: string;
    Date?: string;
    PageTemplate?: {};
    IsLandingPage?: boolean;
    IsDrivePage?: boolean;
    ScoreRule?: number;
    PageTags: string;
}

export interface BiButton {
    Selected: boolean;
    Enabled: boolean;
    Picture: string;
    Caption: string;
    Price: string;
    Description: string;
    Visible: boolean;
    ButtonType: number;
    PageID: number;
    DisplayMode: string;
    DlgMessage: string;
    Link: string;
    Jump: string;
    MinQuantity: number;
    ChargeThreshold: number;
    MaxQuantity: number;
    Tags: string;
    Order: number;
}
export interface ModifierSession {
    index: number;
    pieces: number;
    UUID: string;
}
