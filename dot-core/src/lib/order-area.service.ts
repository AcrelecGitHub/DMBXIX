import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { Log } from './logger/log';
import { ContentService } from './content.service';
import { BasketService } from './basket.service';
import { Hookable } from './decorators/hookable.decorator';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { Page, Button, Language } from './models';
import { CustomerService } from './customer.service';
import { InternationalizationService } from './internationalization.service';
import { SuggestiveSalesService } from './suggestive-sales.service';
import { ModifiersService } from './modifiers.service';
import { ConfigurationService } from './configuration.service';
import { CombosService } from './combos.service';

@Injectable({
    providedIn: 'root'
})
export class OrderAreaService {

    private _onInitializeCombo: Subject<any> = new Subject();
    private _onCancelCombo: Subject<any> = new Subject();
    private _onCloseCombo: Subject<any> = new Subject();

    private _onPersonalization: Subject<any> = new Subject();
    private _onOpenModifier: Subject<any> = new Subject();
    private _onCloseKeyboard: Subject<any> = new Subject();

    private _onHome = new Subject<any>();
    private _onBack = new Subject<any>();
    private _openPromo = new Subject<any>();
    private _closePromo = new Subject<any>();


    private _onButtonHit = new Subject<Button>();
    private _onAgeConfirmationRequired = new Subject<Button>();
    private _onShowMessage = new Subject<string>();


    private _pageHistory: Page[];
    private _popupPage: Page;
    private tunnelPages: Page[];
    private crtIndex = 0;

    constructor(private contentService: ContentService,
        private customerService: CustomerService,
        private basketService: BasketService,
        private modifierService: ModifiersService,
        private suggestiveSalesService: SuggestiveSalesService,
        private configurationService: ConfigurationService,
        private internationalizationService: InternationalizationService) {

        this.basketService.onStartOrder.subscribe(() => this.reset());
        this.reset();
        internationalizationService.onSetLanguage.subscribe((language: Language) => this.onSetLanguage(language));
        basketService.onBasketChangedStream.subscribe(basketItem => this.basketChanged(basketItem));
        basketService.onBasketItemsRemoved.subscribe(removed => this.basketItemRemoved(removed));
    }

    get isHome(): boolean {
        return this.currentPage === this.contentService.mainPage;
    }

    get canBack(): boolean {
        return this._pageHistory.length > 1;
    }

    private onSetLanguage(language: Language) {
        this._pageHistory = [this.contentService.mainPage];
    }

    get currentPage(): Page {
        return this._pageHistory.last();
    }

    get pageHistory(): Page[] {
        return this._pageHistory;
    }

    get popupPage(): Page {
        return this._popupPage;
    }

    get onHome(): Observable<any> {
        return this._onHome.asObservable();
    }

    get onBack(): Observable<any> {
        return this._onBack.asObservable();
    }

    get onOpenPromo(): Observable<any> {
        return this._openPromo.asObservable();
    }
    get onClosePromo(): Observable<any> {
        return this._closePromo.asObservable();
    }

    get onButtonHit(): Observable<Button> {
        return this._onButtonHit.asObservable();
    }

    get onAgeConfirmationRequired(): Observable<Button> {
        return this._onAgeConfirmationRequired.asObservable();
    }

    get onShowMessage(): Observable<string> {
        return this._onShowMessage.asObservable();
    }

    onInitializeCombo() {
        return this._onInitializeCombo.asObservable();
    }

    async initializeCombo(button: Button, keepReference: Boolean = false) {
        let comboItem = null;
        if (keepReference == true) {
            comboItem = button;
        } else {
            comboItem = JSON.parse(JSON.stringify(button));
        }
        this._onInitializeCombo.next(comboItem);
    }


    onCancelCombo() {
        return this._onCancelCombo.asObservable();
    }

    async cancelCombo() {
        this._onCancelCombo.next();
    }

    onCloseCombo() {
        return this._onCloseCombo.asObservable();
    }

    async closeCombo() {
        this._onCloseCombo.next();
    }

    private basketItemRemoved(removed: Array<string>) {
        let message = this.internationalizationService.translate('20191010001');
        if (removed.length === 1) {
            message = this.internationalizationService.translate('20191010002');
        }
        const strRemoved = removed.join(', ');
        this.showMessage(message.split('{$items}').join(strRemoved));
    }


    private reset(): void {
        let page: Page;

        const localCustomer = this.customerService.getCustomerFID();
        if (localCustomer) {
            page = this.contentService.hiddenPages.find(_ => _.ID === '4488');
            if (page) {
                (<any>page).Title = 'Welcome back ' + localCustomer;
            }
        }

        if (!page && this.contentService.pages) {
            page = this.contentService.pages.find(_ => _.IsLandingPage) || this.contentService.mainPage;
        }

        this._pageHistory = [page];
        this._popupPage = null;
    }

    goHome(): void {
        this._pageHistory = [this.contentService.mainPage];
        this._popupPage = null;
        this._onHome.next();
    }

    goBack(): void {
        if (this._popupPage) {
            this._popupPage = null;
        } else if (this._pageHistory.length > 1) {
            this._pageHistory.pop();
        }
        this._onBack.next();
    }

    openPromo() {
        this._openPromo.next();
    }

    closePromo() {
        this._closePromo.next();
    }

    initNewPage(button: Button) {
        const lastPage = this._pageHistory.last();
        this.basketService.registerProductsCatalog(this.contentService);


        /*
        const suggestivePageId = '5';
        if ( lastPage && lastPage.ID == suggestivePageId) {
            //  page id
            const mediaPage = this.contentService.findAnyItemByType(this.contentService.pages, 'ID', 11386, 'Link');
            // console.log('------- generate media page ---------', mediaPage);
            this.mediacreatorService.generateMedia( mediaPage, 2 );
          }
        */

        if (button.Page.ID == '172') {
            button.Page['PageTags'] = 'BI_LOG_ProductImpressions';
        } else if ( button.Page.ID == '8' ) {
            button.Page['PageTags'] = 'BI_LOG_PromoImpressions';
        }

        this._pageHistory.push(button.Page);
    }

    initNewPopupPage(page: Page) {
        page = this.filterJunkPages(page);
        this.basketService.continueOrder();

        this._popupPage = page;
    }


    async buttonHit(button: Button) {
        if (button.ButtonType === 10) {
            this.openPromo();
            return;
        }


        if (this._popupPage) {
            this._popupPage = null;
        }

        if (button.Page) {
            if (this.isPopup(button)) {
                this.initNewPopupPage(button.Page);
            } else {
                this.initNewPage(button);
            }

            return;
        }

        if (button.GroupPage) {
            this._popupPage = button.GroupPage;
            return;
        }

        if (button.DlgMessage) {
            this._onAgeConfirmationRequired.next(button);
            return;
        }

        if (button.ComboPage) {
            Log.info('Button contains a combo. Combo builder will be started...');
            this.initializeCombo(button);
            return;
        }

        if ((<any>button).Link == 'recomended') {
            this.addRecomendedProducts();
            return;
        }

        this.personalizeItemAndAddToBasket(button);
    }

    public personalizeItemAndAddToBasket(item: Button) {
        // convert simple item to combos
        if ( this.modifierService.checkIfComboWrapperIsNeeded(item)) {
          const convertedButton = this.modifierService.convertToComboBuilderItem(item);
          this.itemPersonalization(convertedButton);
          return;
      }

      if (item.ModifiersPage && item.ModifiersPage.Modifiers && item.ModifiersPage.Modifiers.length > 0) {
          this.itemPersonalization(item);
          return;
      }

      this.basketService.addProduct(item);
    }

    public showMessage(message: string) {
        this._onShowMessage.next(message);
    }

    private isPopup(button: Button): boolean {
        if (button.Page.PageType == 'Main') {
            if (button.Page.PageMode == 'Popup') {
                return true;
            } else {
                return false;
            }
        }
        if (button.Page.PageType == 'ItemPack') {
            return true;
        }

        if (button.Page.PageType == 'Promo') {
            return true;
        }

        if (button.Page.PageType == 'Group') {
            return true;
        }

        if (button.Page.PageType == 'MultiPage') {
            return true;
        }

        if (button.Page.FormStyle == 'multiPageTags') {
            return true;
        }

        return false;
    }

    async addRecomendedProducts(): Promise<void> {
        const recomendedProducts = [];
        if (this.customerService.customers.man == 1) {
            recomendedProducts.push(157);
            recomendedProducts.push(10162);
            recomendedProducts.push(115330269);
        }

        if (this.customerService.customers.woman == 1) {
            recomendedProducts.push(1973);
            recomendedProducts.push(9601);
            recomendedProducts.push(17145);
        }

        const tasks = recomendedProducts.map(_ => this.contentService.products.find(product => product.Link === _))
            .filter(_ => !!_).map(_ => () => this.basketService.addProduct(_));

        return Promise.runSerial(tasks).then(() => Log.info('Recomended products {0} added successfully!', recomendedProducts));
    }

    async validateOrder() {
        const suggestivePages = await this.suggestiveSalesService.completeSuggestion();
        if (suggestivePages) {
            await this.startTunnel(suggestivePages);
        }

        if (this.tunelIsOpen() === false) {
            Log.debug(this.basketService.basket.Order);
            this.basketService.validateOrder();
        }
    }

    onOpenModifier() {
        return this._onOpenModifier.asObservable();
    }

    @Hookable(HooksIdentifiers.OPEN_MODIFIER)
    async openModifier(event) {
        this._onOpenModifier.next(event);
    }

    onCloseKeyboard() {
        return this._onCloseKeyboard.asObservable();
    }

    closeKeyboard() {
        this._onCloseKeyboard.next();
    }

    onItemPersonalization() {
        return this._onPersonalization.asObservable();
    }

    itemPersonalization(item) {

        let  personalisationItem: any;
        if (item.LaunchedFromCombo == true) {
            // for combos keep reference, but the entire combo needs to be cloned
            personalisationItem = item;
        } else {
            // clone in order to break reference to the initial object and not contaminate the data received from bridge
            personalisationItem = JSON.parse(JSON.stringify(item));
        }

        this.modifierService.currentPersonalizationItem = this.modifierService.aplyImplicitQuantities(personalisationItem);

        this._onPersonalization.next(this.modifierService.currentPersonalizationItem);
    }

    itemRepersonalization(item, onlySpecialModifers: boolean = false) {
        const modificationItem = this.basketService.getItemFromPersonalisationHistory(item.UUID);

        if (item && item['SinglePersonalizationItem']) {
            modificationItem['SinglePersonalizationItem'] = item['SinglePersonalizationItem'];
        }

        // if is a combo send to the combos branch
        if (modificationItem.ComboPage) {
            Log.info('Modifing a combo. Combo builder will be started...');
            this.initializeCombo(modificationItem);
            this.basketService.continueOrder();
            return;
        }


        // if it is a modifier send to the modifier branch
        // clone in order to break reference to the initial object
        // and not contaminate the object in basket in case the user wants to cancel
        this.modifierService.currentPersonalizationItem = JSON.parse(JSON.stringify(modificationItem));
        if (onlySpecialModifers) {
            this.modifierService.currentPersonalizationItem['popupType'] = 'OnSpecialModify';
        } else {
            this.modifierService.currentPersonalizationItem['popupType'] = 'OnModify';
        }
        this._onPersonalization.next(this.modifierService.currentPersonalizationItem);
        this.basketService.continueOrder();
    }

    async startTunnel(pages: Page[]) {
        this.tunnelPages = pages;
        this.crtIndex = 0;
        this.checkNextTunnelPage();
    }

    checkNextTunnelPage() {
        if (this.tunnelPages && this.crtIndex < this.tunnelPages.length) {
            this.initNewPopupPage(this.tunnelPages[this.crtIndex]);
            this.crtIndex++;
        } else {
            this.tunnelPages = [];
            if (this.crtIndex > 0) {
                Log.debug(this.basketService.basket.Order);
                this.basketService.validateOrder();
                this.crtIndex = 0;
            }

        }
    }

    backToTunnelPage() {
        if (this.tunnelPages && this.crtIndex <= this.tunnelPages.length && this.crtIndex > 0) {
            this.initNewPopupPage(this.tunnelPages[this.crtIndex - 1]);
        } else {
            this.tunnelPages = [];
            if (this.crtIndex > 0) {
                Log.debug(this.basketService.basket.Order);
                this.basketService.validateOrder();
                this.crtIndex = 0;
            }

        }
    }

    backToPreviousTunnelPage() {
        if (this.tunnelPages && this.crtIndex <= this.tunnelPages.length && this.crtIndex > 1) {
            this.initNewPopupPage(this.tunnelPages[this.crtIndex - 1]);
        } else {
            this.tunnelPages = [];
            if (this.crtIndex > 0) {
                Log.debug(this.basketService.basket.Order);
                if (this._popupPage) {
                    this._popupPage = null;
                }
                this.basketService.continueOrder();
                this.crtIndex = 0;
            }

        }
    }


    tunelIsOpen(): boolean {
        if (this.tunnelPages && this.tunnelPages.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    basketChanged(basketItem) {
        this.checkNextTunnelPage();
    }

    skipCurrentStep() {
        this.checkNextTunnelPage();
    }

    exitTunnel() {
        this.tunnelPages = [];
        Log.debug(this.basketService.basket.Order);
        this.basketService.validateOrder();
        this.crtIndex = 0;
    }
    cancelTunnel() {
        this.tunnelPages = [];
        Log.debug(this.basketService.basket.Order);
        this.basketService.continueOrder();
        this.crtIndex = 0;
    }

    filterJunkPages(page: Page): Page {
        if (page.PageType === 'Promo') {
            if (page.Buttons.length === 1 && page.Buttons[0].Page) {

                const pg = page.Buttons[0].Page;
                if (pg.Title == null || pg.Title == '') {
                    pg.Title = this.internationalizationService.translate('20190902001');
                }

                return this.filterJunkPages(pg);
            } else {
                const pg = page;
                if (pg.Title == null || pg.Title == '') {
                    pg.Title = this.internationalizationService.translate('20190902001');
                }
                return pg;
            }
        } else {
            const pg = page;
            if (pg.Title == null || pg.Title == '') {
                pg.Title = this.internationalizationService.translate('20190902001');
            }
            return pg;
        }
    }

    hasMinAmount(): boolean {
        return (this.basketService.orderTotal >= this.configurationService.minOrderAmount);
    }

    modifierIsClosed(canceled: boolean) {
        Log.debug('modifier is closed');
        if (this.tunelIsOpen()) {
            if (canceled === true) {
                this.backToTunnelPage();
            } else {
                this.checkNextTunnelPage();
            }
        }
    }
}
