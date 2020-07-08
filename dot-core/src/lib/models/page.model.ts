import { SuggestionInfo } from './combo.model';
import { Promo } from './promotions.model';
import { ModifierSession } from './bi-logs.model';

export interface Page {
    readonly PageType: string;
    readonly PageMode: string;
    readonly OrderButton: Button;
    readonly AutoTopology: boolean;
    readonly Groups: any;
    readonly Topology: any;
    readonly CancelButton: Button;
    readonly ServiceType: number;
    readonly Buttons: Button[];
    readonly ID: string;
    readonly PromoButton: Button;
    Title: string;
    readonly TitleDictionary?: any;
    readonly Name: string;
    readonly NameDictionary?: string;
    readonly Date: string;
    readonly Store: string;
    readonly Link: number;
    readonly NavBarID: number;
    readonly Background: {
        readonly SkinName: string;
        readonly BackgroundImage: string;
    }[];
    readonly NavigationButtons: any[];
    readonly FormStyle: string;
    readonly IsLandingPage: boolean;
    readonly IsDrivePage: boolean;
    readonly ScoreRule: number;
    readonly PageTemplate: string;
    PageTags?: string;
}

export interface Button {
    readonly Selected: boolean;
    readonly Enabled: boolean;
    readonly Picture: string;
    readonly Caption: string;
    readonly CaptionDictionary?: any;
    readonly Description: string;
    readonly DescriptionDictionary?: string;
    readonly Visible: boolean;
    readonly ButtonType: number;
    readonly PageID: number;
    readonly DisplayMode: string;
    readonly DlgMessage: string;
    readonly Link: string;
    readonly Jump: any;
    readonly ButtonStatus: string;
    readonly ServiceType: number;
    readonly Page: Page;
    readonly GroupPage: Page;
    readonly ModifiersPage: any;
    readonly UUID: string;
    readonly ShowCheckboxForQty: boolean;
    readonly ComboPage: {
        readonly ID: number;
        readonly Combos: ComboPage[];
    };
    readonly DefaultQuantity: number;
    readonly MinQuantity: number;
    readonly ChargeThreshold: number;
    readonly MaxQuantity: number;
    readonly Price: string;
    readonly Visibility: string;
    readonly PageType: string;
    readonly FormStyle: string;
    readonly PageMode: string;
    readonly SuggestivePages: { readonly PageId: string }[];
    ShowQuantity?: boolean;
    Quantity?: number;
    IsFull?: boolean;
    Tags?: string;
    Order?: number;
    IgnoreAllItemsAsCombo?: boolean;
    History?: ProductHistory;
}

export interface ProductHistory {
    promo?: Promo;
    sugestion?: SuggestionInfo;
    type: 'promo' | 'suggestion' | 'normal';
    ModifierSession?: ModifierSession;
}



export interface ComboPage {
    readonly PageType: string;
    readonly AriadnaPrice: string;
    readonly ComponentID: string;
    readonly BackgroundAccessibility: string;
    readonly MenuID: string;
    readonly AutoTopology: boolean;
    readonly Groups: any;
    readonly Topology: string;
    readonly MenuPrice: any;
    readonly AriadnaStructure: AriadnaItem[];
    readonly CancelButton: Button;
    readonly ComponentIndex: number;
    readonly Buttons: Button[];
    readonly ID: number;
    readonly Implicit: number;
    readonly JoinType: number;
    readonly Title: string;
    readonly Name: string;
    readonly Background: string;
    readonly ComponentName: string;
}

export interface AriadnaItem {
    readonly ComponentID: string;
    readonly Quantity: number;
    readonly KeepLogo: boolean;
    readonly Label: string;
    readonly ComponentTotalQuantity: number;
    readonly AriadnaStructure: AriadnaItem[];
    readonly ComponentIndex: number;
    readonly ID: string;
    readonly IsSize: boolean;
    readonly Implicit: boolean;
    readonly Current: boolean;
    readonly UUID: any;
    readonly Logo: string;
}
