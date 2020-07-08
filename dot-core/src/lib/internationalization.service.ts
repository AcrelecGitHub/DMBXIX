import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Log } from './logger/log';
import { Language } from './models/language.model';
import { Hookable } from './decorators/hookable.decorator';
import { Subject, Observable } from 'rxjs';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { OrderCloseCause } from './basket.service';
import { ConfigurationService } from './configuration.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class InternationalizationService {

    private _languages: Language[] = [];

    private _dictionary: { [id: string]: { default: string, [language: string]: string } } = {};
    private _language: Language;

    private _setLanguageStream = new Subject<Language>();

    constructor(private http: HttpClient,
        private configurationService: ConfigurationService,
        userService: UserService) {

        // Set default language when cancel or close order
        // basketService.onCancelOrder.subscribe(() => this.setLanguage());
        // basketService.onCompleteOrder.subscribe(() => this.setLanguage());

        userService.onStopSession.subscribe((x: OrderCloseCause) => {
            setTimeout(this.setLanguage.bind(this), 0);
        });
    }

    public get onSetLanguage(): Observable<Language> {
        return this._setLanguageStream.asObservable();
    }

    public get currentLanguage(): Language {
        return this._language;
    }

    @Hookable(HooksIdentifiers.SET_LANGUAGE)
    public async setLanguage(value?: Language): Promise<void> {
        if (!value) {
            Log.info('No language provided. Default language will be seted.');

            // TODO: Get default language from configuration
            value = this._languages.first();
        }
        if (!this._languages.contains(value)) {
            Log.error('Given language is not a valid language: {0}', this._language);
            return;
        }

        this._language = value;

        this._setLanguageStream.next(value);
    }

    public async initialize(): Promise<boolean> {
        Log.info('Initializing Internationalization Service...');

        // TODO: Get available languages from configuration
        this._languages = [
            {
                name: 'Spanish',
                code: 'es'
            },
            {
                name: 'English',
                code: 'en'
            }
        ];

        this._languages.forEach(_ => Object.freeze(_));

        const url = this.configurationService.assetsPath + 'assets/internationalization.json?t=' + Date.now();

        const data = await this.http.get<{
            ID: string;
            Def: string;
            [language: string]: string;
        }[]>(url).toPromise().catch(e => {
            Log.error('InternationalizationService.initialize: Error on loading internationalization.json: {0}', e['message']);
            return null;
        });

        if (!data) {
            return false;
        }

        this._dictionary = data.reduce((dictionary, _) => {
            const translations: { default: string, [language: string]: string } = {
                default: _.Def
            };

            for (const language in _) {
                if (_.hasOwnProperty(language) && language != 'Def') {
                    translations[language.toLowerCase()] = _[language];
                }
            }

            dictionary[_.ID] = translations;
            return dictionary;
        }, {});

        // Set default language
        this.setLanguage();

        Log.info('Internationalization Service initialized!');

        return true;
    }

    @Hookable(HooksIdentifiers.AVAILABLE_LANGUAGES)
    public availableLanguages(): Language[] {
        return this._languages.clone();
    }

    public translate(id: string, ...args: any[]): string {
        if (!id) {
            return null;
        }

        const translationKey = this._dictionary[id];
        if (!translationKey) {
            return id;
        }

        let translation = translationKey[this._language.code];
        if (typeof (translation) !== 'string') {
            translation = translationKey.default;
            if (typeof (translation) !== 'string') {
                translation = id;
            }
        }
        translation = String.compositeFormat(translation, ...args);

        return translation;
    }

    getMessageFromDictionary(dict: any): string {
        let lResult = dict[this._language.code.toUpperCase()];
        if (typeof(lResult) !== 'string') {
            lResult = dict['DEF'];
            if (typeof(lResult) !== 'string') {
                lResult = '';
            }
        }
        return lResult;
    }
}
