import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';

import { Log } from './logger/log';
import { Language } from './models/language.model';
import { CODUpdateService } from './cod-update.service';
import { CODDataService } from './cod-data.service';

@Injectable({
    providedIn: 'root'
})
export class CODInternationalizationService {

    private _languages: Language[] = [];

    private _dictionary: { [id: string]: { default: string, [language: string]: string } } = {};
    private _language: Language;

    private _setLanguageStream = new Subject<Language>();

    constructor(private http: HttpClient,
        private _updateService: CODUpdateService,
        private _dataService: CODDataService) {
    }

    public get onSetLanguage(): Observable<Language> {
        return this._setLanguageStream.asObservable();
    }

    public get currentLanguage(): Language {
        return this._language;
    }

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

    public async initialize(): Promise<void> {
        Log.info('Initializing Internationalization Service...');

        await Promise.retry(async () => await this.load(), (retry) => Math.min(60, retry) * 1000);

        this._dataService.dataUpdated.subscribe(() => {
            this._updateService.require(() => this.load());
        });
    }

    public async load(): Promise<void> {
        Log.info('Loading Internationalization Service...');

        // TODO: Get available languages from configuration
        this._languages = [
            {
                name: 'English',
                code: 'en'
            },
            {
                name: 'Spanish',
                code: 'es'
            }
        ];

        this._languages.forEach(_ => Object.freeze(_));

        const url = '/data/configuration/internationalization.json?t=' + Date.now();
        Log.debug('Internationalization Service data path: {0}', url);

        const data = await this.http.get<{
            ID: string;
            Def: string;
            [language: string]: string;
        }[]>(url).toPromise();

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
    }

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
        if (typeof(translation) !== 'string') {
            translation = translationKey.default;
            if (typeof(translation) !== 'string') {
                translation = id;
            }
        }
        translation = String.compositeFormat(translation, ...args);

        return translation;
    }
}
