import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Log } from './logger/log';
import { BasketService } from './basket.service';
import { SaleCond, SaleOrders, SaleItems } from './models/sale-cond.model';
import { StringEval } from './models/string-evaluator.model';
import { StringEvaluatorService } from './string-evaluator.service';
import { AvailabilityService } from './availability.service';
import { ContentService } from './content.service';
import { Page } from './models';
import { ConfigurationService } from './configuration.service';

@Injectable({
    providedIn: 'root'
})
export class SuggestiveSalesService {

    private saleCondition: SaleCond;
    private productsList: string[];
    // private familiesList: string[];

    constructor(private http: HttpClient,
        private basketService: BasketService,
        private configurationService: ConfigurationService,
        private stringEvaluatorService: StringEvaluatorService,
        private availabilityService: AvailabilityService,
        private contentService: ContentService) {
        this.productsList = [];
        // this.familiesList = [];
    }

    async initialize() {
        const url = this.configurationService.assetsPath + 'assets/saleCond.json?t=' + Date.now();
        this.saleCondition = await this.http.get<any>(url).toPromise().catch(e => {
            Log.error('SuggestiveSalesService.initialize: Could not load Sale Condition. Error ', e['message']);
            return null;
        });
        return !!this.saleCondition;
    }

    extractOrderLists() {
        this.basketService.basket.Order.Combos.forEach((element) => {
            if (this.productsList.indexOf(element.ItemID) === -1) {
                this.productsList.push(element.ItemID);
                // this.familiesList.push(element.FamilyID);
            }
        });
    }

    async checkForSuggestiveOnOrder(): Promise<string[]> {
        if (!this.saleCondition) {
            return;
        }
        const saleOrders = this.saleCondition.Orders;
        if (!saleOrders || saleOrders.length <= 0) {
            return;
        }
        const saleListResult: SaleOrders[] = [];
        // populate products and families lists
        this.extractOrderLists();

        saleOrders.forEach((saleOrdersComponent) => {
            // check for condition not empty
            if (saleOrdersComponent.hasOwnProperty('Condition') && saleOrdersComponent['Condition'].length) {
                const lGenerics: StringEval[] = [];
                this.productsList.forEach((product) => {
                    lGenerics.push({ name: 'I' + product, isEnabled: true, wasUsed: false });
                });
                // this.familiesList.forEach((family) => {
                //     lGenerics.push({name: 'F' + family, isEnabled: true, wasUsed: false});
                // });
                if (this.stringEvaluatorService.evaluate(saleOrdersComponent.Condition, lGenerics)) {
                    saleOrdersComponent.SaleList.forEach((saleComponent) => {
                        saleListResult.push(saleComponent);
                    });
                }
            } else {
                saleOrdersComponent.SaleList.forEach((saleComponent) => {
                    saleListResult.push(saleComponent);
                });
            }

        });
        if (saleListResult.length <= 0) {
            return;
        }
        const pageIdsResult: string[] = [];
        saleListResult.forEach((saleListItem) => {
            const lAvlb = this.availabilityService.testAvlb(saleListItem.Avlb, new Date());
            if (lAvlb !== '') {
                Log.debug('Avlb elimination ' + saleListItem.toString() + ' : ' + lAvlb);
            } else {
                // TODO check for hourly intervals
                /* if (saleListItem.Avlb) {
                    lCondition = true;
                    const dayPart = saleListItem.Avlb['TH'];
                    if (dayPart && dayPart.length) {
                        if (!this.availabilityService.isServiceActive(dayPart, new Date()) {
                            lCondition = false;
                        }
                    }
                }*/

                // const mealObj = this.saleGroup.
                pageIdsResult.push(saleListItem.SaleGrpID);

            }
        });
        return Promise.resolve(pageIdsResult);
    }


    getMakeItAMealSuggestionForItem(itemId: String): Page {
        const pages = this.getSuggestionsForItem(itemId);
        if (pages) {
            const result = pages.find(page => page.PageTemplate === 'MakeItAMeal');
            return result;
        }
        return null;
    }

    getRegularSuggestionForItem(itemId: String) {
        const pages = this.getSuggestionsForItem(itemId);
        if (pages) {
            const result = pages.find(page => page.PageTemplate !== 'MakeItAMeal');
            return result;
        }
        return null;
    }

    getSuggestionsForItem(itemId: String): Page[] {
        if (!this.saleCondition) {
            return;
        }
        const saleItems = this.saleCondition.Items;
        if (!saleItems || saleItems.length <= 0) {
            return;
        }

        const saleListResult: Page[] = [];
        const result = saleItems.find(item => item.ID === itemId);
        if (result !== null && result !== undefined) {
            if (result.SaleList !== null && result.SaleList !== undefined) {
                result.SaleList.forEach(salePage => {
                    // tslint:disable-next-line: max-line-length
                    const suggestion = this.contentService.findAnyPage(this.contentService.hiddenPages, 'ID', salePage.SaleGrpID);
                    if (suggestion) {
                        saleListResult.push(suggestion);
                    }
                });

                if (saleListResult.length > 0) {
                    return saleListResult;
                } else {
                    return null;
                }
            }
        }
        return null;
    }

    async completeSuggestion(): Promise<Page[]> {
        const suggestionsPagesId = await this.checkForSuggestiveOnOrder();
        if (suggestionsPagesId) {
            const suggestivePages: Page[] = [];
            for (let i = 0; i < suggestionsPagesId.length; i++) {
                // tslint:disable-next-line: max-line-length
                const lPage = this.contentService.findAnyItemByType(this.contentService.hiddenPages, 'ID', suggestionsPagesId[i], 'Link');
                if (lPage) {
                    suggestivePages.push(lPage);
                } else {
                    Log.debug('Suggestion page {0} not found', suggestionsPagesId[i]);
                }
            }
            if (suggestivePages.length > 0) {
                return Promise.resolve(suggestivePages);
            } else {
                return;
            }
        }
    }

}
