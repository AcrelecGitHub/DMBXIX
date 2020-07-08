import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Log } from './logger/log';
import { Page, Button, Language } from './models';
import { InternationalizationService } from './internationalization.service';
import { ConfigurationService } from './configuration.service';
import { TextProcessorService } from './text-processor.service';

@Injectable({
    providedIn: 'root'
})
export class ContentService {

    // private languagesPages: { [key: string]: any } = {};
    private subItemsKeys = ['Buttons', 'Page', 'Combos', 'CombosPage', 'ModifiersPage', 'Modifiers', 'ItemInfo'];
    private dictionaryKeys = ['ImageDictionary',
                                       'TitleDictionary',
                                       'DlgMessageDictionary',
                                       'PictureDictionary',
                                       'CaptionDictionary',
                                       'DescriptionDictionary',
                                       'ThumbDictionary',
                                       'ComboStepNameDictionary',
                                       'NameDictionary'];

    private keysToProcess = [...this.dictionaryKeys, 'Caption', 'Title', 'Description', 'ComboStepName', 'Name'];

    private _mainPage: Page;
    private _hiddenPages: Page[];
    private _pages: Page[];

    private _products: Button[];
    private _hiddenProducts: Button[];
    private _catalog: Page;

    constructor(private http: HttpClient,
                private configurationService: ConfigurationService,
                private textProcessorService: TextProcessorService,
                internationalizationService: InternationalizationService) {
        internationalizationService.onSetLanguage.subscribe((language: Language) => this.onSetLanguage(language));
    }

    get pages(): Page[] {
        return this._pages;
    }

    get products(): Button[] {
        return this._products;
    }

    get hiddenProducts(): Button[] {
        return this._hiddenProducts;
    }

    get mainPage(): Page {
        return this._mainPage;
    }

    get hiddenPages(): Page[] {
        return this._hiddenPages;
    }

    get catalog(): Page {
        return this._catalog;
    }

    async initialize() {
        Log.debug('ContentService.initialize: start {0}', Date.now());

        const url = `${this.configurationService.assetsPath}assets/pages.json?t=${Date.now()}`;
        const data = await this.http.get<any>(url).toPromise().catch(e => {
            Log.error('ContentService.initialize: Error on loading pages.json: {0}', e['message']);
            return null;
        });

        if (!data) {
            return false;
        }


        const urlCatalog = `${this.configurationService.assetsPath}assets/catalog.json?t=${Date.now()}`;
        this._catalog = await this.http.get<any>(urlCatalog).toPromise().catch(e => null);

        if (data.MainPage) {
            this._mainPage = data.MainPage;
            if (data.HiddenPages) {
                this._hiddenPages = data.HiddenPages;
            }
        } else {
            this._mainPage = data;
            this._hiddenPages = null;
        }

        for (let i = this.mainPage.Buttons.length - 1; i >= 0; i--) {
            const button = this.mainPage.Buttons[i];
            if (button.Link === '-1') {
                this.mainPage.Buttons.splice(i, 1);
            }
        }

        const getInnerPages = (page: Page) => {
            const pages: Page[] = [];
            for (const button of page.Buttons) {
                if (button.Page) {
                    pages.push(button.Page, ...getInnerPages(button.Page));
                }
            }
            return pages;
        };

        const getProducts = (page: Page) => {
            const products: Button[] = [];
            for (const button of page.Buttons) {
                if (button.Link) {
                    products.push(button);
                }
                if (button.Page) {
                    products.push(...getProducts(button.Page));
                }
            }
            return products;
        };

        this._pages = [this._mainPage, ...getInnerPages(this._mainPage)];
        if (this._catalog) {
            this._products = this._catalog.Buttons;
        } else {
            this._products = getProducts(this._mainPage);
        }

        this._hiddenProducts = [];

        if (this._hiddenPages) {
            for (const hiddenPage of this._hiddenPages) {
                this._pages.push(hiddenPage, ...getInnerPages(hiddenPage));
                this._hiddenProducts.push(...getProducts(hiddenPage));
            }
        }

        const processCaptions = (item: any) => {
            // As we don't know what kind of type item is (Page, Button, Modifier), will check for all possible keys that must be processed
            // (we expect keysToProcess.length to be 1):
            const keysToProcess = Object.keys(item).filter(key => this.keysToProcess.includes(key));

            keysToProcess.forEach((key: string) => {
                if (item[key] && typeof item[key] === 'string') {// Simple Caption
                    item[key] = this.textProcessorService.processText(item[key]);
                } else if (item[key] && typeof item[key] === 'object') {
                    Object.keys(item[key]).forEach(dictionaryKey => {
                        item[key][dictionaryKey] = this.textProcessorService.processText(item[key][dictionaryKey]);
                    });
                }
            });

            // Go forward in tree:
            // Again, as we don't know item's type, will check for all possible keys with child pages
            // (we expect subItemsKeys.length to be 1):
            const subItemsKeys = Object.keys(item).filter(key => this.subItemsKeys.includes(key));
            // Log.debug('subItemsKeys = {} ', subItemsKeys);
            subItemsKeys.forEach((key: string) => {
                if (Array.isArray(item[key])) {
                    item[key].forEach(subItem => {
                        processCaptions(subItem);
                    });
                } else {
                    processCaptions(item[key]);
                }
            });
        };

        this._pages.forEach(x => processCaptions(x));
        if (this.hiddenPages) {
            this._hiddenPages.forEach(x => processCaptions(x));
        }
        if (this.catalog) {
            [this.catalog].forEach(x => processCaptions(x));
        }

        const imagesUrl = this.configurationService.assetsPath + 'assets/images.json';
        const images = await this.http.get<any>(imagesUrl).toPromise();
        this.cacheImages(images.Images);

        Log.debug('ContentService.initialize end {0}', Date.now());
        return true;
    }

    public findProductById(id: string): Button {
        if (!this.catalog || !this.catalog.Buttons) {
            return null;
        }

        for (let i = 0; i < this.catalog.Buttons.length; i++) {
            const product = this.catalog.Buttons[i];
            if (product.Link == id) {
                return product as Button;
            }
        }

        return null;
    }

    findAnyItemByType(Obj, key, value, ignoreTagInTree): any {
        let result = null;

        for (const prop in Obj) {
            if (prop != ignoreTagInTree) {
                if (prop == key) {
                    if (Obj[prop] == value) {
                        return Obj;
                    }
                }
                if (Obj[prop] instanceof Object) {
                    result = this.findAnyItemByType(Obj[prop], key, value, ignoreTagInTree);
                    if (result) {
                        break;
                    }
                }
            }
        }

        return result;
    }

    findAnyPage(Obj, key, value): any {
        let result = null;

        // tslint:disable-next-line: forin
        for (const prop in Obj) {
            // only pages have, buttons and Page type
            if (prop == key && Obj.Buttons && Obj.PageType) {
                if (Obj[prop] == value) {
                    return Obj;
                }
            }
            if (Obj[prop] instanceof Object) {
                result = this.findAnyPage(Obj[prop], key, value);
                if (result) {
                    break;
                }
            }
        }

        return result;
    }

    createButton(override: object): Button {
        // Init button with default values:
        const button = {
            Selected: false,
            Enabled: true,
            Picture: '',
            Caption: '',
            Description: '',
            Visible: true,
            ButtonType: 2,
            PageID: 0,
            DisplayMode: '2',
            DlgMessage: '',
            Link: '0',
            Jump: null,
            ButtonStatus: '1',
            ServiceType: 3,
            Page: null,
            GroupPage: null,
            ModifiersPage: null,
            UUID: null,
            ComboPage: null,
            DefaultQuantity: 0,
            MinQuantity: 0,
            ChargeThreshold: 0,
            MaxQuantity: 1,
            Price: '0',
            Visibility: '0',
            PageType: null,
            FormStyle: null,
            ShowCheckboxForQty: false,
            PageMode: null,
            SuggestivePages: null
        };

        const validKeys = Object.keys(override).filter(x =>  Object.keys(button).indexOf(x) > -1);

        // Log.debug(' validKeys = {0}', validKeys);

        // Based on dynamic arguments, override default values:
        validKeys.forEach(x => {
            button[x] = override[x];
        });

        return button;
    }



    private onSetLanguage(language: Language) {
        const translateFields = (item: any) => {
            // As we don't know what kind of type item is, will check for all possible Dictionary Keys
            // (we expect keysToTranslate.length to be 1):
            const keysToTranslate = Object.keys(item).filter(key => this.dictionaryKeys.includes(key));
            // Log.debug('keysToTranslate = {} ', keysToTranslate);
            // For each Dictionary Key, update it's Coresponding Key's Value (it should have same name minus 'Dictionary')
            keysToTranslate.forEach((key: string) => {
                item[key.replace('Dictionary', '')] = item[key][language.code.toUpperCase()] ||
                                                      item[key]['DEF'] ||
                                                      item[key]['Def'] ||
                                                      item[key]['def'];
            });

            // Go forward in tree:
            // Again, as we don't know item's type, will check for all possible keys with child pages
            // (we expect subItemsKeys.length to be 1):
            const subItemsKeys = Object.keys(item).filter(key => this.subItemsKeys.includes(key));
            // Log.debug('subItemsKeys = {} ', subItemsKeys);
            subItemsKeys.forEach((key: string) => {
                if (Array.isArray(item[key])) {
                    item[key].forEach(subItem => {
                        translateFields(subItem);
                    });
                } else {
                    translateFields(item[key]);
                }
            });
        };

        this._pages.forEach(x => translateFields(x));
        if (this.hiddenPages) {
            this._hiddenPages.forEach(x => translateFields(x));
        }
        if (this.catalog) {
            [this._catalog].forEach(x => translateFields(x));
        }
        // Log.debug( ' validKeys = {0}', this._catalog );
    }

    private async cacheImages(images: string[]): Promise<void> {
        const imageLoader = (path: string) => {
            return new Promise<boolean>((resolve) => {
                const image = new Image();

                image.onload = function () {
                    resolve(true);
                };

                image.onerror = function () {
                    Log.debug('Could not load image: {0}', path);
                    resolve(false);
                };

                image.src = path;
            });
        };

        const itemsPath = this.configurationService.assetsPath + 'assets/Items/';

        return Promise.runSerial(images.map(_ => () => imageLoader(itemsPath + _))).then((_: boolean[]) => {
            if (_.contains(false)) {
                Log.debug('Some images failed to load.');
            } else {
                Log.debug('All images loaded successfuly!');
            }
        });
    }
}
