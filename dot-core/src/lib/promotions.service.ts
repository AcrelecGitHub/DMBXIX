import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';

import { ConfigurationService } from './configuration.service';
import { BasketService } from './basket.service';
import { Log } from './logger/log';
import { Promotions, Promo } from './models/promotions.model';
import { ContentService } from './content.service';
import { Page, ProductHistory, PromoInfo, Button, PromoDescription } from './models';
import { OrderAreaService } from './order-area.service';
import { InternationalizationService } from './internationalization.service';

@Injectable({
    providedIn: 'root'
})
export class PromotionsService {

    private _onPromoCodeRegisterd: Subject<boolean> = new Subject();
    private _barcode: string;
    private _messageError = '';
    private _openBarcodePromo = new Subject<any>();

    public promos: Promotions;

    public get barcode(): string {
        return this._barcode;
    }

    constructor(private configurationService: ConfigurationService,
        private http: HttpClient,
        private contentService: ContentService,
        private orderAreaService: OrderAreaService,
        private basketService: BasketService,
        private internationalizationService: InternationalizationService) { }

    public set barcode(newBarcode: string) {
        // AGA - CAF to be refactored.
        // This setter lies, it should at a maximum check for the barcode to be valid
        // Not all this complicated stuff.
        this._barcode = newBarcode;
        const promoPage = this.getPromos(true);
        this._onPromoCodeRegisterd.next(!!promoPage);
        if (promoPage) {
            if (promoPage.Buttons.length === 1 && promoPage.Buttons[0].Page) {
                promoPage.Buttons[0].Page.Title = promoPage.Buttons[0].Page.Title ||
                                                  this.internationalizationService.translate('20190902001');
                this.orderAreaService.initNewPopupPage(promoPage.Buttons[0].Page);
            } else {
                this.orderAreaService.initNewPopupPage(promoPage);
            }
        } else {
            if (this._messageError !== '') {
                this.orderAreaService.showMessage(this._messageError);
                this._messageError = '';
            } else {
                this.orderAreaService.showMessage('2017012703');
            }
            Log.debug('No promo page');
        }
    }

    get onPromoCodeRegisterd() {
        return this._onPromoCodeRegisterd.asObservable();
    }

    get onOpenBarcodePromo(): Observable<any> {
        return this._openBarcodePromo.asObservable();
    }
    onOpenBarcodePromoPromo() {
        this._openBarcodePromo.next();
    }


    async initialize() {
        const url = this.configurationService.assetsPath + 'assets/dpsPages.json?t=' + Date.now();
        this.promos = await this.http.get<any>(url).toPromise().catch(e => {
            Log.error('promotions.initialize: Could not load promotions. Error: ', e['message']);
            return null;
        });
        return !!this.promos;
    }

    getPromos(withBarcode: boolean = false): Page {
        const promoPage: Page = this.contentService.findAnyItemByType(this.contentService.hiddenPages, 'PageType', 'MainPromo', 'Link');
        if (promoPage) {
            let copyPromoPage: Page = JSON.parse(JSON.stringify(promoPage)); // Deep copy from promoPage
            const isValidPage = this.validateButtons(copyPromoPage, withBarcode);
            if (isValidPage) {
                copyPromoPage = this.addPromoInfoToButtons(copyPromoPage);
                return copyPromoPage;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    addPromoInfoToButtons(page: Page) {
        if (page.Buttons) {
            page.Buttons.forEach(button => {
                const history: ProductHistory = this.getProdHistory(button);
                button.History = history;
                if (button.Page) {
                    this.addPromoInfoToButtons(button.Page);
                }
            });
        }
        return page;
    }

    setBarcodeAndCheckForPromo(barcode: string) {
      this._barcode = barcode;

      const promoPage = this.getPromos(true);
      if (promoPage) {
        if (promoPage.Buttons.length === 1 && promoPage.Buttons[0].Page) {
              promoPage.Buttons[0].Page.Title = promoPage.Buttons[0].Page.Title ||
                this.internationalizationService.translate('20190902001');
              this.orderAreaService.initNewPopupPage(promoPage.Buttons[0].Page);
          } else {
              this.orderAreaService.initNewPopupPage(promoPage);
          }

          return promoPage;
      }

      return null;
    }

    validateButtons(lPage: Page, withBarcode: boolean): boolean {
        let validPromo = false;
        for (let i = lPage.Buttons.length - 1; i >= 0; i--) {
            const button = lPage.Buttons[i];
            validPromo = this.checkPromoButton(button.Link, withBarcode);
            if (!validPromo && button.Page) {
                validPromo = this.validateButtons(button.Page, withBarcode);
            }
            if (!validPromo) {
                lPage.Buttons.splice(i, 1);
            }
        }
        if (lPage.Buttons.length > 0) {
            lPage.Buttons.forEach((button, index) => {
                button.Order = index + 1;
            });
        }
        return lPage.Buttons.length > 0;
    }

    getProdHistory(button: Button): ProductHistory {

        const promoItem: Promo = this.getPromoDetails(button.Link);

        const promoInfo: Promo = promoItem;

        const history: ProductHistory = {
            promo: promoInfo,
            sugestion: null,
            type: 'promo'
        };
        return history;
    }

    getPromoDetails(btnLink: string): Promo {
        const promoList = this.promos && this.promos.PromoList ? this.promos.PromoList : [];
        const promoFound = promoList.find(promo => promo.PageID === btnLink ||
            (promo.Description.PromoButtonList &&
                promo.Description.PromoButtonList.some(y => y.ID.toString() === btnLink.split('Promo').join(''))));
        return promoFound as Promo;
    }

    checkPromoButton(btnLink: string, withBarcode: boolean): boolean {
        let lResult = false;
        const promoList = this.promos && this.promos.PromoList ? this.promos.PromoList : [];
        const promoFound = promoList.find(promo => promo.PageID === btnLink ||
            (promo.Description.PromoButtonList &&
                promo.Description.PromoButtonList.some(y => y.ID.toString() === btnLink.split('Promo').join(''))));
        if (promoFound) {
            lResult = (withBarcode) ? this.checkBarcode(promoFound) : !this.hasBarcode(promoFound);
            if (promoFound.Type === 'ProductDiscount') {
                lResult = lResult && this.checkCondition(promoFound, btnLink);
            }
        }
        return lResult;
    }

    checkBarcode(lPromo: Promo): boolean {
        return (lPromo.Description.Barcode && lPromo.Description.Barcode.split('\\b').join('') === this._barcode) ? true : false;
    }

    hasBarcode(lPromo: Promo): boolean {
        return (lPromo.Description.Barcode) ? true : false;
    }

    checkCondition(lPromo: Promo, btnLink: string): boolean {

        const lResult = this.basketService.validateCondition(lPromo);
        if (lResult === false) {
            if (lPromo.Description.LblNoItemDictionary) {
                this._messageError = this.internationalizationService.getMessageFromDictionary(lPromo.Description.LblNoItemDictionary);
            } else if (lPromo.Description.LblNoItem) {
                this._messageError = lPromo.Description.LblNoItem;
            } else {
                this._messageError = this.internationalizationService.translate('2019090501');
            }
        }
        return lResult;
    }

    showPromos() {
        const promotions = this.getPromos();
        if (promotions) {
            promotions.Buttons.forEach((promoBtn, index) => {
                if (promoBtn.Page && promoBtn.Page.Buttons && promoBtn.Page.Buttons.length === 1) {
                    const order = promoBtn.Order;
                    promotions.Buttons[index] = promoBtn.Page.Buttons[0];
                    promotions.Buttons[index].Order = order;
                }
            });
            if (this.promos.PromoList.some(_ => !!_.Description.Barcode)) {
                // create a new button with barcode promo
                const newBarcodeButton = {
                    Picture: 'coupon-voucher.png',
                    Caption: this.internationalizationService.translate('20190924002'),
                    ButtonType: 10, // PROMO_BUTTON
                };
                const barcodePromos = this.contentService.createButton(newBarcodeButton);
                promotions.Buttons.push(barcodePromos);
            }

            // create a new button that contains promo page
            const promoButton = {
                Page: JSON.parse(JSON.stringify(promotions))
            };
            promoButton.Page['Title'] = this.internationalizationService.translate('20190924001');
            const newPromos = this.contentService.createButton(promoButton);
            this.orderAreaService.initNewPage(newPromos);
        } else {
            this.orderAreaService.openPromo();
        }
        this._messageError = '';
    }


    // addPromotion(): number {

    //     let nLen: number;
    //     nLen = this.promotions.length;
    //     const lPromo = new GlobalPromotions;

    //     lPromo.promoPolicyID = '';
    //     lPromo.promoDiscountPOSID = '';
    //     lPromo.actualState = 0; // Active
    //     lPromo.promoCount = 1;

    //     this.promotions.push(lPromo);
    //     return nLen;
    // }

    // getPromoStatus(promoRef: number): number {
    //     let lResult = PromoStatus.promoStatusNone;
    //     if (promoRef >= 0 && promoRef < this.promotions.length) {
    //         if (this.promotions[promoRef].actualState === 0) {
    //             lResult = this.promotions[promoRef].promoStatus;
    //         }
    //     } else if (promoRef !== PromoStatus.noPromoRef) {ks
    //         this.lastErr = 'Invalid PromoRef (' + promoRef.toString() + ')';
    //     }
    //     return lResult;
    // }

    // getPromoPrice(promoRef: number): number {
    //     let lResult = 0;
    //     if (promoRef >= 0 && promoRef < this.promotions.length) {
    //         if (this.promotions[promoRef].actualState === 0) {
    //             lResult = this.promotions[promoRef].promoPrice;
    //         }
    //     } else if (promoRef !== PromoStatus.noPromoRef) {
    //         this.lastErr = 'Invalid PromoRef (' + promoRef.toString() + ')';
    //     }
    //     return lResult;
    // }

    // getRegularPrice(promoRef: number): number {
    //     let lResult = 0;
    //     if (promoRef >= 0 && promoRef < this.promotions.length) {
    //         if (this.promotions[promoRef].actualState === 0) {
    //             lResult = this.promotions[promoRef].regularPrice;
    //         }
    //     } else if (promoRef !== PromoStatus.noPromoRef) {
    //         this.lastErr = 'Invalid PromoRef (' + promoRef.toString() + ')';
    //     }
    //     return lResult;
    // }

    // getPromoDiscountID(promoRef: number): string {
    //     let lResult: string = PromoStatus.noPromoPosId;
    //     if (promoRef >= 0 && promoRef < this.promotions.length) {
    //         if (this.promotions[promoRef].actualState === 0) {
    //             lResult = this.promotions[promoRef].promoDiscountPOSID;
    //             if (lResult === PromoStatus.noPromoPosId) {
    //                 // Result = GetAttributeValueFromNodeCaseUnsensitive(GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode,
    //                 // Names.Attrs.PosDiscountID, NOPROMOPOSID);
    //                 lResult = this.promotions[promoRef].ReferenceJSON['PosDiscountID'];
    //                 this.promotions[promoRef].promoDiscountPOSID = lResult;
    //             }
    //         }
    //     } else if (promoRef !== PromoStatus.noPromoRef) {
    //         this.lastErr = 'Invalid PromoRef (' + promoRef.toString() + ')';
    //     }
    //     return lResult;
    // }

    // getPromoCount(promoExclusiveGroup: string): number {
    //     let lResult = 0;
    //     for (let i = 0; i < this.promotions.length; i++) {
    //         const ExclusiveGroup = this.promotions[i].ReferenceJSON['ExclusiveGroup'];
    //         // 20140925 SBO In order to increment the number of promotions, add the condition that promotion is also active
    //         if (ExclusiveGroup === promoExclusiveGroup && this.promotions[i].actualState === 0) {
    //             lResult++;
    //         }
    //     }
    //     return lResult;
    // }

    // havePromoWithPurchaseRequired(lng, defLng: string): string {
    //     let lPromoName = '';

    //     for (let i = 0; i < this.promotions.length; i++) {
    //         if (this.promotions[i].actualState !== 0) {
    //             continue;
    //         }

    //         if (this.promotions[i].ReferenceJSON) {
    //             const purchaseRequiredAttr = this.promotions[i].ReferenceJSON['Description']['@PurchaseRequired'];
    //             if (purchaseRequiredAttr) {
    //                 if (purchaseRequiredAttr === '1') {
    //                     const promoNameAttr = this.promotions[i].ReferenceJSON['Description']['LblName'];
    //                     if (promoNameAttr) {
    //                         lPromoName = this.promotions[i].ReferenceJSON['Description']['LblName']['Lng'];
    //                     }
    //                     if (lPromoName === '') {
    //                         lPromoName = this.promotions[i].ReferenceJSON['Description']['LblName']['DefLng'];
    //                     }
    //                 }
    //             }
    //             break;
    //         }
    //     }
    //     return lPromoName;
    // }

    // removePromotion(promoRef: number) {
    //     const nLen = this.promotions.length;
    //     if (promoRef >= nLen || promoRef < 0) {
    //         return;
    //     }
    //     for (let i = promoRef; i <= nLen - 2; i++) {
    //         this.promotions[i] = this.promotions[i + 1];
    //     }
    //     this.promotions.length = nLen - 1;
    // }

    // clearAllPromo() {
    //     /*let i = 0;
    //     while (i < this.promotions.length) {
    //      this.removePromotion(i);
    //     }*/
    //     this.promotions.length = 0;
    // }

    // cancelPromotion(promoRef: number) {
    //     const nLen = this.promotions.length;
    //     if (promoRef >= nLen || promoRef < 0) {
    //         return;
    //     }
    //     if (this.promotions[promoRef].actualState = 0) {
    //         this.promotions[promoRef].actualState = 1;
    //     }
    // }

    // activatePromotion(promoRef: number) {
    //     const nLen = this.promotions.length;
    //     if (promoRef >= nLen || promoRef < 0) {
    //         return;
    //     }
    //     if (this.promotions[promoRef].actualState = 1) {
    //         this.promotions[promoRef].actualState = 0;
    //     }
    // }

    // checkPromoCondition(promoRef: number): Boolean {

    //     // returns true if promo still validates all conditions
    //     let lResult = true;
    //     // const lPage: any;
    //     let nMinUAmount: number;

    //     const nLen = this.promotions.length;
    //     if (promoRef >= nLen || promoRef < 0) {
    //         return;
    //     }
    //     if (this.promotions[promoRef].actualState = 0) {
    //         switch (this.promotions[promoRef].promoStatus) {
    //             case PromoStatus.promoStatusBarcode: {
    //                 /*nMinUAmount := XMLIntAttr(GetNodeByAttr(GetSubNodeTAgsByName(GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode,
    //                     Names.Nodes.Page {'Page'}), Names.Attrs.ID {'ID'}, GlobalPromoInfo.Promotions[PromoRef].ReferenceID),
    //                     Names.Attrs.MinUAmount {'MinUAmount'}, 0);*/
    //                 for (const i in this.promotions[promoRef].ReferenceJSON) {
    //                     if (this.promotions[promoRef].ReferenceJSON['Page'][i]['ID'] === this.promotions[promoRef].referenceID) {
    //                         nMinUAmount = parseInt(this.promotions[promoRef].ReferenceJSON['Page'][i]['MinUAmount'], 10);
    //                         break;
    //                     }
    //                 }
    //                 lResult = (this.basketService.orderTotal >= nMinUAmount);
    //                 break;
    //             }

    //             case PromoStatus.promoStatusFreeItem: {
    //                 /*nMinUAmount := XMLIntAttr(GetFirstSubNodeByName(
    //                   GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode, Names.Nodes.Description {'Description'}),
    //                   Names.Attrs.MinUAmount {'MinUAmount'}, 0);*/
    //                 nMinUAmount = this.promotions[promoRef].ReferenceJSON['Description']['MinUAmount'];
    //                 lResult = (this.basketService.orderTotal >= nMinUAmount);
    //                 // although it would be nice to verify any condition (Presence of IF item?)
    //                 // but not necessary
    //                 break;
    //             }
    //             case PromoStatus.promoStatusDiscAmount: {
    //                 /*nMinUAmount := XMLIntAttr(GetFirstSubNodeByName(
    //                   GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode, Names.Nodes.Description {'Description'}),
    //                   Names.Attrs.MinUAmount {'MinUAmount'}, 0);
    //                   */
    //                 nMinUAmount = this.promotions[promoRef].ReferenceJSON['Description']['MinUAmount'];
    //                 // cle 081104
    //                 lResult = (this.basketService.orderTotal >= nMinUAmount);
    //                 break;
    //             }

    //             case PromoStatus.promoStatusDirectpage: {
    //                 /*nMinUAmount := XMLIntAttr(GetFirstSubNodeByName(
    //                   GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode, Names.Nodes.Description {'Description'}),
    //                   Names.Attrs.MinUAmount {'MinUAmount'}, 0);*/
    //                 nMinUAmount = this.promotions[promoRef].ReferenceJSON['Description']['MinUAmount'];
    //                 // cle 081104
    //                 lResult = (this.basketService.orderTotal >= nMinUAmount);
    //                 break;
    //             }

    //             case PromoStatus.promoStatusTunnel:
    //             case PromoStatus.promoStatusTunnelSplit: {
    //                 // check promo conditions for PROMOSTATUS_TUNNEL
    //                 /*nMinUAmount := XMLIntAttr(GetFirstSubNodeByName(
    //                   GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode, Names.Nodes.Description {'Description'}),
    //                   Names.Attrs.MinUAmount {'MinUAmount'}, 0);*/
    //                 nMinUAmount = this.promotions[promoRef].ReferenceJSON['Description']['MinUAmount'];
    //                 // cle 081104
    //                 lResult = (this.basketService.orderTotal >= nMinUAmount);
    //                 break;
    //             }

    //             case PromoStatus.promoStatusOrder: {
    //                 // check promo conditions for PROMOSTATUS_ORDER
    //                 /*nMinUAmount := XMLIntAttr(GetFirstSubNodeByName(
    //                   GlobalPromoInfo.Promotions[PromoRef].XMLReferenceNode, Names.Nodes.Description {'Description'}),
    //                   Names.Attrs.MinUAmount {'MinUAmount'}, 0);*/
    //                 // cle 081104
    //                 nMinUAmount = this.promotions[promoRef].ReferenceJSON['Description']['MinUAmount'];
    //                 lResult = (this.basketService.orderTotal >= nMinUAmount);
    //             }
    //         }
    //     }
    //     return lResult;
    // }

    // countTaken(promoPolicyID: string = ''): number {
    //     let lResult = 0;
    //     const lStrList = [];

    //     try {
    //         for (let i = 0; i < this.promotions.length; i++) {
    //             if (promoPolicyID !== '' && this.promotions[i].promoPolicyID !== promoPolicyID) {
    //                 continue;
    //             }
    //             if (this.promotions[i].actualState === 0) {
    //                 if (this.promotions[i].promoStatus === PromoStatus.promoStatusBarcode ||
    //                     this.promotions[i].promoStatus === PromoStatus.promoStatusFreeItem ||
    //                     this.promotions[i].promoStatus === PromoStatus.promoStatusDiscAmount ||
    //                     this.promotions[i].promoStatus === PromoStatus.promoStatusTunnel ||
    //                     this.promotions[i].promoStatus === PromoStatus.promoStatusTunnelSplit ||
    //                     this.promotions[i].promoStatus === PromoStatus.promoStatusOrder ||
    //                     this.promotions[i].promoStatus === PromoStatus.promoStatusDirectpage) {
    //                     if (this.promotions[i].comboGroup === -1) {
    //                         lResult++;
    //                     } else {
    //                         if (lStrList.indexOf(this.promotions[i].comboGroup.toString()) === -1) {
    //                             lStrList.push(this.promotions[i].comboGroup.toString());
    //                             lResult++;
    //                         }
    //                     }
    //                     // Inc(Result, GlobalPromoInfo.Promotions[i].PromoCount);
    //                 }
    //             }
    //         }
    //     } finally {
    //         lStrList.length = 0;
    //     }
    //     return lResult;
    // }

    // isTypeEnabled(promoType: number): Boolean {
    //     let lResult = false;
    //     switch (promoType) {
    //         case PromoStatus.promoStatusNone: {
    //             lResult = true; // doubts ...
    //             break;
    //         }
    //         case PromoStatus.promoStatusBarcode: {
    //             lResult = (this.dpsFreeItemsJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusFreeItem: {
    //             lResult = (this.dpsFreeItemsJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusDiscAmount: {
    //             lResult = (this.dpsDiscItemsJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusTunnel: {
    //             lResult = (this.dpsTunnelJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusTunnelSplit: {
    //             lResult = (this.dpsTunnelSplitJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusDirectpage: {
    //             lResult = (this.dpsMenuJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusOrder: {
    //             lResult = (this.dpsOrderJson !== null);
    //             break;
    //         }
    //         case PromoStatus.promoStatusJumpToPage: {
    //             lResult = (this.dpsJumptoPage !== null);
    //             break;
    //         }
    //         default: {
    //             lResult = false;
    //         }
    //     }
    //     return lResult;
    // }


    // canHaveMoreOfAnyType(): Boolean {
    //     this.maxItems = this.dpsCommonRoot['MaxPromo'];
    //     return (this.countTaken() < this.maxItems);
    // }
    // initParameters() {
    //     this.maxItems = this.dpsCommonRoot.maxPromo;
    // }

    // initOrder() {
    //     this.clearAllPromo();
    // }

    // getRewardRefFromPromo(promoRef: number): string {
    //     if (promoRef <= this.promotions.length) {
    //         return this.promotions[promoRef].promoPolicyID;
    //     }
    // }

    // findFirstPromoOfType(aType: number): GlobalPromotions {
    //     for (let i = 0; i < this.promotions.length; i++) {
    //         if (this.promotions[i].promoStatus === aType && this.promotions[i].actualState === 0) {
    //             return this.promotions[i];
    //             break;
    //         }
    //     }
    // }

    // canHaveMoreOfThisType(referenceJSON: any): number {
    //     // cannot have more of any other type
    //     let lResult = this.promoNokMaxGlobalLimit;

    //     // 100510 - init every time - yes I know it's a waste of time
    //     this.maxItems = this.dpsCommonRoot.maxPromo;
    //     if (this.countTaken() >= this.maxItems) {
    //         return lResult;
    //     }

    //     const aPromoPolicyID = referenceJSON.ID;
    //     const nMAXThisType = referenceJSON.maxNo;

    //     // verify if we chave taken enough of this kind
    //     if (nMAXThisType !== this.noLimit) {
    //         let nThisTypeTaken = 0;
    //         for (let i = 0; i < this.promotions.length; i++) {
    //             if (this.promotions[i].promoPolicyID === aPromoPolicyID && this.promotions[i].actualState === 0) {
    //                 nThisTypeTaken++;
    //             }
    //         }
    //         lResult = this.promoNokMaxPolicyLimit;
    //         if (this.countTaken(aPromoPolicyID) >= nMAXThisType) {
    //             return lResult; // not inside loop - need to check zero !
    //         }
    //     }

    //     // look for exclusivity of this type

    //     if (referenceJSON['Exclusive'] === false) {
    //         for (let i = 0; i < this.promotions.length; i++) {
    //             if (this.promotions[i].actualState === 0 && this.promotions[i].promoPolicyID !== aPromoPolicyID) {
    //                 return this.promoNokThisPromoExclusive;
    //             }
    //         }
    //     }

    //     // look for exclusivity of other already taken promos  - however, it should be only one !
    //     for (let i = 0; i < this.promotions.length; i++) {
    //         if (this.promotions[i].actualState === 0 &&
    //             this.promotions[i].ReferenceJSON['Exclusive'] === false &&
    //             this.promotions[i].promoPolicyID !== aPromoPolicyID) {
    //             return this.promoNokOtherPromoExclusive;
    //         }
    //     }

    //     const exclusiveGroup = referenceJSON['ExclusiveGroup'];
    //     if (exclusiveGroup !== '') {
    //         const nMaxThisType = referenceJSON['MaxNo'];
    //         // verify if we chave taken enough of this exclusive group
    //         if (nMaxThisType !== this.noLimit && this.getPromoCount(exclusiveGroup) >= nMaxThisType) {
    //             return this.promoNokOtherPromoSameGroup;
    //         }
    //     }

    //     // otherwise, why caaan't wee bee friends, why can't wee bee friends , ....
    //     return this.promoOkCanHaveMore;
    // }

    // async hasPromos() {
    //     /* const promoFileUrl = this.configurationService.assetsPath + 'assets/dpsPages.json';
    //     Log.debug('promo service load file: {0}', promoFileUrl);

    //     const promoValue = await this.http.get<any>(promoFileUrl).toPromise();
    //     if (!promoValue) {
    //         return false;
    //     return true;
    //     }*/
    //     return false;
    // }
}
