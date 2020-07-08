import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { Log } from './logger/log';
import { OrderAreaService } from './order-area.service';
import { CommonRawData, DOTXIXHit, ProductData } from './models/bi-logs.model';
import { ConfigurationService } from './configuration.service';
import { ContentService } from './content.service';
import { InternationalizationService } from './internationalization.service';
import { BasketService, OrderCloseCause } from './basket.service';
import { PromotionsService } from './promotions.service';
import { HookManager } from './hook-manager/hook-manager';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { Language, Combo, Page, PageDetails, BiButton, Button } from './models';
import { UserService } from './user.service';
import { BIEventTypes } from './enums/bi-event-types';
import { OrderCheckoutService } from './order-checkout.service';

@Injectable({
    providedIn: 'root'
})
export class BiLogsService {

    private _onNewBiLog: Subject<any> = new Subject();

    constructor(private orderAreaService: OrderAreaService,
        private configurationService: ConfigurationService,
        private contentService: ContentService,
        private internationalizationService: InternationalizationService,
        private basketService: BasketService,
        private promotionsService: PromotionsService,
        private userService: UserService,
        private orderCheckoutService: OrderCheckoutService) {

        // Listen for Events:
        this.listenForNavigationEvents();
        this.listenForSettingsEvents();
        this.listenForSessionEvents();
        this.listenForBasketEvents();
        this.listenForCheckoutEvents();
        this.listenForCashPayment();
    }

    // Static function that serve for creating Data Objects:

    /**
     *
     * @param actionDetailsValue: either BUTTON or ...
     * @param category: string, NAVIGATION usually
     * @param action: CLICK/VIEW
     * @param actionSourceType: BUTTON for eveything that comes from pages.json and IS NOT a product but a page or products category
     *                          APP_BUTTON for any Navigation Button that is NOT a Page/Bridge Button
     */

    static getDOTXIXHit(actionDetailsValue: string,
        actionSourceType: string = 'APP_BUTTON',
        actionDetailsPosition: number = -1,
        action: string = 'CLICK',
        category: string = 'NAVIGATION'): DOTXIXHit {

        const dOTXIXHit: DOTXIXHit = {
            Category: category,
            Action: action,
            ActionSourceType: actionSourceType,
            ActionDetails: {
                Value: actionDetailsValue,
                // PlaceHolder: 'Unknown'
            }
        };
        // if this is a Page Button, add it's position in buttons list:
        if (actionDetailsPosition > -1) {
            dOTXIXHit.ActionDetails.Position = actionDetailsPosition;
        }


        return dOTXIXHit;
    }

    /**
     *
     * @param page: Page
     */
    static getPageTitle(page: any): string {
        if (!page) {
            return '';
        }
        return page['TitleDictionary'] && page['TitleDictionary']['DEF'] ?
            page['TitleDictionary']['DEF'] :
            page['Title'];
    }

    /**
     *
     * @param page: Modifier
     */
    static getModifierCaption(page: any): string {
        return page['CaptionDictionary'] && page['CaptionDictionary']['DEF'] ?
            page['CaptionDictionary']['DEF'] :
            page['Caption'];
    }

    /**
     * Call this to listen for ANY BI Log Event
     */
    get onNewBiLog(): Observable<any> {
        return this._onNewBiLog.asObservable();
    }

    /**
     * Call this to add a "BI Log Navigation Event"
     * @param event: DOTXIXHit
     * @param pageName: string, optional
     */
    logEvent(event: DOTXIXHit, pageName: string = '', breadcrumb: string = '', eventType: string = '') {
        Log.debug('BiLogsService.logEvent event = {0}', JSON.stringify(event));
        Log.debug('BiLogsService.logEvent this.userService.sessionId = {0}', this.userService.sessionId);
        // If userService.sessionId is falsy, return. This way will ignore events that are fired before/between user session
        // (as setting the default language on App Init)
        if (!this.userService.sessionId) {
            return;
        }

        if (!breadcrumb) {
            breadcrumb = this.getBreadcrumb();
        }

        const navigationContext = {
            BITags: this.getBiTags(),
            PageName: pageName || this.getPageTitle(),
            Breadcrumb: breadcrumb,
            DOTXIXHit: event,
        };
        this.emitNewBiLog(navigationContext, eventType);
    }




    /**
     * Call this to add a "PRODUCT DETAILS" event
     * @param item: Button
     */
    logProductDetailsImpression(item: Button) {
        // Logs:
        const caption = item.CaptionDictionary && item.CaptionDictionary['DEF'] ? item.CaptionDictionary['DEF'] : item.Caption;
        const hit = BiLogsService.getDOTXIXHit(caption, 'BUTTON', item.Order);

        const biButton = this.getBiButton(item);
        const biButtons = [];

        if (!biButton.Price || biButton.Price == '0') {
            if (item && item.ModifiersPage && item.ModifiersPage.Modifiers && item.ModifiersPage.Modifiers[0]) {
                biButton.Price = item.ModifiersPage.Modifiers[0].Buttons[0].Price;
            }
        }
        biButtons.push(biButton);

        const pageDetails = this.getPageDetails( this.orderAreaService.pageHistory.last() );
        pageDetails.Buttons = biButtons;

        hit.PageDetails = pageDetails;
        hit.ActionDetails.Position = biButton.Order;
        const breadcrumb = this.getBreadcrumb() + '/' + caption;
        this.logEvent( hit, '', breadcrumb,  BIEventTypes.ProductDetailView);
    }

    /**
     * Call this to add a "PAGE BUTTON" event
     * @param page: Page
     * @param button: Button
     */
    logPageButtonClick(page: Page, button: Button) {
        // Logs:
        const caption = button.CaptionDictionary && button.CaptionDictionary['DEF'] ? button.CaptionDictionary['DEF'] : button.Caption;
        const position = page.Buttons.findIndex((x: Button) => x.Link === button.Link) + 1;
        const hit = BiLogsService.getDOTXIXHit(caption, 'BUTTON', button.Order);

        const biButton = this.getBiButton(button);
        const biButtons = [];
        biButtons.push(biButton);


        const pageDetails = this.getPageDetails(page);
        pageDetails.Buttons = biButtons;
        hit.ActionDetails.Position = biButton.Order;
        hit.PageDetails = pageDetails;
        this.logEvent( hit );
    }

    getPageDetails(page: Page): PageDetails {
        const title = page.TitleDictionary && page.TitleDictionary['DEF'] ? page.TitleDictionary['DEF'] : page.Title;
        const name = page.NameDictionary && page.NameDictionary['DEF'] ? page.NameDictionary['DEF'] : page.Name;

        const pageDetails: PageDetails = {
            Buttons: [],
            ID: page.ID,
            Title: title,
            Name: name,
            Date: page.Date,
            PageType: page.PageType,
            AutoTopology: page.AutoTopology,
            PageTemplate: page.PageTemplate,
            IsLandingPage: page.IsLandingPage,
            IsDrivePage: page.IsDrivePage,
            ScoreRule: page.ScoreRule,
            PageTags: page.PageTags,
        };
        return pageDetails;
    }

    getBiButton(button: Button): BiButton {
        const caption = button.CaptionDictionary && button.CaptionDictionary['DEF'] ? button.CaptionDictionary['DEF'] : button.Caption;
        const description = button.DescriptionDictionary && button.DescriptionDictionary['DEF'] ?
            button.DescriptionDictionary['DEF'] : button.Description;

        const biButton: BiButton = {
            Selected: button.Selected,
            Enabled: button.Enabled,
            Picture: button.Picture,
            Caption: caption,
            Price: button.Price,
            Description: description,
            Visible: button.Visible,
            ButtonType: button.ButtonType,
            PageID: button.PageID,
            DisplayMode: button.DisplayMode,
            DlgMessage: button.DlgMessage,
            Link: button.Link,
            Jump: button.Jump,
            MinQuantity: button.MinQuantity,
            ChargeThreshold: button.ChargeThreshold,
            MaxQuantity: button.MaxQuantity,
            Tags: button.Tags,
            Order: button.Order,
        };
        return biButton;
    }

    /**
     * Call this to add a "PAGE_VIEW" event
     * @param page: Page
     */
    logPageView(page: Page) {
        const hit = BiLogsService.getDOTXIXHit(BiLogsService.getPageTitle(page), 'PAGE', -1, 'PAGEVIEW');

        const biButtons = [];
        page.Buttons.forEach(button => {
            const biButton = this.getBiButton(button);
            biButtons.push(biButton);
        });

        const pageDetails = this.getPageDetails(page);
        pageDetails.Buttons = biButtons;

        hit.PageDetails = pageDetails;
        this.logEvent( hit );
    }


    /**
     * Called by all Event Listeners Types above to emit a new BI Log Event
     *
     * @param currentContext: Depends on Event Type
     */
    private emitNewBiLog(currentContext: any, eventType: string = ''): void {
        const log = {
            EventType: eventType || this.getEventType(currentContext),
            LogDateTime: (new Date()).format('yyyy-MM-ddTHH:mm:ss.SSS'),
            CommonRawData: this.getCommonRawData(),
            CurrentContext: currentContext
        };
        this._onNewBiLog.next(log);
        // console.log( JSON.stringify(log) );
    }

    convertToProductData(basketItem: Combo): ProductData {

        const product: ProductData = {
            Position: 1,
            ItemID: basketItem.ItemID,
            Name: basketItem.LName,
            Categ: '',
            Price: String(basketItem.Price),
            Combos: [],
            Visibility: false,
            Quantity: basketItem.Qty,
            History: basketItem.History,
            ProductCoupon: ''
        };
        if (basketItem.Visibility == 0) {
            product.Visibility = true;
        }
        if (basketItem.Combos && basketItem.Combos.length > 0) {
            basketItem.Combos.forEach(item => {
                product.Combos.push(this.convertToProductData(item));
            });
        }

        return product;
    }

    // **** Event Listeners *****

    listenForBasketEvents() {

        this.basketService.onBasketChangedStream.subscribe((event: any) => {
            if (event && event.action && event.item) {
                if (event.action == 'PRODUCT_ADD' ||
                    event.action == 'INCREMENT' ||
                    event.action == 'DECREMENT' ||
                    event.action == 'PRODUCT_REMOVE' ||
                    event.action == 'COMBOS_ADD') {

                    const product = this.convertToProductData(event.item);
                    const productList = {
                        ListName: '',
                        Products: [product]
                    };

                    let dotHit = BiLogsService.getDOTXIXHit('DETAIL_PAGE', 'BASKET', -1, event.action, 'PRODUCT');
                    dotHit.ProductList = [productList];

                    let eventName = '';

                    if (event.action == 'PRODUCT_ADD') {
                        dotHit = BiLogsService.getDOTXIXHit('DETAIL_PAGE', 'BASKET', -1, 'ADD', 'PRODUCT');
                        dotHit.ProductList = [productList];
                        if (event.item && event.item.History.type == 'suggestion') {
                            dotHit.ActionDetails.Value = 'SUGGESTIVE_FOR_PRODUCT';
                        } else {
                            // nothing
                        }

                        eventName = BIEventTypes.AddToCart;
                    } else if (event.action == 'INCREMENT') {
                        dotHit = BiLogsService.getDOTXIXHit('INCREASE_QUANTITY', 'BASKET', -1, 'ADD', 'PRODUCT');
                        dotHit.ProductList = [productList];
                        if (typeof dotHit.ProductList[0] !== 'undefined' && typeof dotHit.ProductList[0].Products[0] !== 'undefined') {
                            dotHit.ProductList[0].Products[0].Quantity = 1;
                        }
                        eventName = BIEventTypes.AddToCart;
                    } else if (event.action == 'DECREMENT') {
                        dotHit = BiLogsService.getDOTXIXHit('DECREASE_QUANTITY', 'BASKET', -1, 'REMOVE', 'PRODUCT');
                        dotHit.ProductList = [productList];
                        if (typeof dotHit.ProductList[0] !== 'undefined' && typeof dotHit.ProductList[0].Products[0] !== 'undefined') {
                            dotHit.ProductList[0].Products[0].Quantity = 1;
                        }
                        eventName = BIEventTypes.RemoveFromCart;
                    } else if (event.action == 'PRODUCT_REMOVE') {
                        dotHit = BiLogsService.getDOTXIXHit('DELETE_ORDER', 'BASKET', -1, 'REMOVE', 'PRODUCT');
                        dotHit.ProductList = [productList];
                        eventName = BIEventTypes.RemoveFromCart;
                    }

                    this.logEvent(dotHit, '', '', eventName);
                }

            }
        });
    }

    listenForNavigationEvents() {
        this.promotionsService.onPromoCodeRegisterd.subscribe((success: Boolean) => {
            const actionDetailsValue = success ? 'Promo code registered' : 'Promo code failed';
            const dotHit = BiLogsService.getDOTXIXHit(actionDetailsValue, 'PAGE', -1, 'EVENT');
            this.logEvent(dotHit, 'Promo Page', this.getBreadcrumb() + '/Promo Page/');
        });

        // As Print Service doesn't have a Observable, will use it's hookable function
        HookManager.register(HooksIdentifiers.PRINT, {
            before: (content: string, printerName: string = '') => {
                this.logEvent(BiLogsService.getDOTXIXHit('Print Job Started', 'PAGE', -1, 'EVENT'), '', '', BIEventTypes.PrintingStarted);
            },
            after: (content: string, printerName: string = '') => {
                this.logEvent(BiLogsService.getDOTXIXHit('Print Job Ended', 'PAGE', -1, 'EVENT'), '', '', BIEventTypes.PrintingEnded);
            }
        });

        // As Payment Service doesn't have a Observables, will use it's hookable functions:
        // HookManager.register(HooksIdentifiers.PAY_WITH_CARD, {
        //     before: (content: string, printerName: string = '') => {
        //         this.sendCheckoutEvent(2, 'Card');
        //         // const hitEvent = BiLogsService.getDOTXIXHit('Pay with Card Started', 'PAGE', -1, 'EVENT');
        //         // this.logEvent(hitEvent, '', '', BIEventTypes.CheckoutProcess);
        //     }
        // });

        HookManager.register(HooksIdentifiers.PAY_WITH_CASH, {
            before: (printerName: string = '') => {
                this.sendCheckoutEvent(2, 'Cash');
                // const hitEvent = BiLogsService.getDOTXIXHit('Pay with Cash Started', 'PAGE', -1, 'EVENT');
                // this.logEvent(hitEvent, '', '', BIEventTypes.CheckoutProcess);
            }
        });

        HookManager.register(HooksIdentifiers.PAY_WITH_CASH_ENDED, {
            before: (amountToBeKept: number, paymentName: string) => {
                const hitEvent = BiLogsService.getDOTXIXHit('Pay with Cash Ended', 'PAGE', -1, 'EVENT');
                this.logEvent(hitEvent, '', '', BIEventTypes.CheckoutProcess2);
                this.logEvent(BiLogsService.getDOTXIXHit('Payment', 'PAGE', -1, 'PAGEVIEW'),
                'Payment', 'Payment',  BIEventTypes.PageViewTracking);

            }
        });

        HookManager.register(HooksIdentifiers.PAY_WITH_EPAY, {
            before: (content: string, printerName: string = '') => {
                const hitEvent = BiLogsService.getDOTXIXHit('Pay with ePay Started', 'PAGE', -1, 'EVENT');
                this.logEvent(hitEvent, '', '', BIEventTypes.CheckoutProcess2);
                this.logEvent(BiLogsService.getDOTXIXHit('Payment', 'PAGE', -1, 'PAGEVIEW'),
                'Payment', 'Payment',  BIEventTypes.PageViewTracking);
            }
        });
    }

    listenForSettingsEvents() {
        this.basketService.onSetServiceType.subscribe((st: 'in' | 'out') => {
            const dotHit = BiLogsService.getDOTXIXHit(st == 'in' ? 'EAT_IN' : 'TAKE_AWAY', 'PAGE', -1, 'SET_CHOICE', 'SETTINGS');
            this.logEvent(dotHit, 'WelcomeScreen', '/WelcomeScreen/', BIEventTypes.OrderChoiceSelection);
        });

        this.internationalizationService.onSetLanguage.subscribe((language: Language) => {
            const dotHit = BiLogsService.getDOTXIXHit(language.code, 'PAGE', -1, 'SET_LANGUAGE', 'SETTINGS');
            this.logEvent(dotHit, 'WelcomeScreen', '/WelcomeScreen/', BIEventTypes.LanguageSelection);
        });
    }


    listenForSessionEvents() {
        this.userService.onStartSession.subscribe(x => {
            const dotHit = BiLogsService.getDOTXIXHit('START_ORDER', 'PAGE', -1, 'START', 'SESSION');
            this.logEvent(dotHit, 'WelcomeScreen', '/WelcomeScreen/', BIEventTypes.SessionTracking);
        });
        this.userService.onStopSession.subscribe((x: OrderCloseCause) => {
            const dotHit = BiLogsService.getDOTXIXHit(x, 'PAGE', -1, 'END', 'SESSION');
            this.logEvent(dotHit, '', '', BIEventTypes.SessionTracking);
        });
    }

    listenForCheckoutEvents() {
        this.basketService.onValidateOrder.subscribe(x => {
            this.sendCheckoutEvent(1, '');
        });
    }
    listenForCashPayment() {
        this.orderCheckoutService.onPayWithCash().subscribe(x => {
            this.sendCheckoutEvent(2, 'Cash');
        });
    }


    // **** Data *****
    private getBiTags(): string {
        return this.orderAreaService.currentPage.PageTags ?
            this.orderAreaService.currentPage.PageTags :
            this.orderAreaService.popupPage && this.orderAreaService.popupPage.PageTags ?
                this.orderAreaService.popupPage.PageTags :
                '';
    }

    private getPageTitle(): string {
        return this.orderAreaService.popupPage ?
            BiLogsService.getPageTitle(this.orderAreaService.popupPage) :
            BiLogsService.getPageTitle(this.orderAreaService.pageHistory.last());
    }

    public getBreadcrumb(): string {
        const pageHistory = this.orderAreaService.pageHistory
            .map(x => {
                return BiLogsService.getPageTitle(x);
            })
            .reduce((breadcrumb: string, currentName: string) => {
                return breadcrumb + '/' + currentName;
            }, '');
        let ret = pageHistory;
        ret += this.orderAreaService.popupPage ? ('/' + BiLogsService.getPageTitle(this.orderAreaService.popupPage)) : '';
        return ret;
    }

    private getEventType(currentContext: any): string {
        // Check if is an App Button click:
        if (currentContext.DOTXIXHit &&
            currentContext.DOTXIXHit.Category == 'NAVIGATION' &&
            currentContext.DOTXIXHit.Action == 'CLICK') {
            return BIEventTypes.AppButtonClick;
        }

        // Check if is an Page View Event:
        if (currentContext.DOTXIXHit &&
            currentContext.DOTXIXHit.Category == 'NAVIGATION' &&
            currentContext.DOTXIXHit.Action == 'PAGEVIEW') {
            return BIEventTypes.PageViewTracking;
        }


        return 'Unknown';
    }



    // Will return the basic JSON
    private getCommonRawData(): CommonRawData {
        const commonData = <CommonRawData>{};
        commonData.BIDestionationParams = this.configurationService.biDestionationParams;
        commonData.Brand = this.configurationService.companyName;
        commonData.CampaignName = this.contentService.mainPage['CampaignName'];
        commonData.SourceHost = {
            KioskId: this.configurationService.kioskId,
            StoreName: this.configurationService.storeName,
            StoreCode: this.configurationService.storeCode
        };
        commonData.Application = {
            Provider: 'Acrelec',
            Category: this.configurationService.applicationCategory,
            Name: this.configurationService.applicationName,
            Version: this.configurationService.applicationVersion
        };
        commonData.MarketTags = {
            Store: this.configurationService.marketTagsStore,
            Kiosk: this.configurationService.marketTagsKiosk
        };
        commonData.GeneralContext = {
            Language: this.internationalizationService.currentLanguage.code,
            SessionId: this.userService.sessionId,
            ScreenResolution: window.innerHeight + ' X ' + window.innerWidth,
            CustomerChoice: this.basketService.serviceType() === 'in' ? 'EAT_IN' : 'TAKE_OUT',
            DisplayMode: this.configurationService.displayMode,
            Currency: {
                Name: this.configurationService.currencyName,
                Symbol: this.configurationService.currencySymbol
            }
        };

        return commonData;
    }

    sendCheckoutEvent(step: number, option: string) {
        const products: Array<ProductData> = [];
        this.basketService.basket.Order.Combos.forEach(item => {
            const product = this.convertToProductData(item);
            products.push(product);
        });
        const dotHit = BiLogsService.getDOTXIXHit(step.toString(), '', -1, 'CHECKOUT_STEP');
        dotHit.CheckoutDetails = {
            Products: products,
            Step: step,
            Option: option
        };
        // let bitype:  BIEventTypes;
        // (step === 1 ) ? bitype = BIEventTypes.CheckoutProcess1 : bitype = BIEventTypes.CheckoutProcess2;
        // this.logEvent(dotHit,  this.getPageTitle(), this.getBreadcrumb(), bitype);
        if (step === 1) {
            this.logEvent(dotHit,  this.getPageTitle(), this.getBreadcrumb(), BIEventTypes.CheckoutProcess1);
            this.logEvent(BiLogsService.getDOTXIXHit('Order Summary', 'PAGE', -1, 'PAGEVIEW'),
                'Order Summary', 'Order Summary',  BIEventTypes.PageViewTracking);
        } else {
            this.logEvent(dotHit,  this.getPageTitle(), this.getBreadcrumb(), BIEventTypes.CheckoutProcess2);
            this.logEvent(BiLogsService.getDOTXIXHit('Payment', 'PAGE', -1, 'PAGEVIEW'),
                'Payment', 'Payment',  BIEventTypes.PageViewTracking);
        }
    }

    sendPurchaseEvent(transactionId: string, tax: string) {
        const products: Array<ProductData> = [];
        this.basketService.basket.Order.Combos.forEach(item => {
            const product = this.convertToProductData(item);
            products.push(product);
        });
        const dotHit = BiLogsService.getDOTXIXHit('Purchase');
        dotHit.TransactionDetails = {
            OrderTotal: (this.basketService.orderTotal / 100).toFixed(2),
            TransactionId: transactionId,
            Taxes: tax
        };
        dotHit.CheckoutDetails = {
            Products: products };
        this.logEvent(dotHit, this.getPageTitle(), this.getBreadcrumb(), BIEventTypes.PurchaseTracking);
    }
}
