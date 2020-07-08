import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Log } from './logger/log';
import { MBirdSdk } from '../externals/mbird-sdk';
import { PeripheralsCheckMode } from './enums/peripherals-check.enum';
import { BIGoogleAnalyticsTypes, BIMarketTypes } from './enums';

@Injectable({
    providedIn: 'root'
})
export class ConfigurationService {

    private _atpMocksPath: string = undefined;

    // Please initiate all global vaiables of this class so hasOwnProperty will work. (used in initialize function):
    private _currencySymbol = '€';
    private _currencyName = 'EURO';
    private _curencySymbolBefore = true;
    private _decimalSeparator = ',';

    private _sendToMicrosoft = false;
    private _screenTimeout = 3000;

    private _defInOut = '0';
    private _allItemsAsCombo = true;

    private _DMBPath: string = undefined;
    private _DMBID: string = undefined;
    private _subscriptionKey: string = undefined;
    private _bridgePath: string = undefined;
    private _bridgeIP: string = undefined;
    private _assetsPath: string = undefined;
    private _kioskId: string = undefined;

    private _storeName: string = undefined;
    private _storeAddress: string = undefined;
    private _storeCode: string = undefined;
    private _storeWIFI: string = undefined;
    private _storeWC: string = undefined;

    private _showOrderConfirmationOnAddItem = false;
    private _reversedBasket = true;

    private _tweetPreferences = false;
    private _tweetUniqueIdentifier: string = undefined;

    private _printerMaxCharsPerRow = 40;
    private _printerMessage: string = undefined;
    private _printPaymentReceipt = false;
    private _partialCutCCReceipt = false;

    private _companyName: string = undefined;
    private _companyCIF: string = undefined;

    private _minOrderAmount = 0;

    private _bridgePass = 'kPass';
    private _bridgeUser = 'kUser';
    private _beforeScreenTimeouOut = 2 * 60 * 1000; // Default to 2 minutes
    private _afterScreenTimeouOut = 1 * 60 * 1000; // Default to 1 minute

    private _biDestionationParams = 'v=1&tid=UA-124577586-3';
    private _applicationCategory: string = undefined;
    private _applicationName: string = undefined;
    private _applicationVersion: string = undefined;
    private _marketTagsStore: string = undefined;
    private _marketTagsKiosk: string = undefined;

    private _biGoogleAnalytics: BIGoogleAnalyticsTypes = BIGoogleAnalyticsTypes.SendAtRunTime;
    private _biMarket: BIMarketTypes = BIMarketTypes.Disabled;

    private _displayMode: 'FULL_HD' | 'ACCESSIBILITY' = 'FULL_HD';

    private _peripheralsCheckTimer = 200;
    private _printerCheckMode: PeripheralsCheckMode = PeripheralsCheckMode.Mandatory;
    private _paymentCheckMode: PeripheralsCheckMode =  PeripheralsCheckMode.Mandatory;
    private _scannerCheckMode: PeripheralsCheckMode = PeripheralsCheckMode.Mandatory;
    private _posCheckMode: PeripheralsCheckMode = PeripheralsCheckMode.Mandatory;

    constructor(private http: HttpClient) { }

    static generateUUID(): string {
        let d = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    async initialize() {
        // Temp:
        // if (MBirdSdk.isConnected()) {
        //     MBirdSdk.App.DeveloperTools();
        // }

        // Get Non-ATP Settings:
        const config = await this.http.get<{ atpMocksPath: string }>('assets/config.json')
            .toPromise<{ atpMocksPath: string }>()
            .catch(e => ({ atpMocksPath: './assets/data/atp-calls-mocks/' }));
        this._atpMocksPath = config.atpMocksPath;

        // Get ATP Settings:
        const appBundleSettings: any = await this.getAppBundleSettings(this._atpMocksPath);
        // Dynamic mapping: appBundleSettings it's an object with keys similar to this class' global variables, without the '_' prefix
        // Next, will parse appBundleSettings key's and check if they have a equivalent in this class. If that is the case, pass its value:
        Object.keys(appBundleSettings).forEach(key => {
            // Log.debug('key = {0}, hasOwnProperty = {1}, value = {2}', key, this.hasOwnProperty(`_${key}`), this[`_${key}`]);
            if (this.hasOwnProperty(`_${key}`)) {
                this[`_${key}`] = appBundleSettings[key];
            }
        });

        // Get Tags:
        this._marketTagsKiosk = MBirdSdk.isConnected() ? await MBirdSdk.Environment.Tags() : '';
        this._marketTagsStore = MBirdSdk.isConnected() ? await MBirdSdk.Environment.StoreTags() : '';

        // Get Environment.About:
        const environmentAbout: any = await this.getEnvironmentAbout(this._atpMocksPath);
        this._storeName = environmentAbout.StoreDetails ? environmentAbout.StoreDetails.Name : '';
        this._storeCode = environmentAbout.StoreDetails ? environmentAbout.StoreDetails.Code : '';

        // Get AppDetails:
        const appDetails: any = await this.getAppDetails(this._atpMocksPath);
        this._applicationVersion = appDetails.AppVersion;

        // As AppDetails Call doesn't provide us with AppCategory and AppName, will get this from a different call:
        // This is a temporary hack, until ATP will provide us a complete set of data
        if (MBirdSdk.isConnected()) {
            const appToken = await MBirdSdk.Settings.GetToken().catch(e => null);
            // Log.info('ConfigurationService.initialize > appToken = {0}', appToken);
            if (appToken) {
                let headers = new HttpHeaders();
                headers = headers.append('Content-Type', 'application/json').append('MB_Token', appToken);
                const apps = await this.http.get('http://127.0.0.1:9723/environment/apps', {headers: headers})
                                            .toPromise<any>().catch(e => null);
                // Log.info('ConfigurationService.initialize, apps = {0}', apps);
                if (apps) {
                    const appIdentifiers = ['com.acrelec.dotxixtest1207', 'com.acrelec.kfcesxixbetadevbuild'];
                    const app = apps.find(x => appIdentifiers.some(y => y == x.AppSchema.AppIdentifier));
                    if (app) {
                        this._applicationCategory = app.AppSchema.AppDetails.Category;
                        this._applicationName = app.AppSchema.AppDetails.Name;
                    }
                }
            }
        } else {
            this._applicationCategory = 'Food & Drinks';
            this._applicationName = 'DOT XIX';
        }
    }

    isset(object, props) {
        // we will use the dump variable to iterate in the object
        let dump: any;
        const propsLength = props.length - 1;
        // loop in the properties
        for (let i = 0; i < props.length; i++) {
            // first prop?
            if (i === 0) {
                // add the object to dump (object.props1)
                dump = object[props[i]];
                continue;
            }

            // Undefined? return false
            if (typeof dump === 'undefined' || typeof dump[props[i]] === 'undefined') {
                return false;
            } else {
                // move in the object level
                // object.props1.props2
                // object.props1.props2.props3
                dump = dump[props[i]];
                // return true, of even return the object back
                if (i === propsLength) {
                    return true;
                }
            }
        }
    }

    public get allItemsAsCombo(): boolean {
        return this._allItemsAsCombo;
    }

    public get currencySymbol(): string {
        return this._currencySymbol;
    }

    public get currencyName(): string {
        return this._currencyName;
    }

    public get curencySymbolBefore(): boolean {
        return this._curencySymbolBefore;
    }

    public get decimalSeparator(): string {
        return this._decimalSeparator;
    }

    public get sendToMicrosoft(): boolean {
        return this._sendToMicrosoft;
    }

    public get screenTimeout(): number {
        return this._screenTimeout;
    }

    public get defInOut(): string {
        return this._defInOut;
    }

    public get atpMocksPath(): string {
        return this._atpMocksPath;
    }

    public get DMBPath(): string {
        return this._DMBPath;
    }

    public get DMBID(): string {
        return this._DMBID;
    }

    public get subscriptionKey(): string {
        return this._subscriptionKey;
    }

    public get bridgePath(): string {
        return this._bridgePath;
    }

    public get bridgeIP(): string {
        return this._bridgeIP;
    }

    public get assetsPath(): string {
        return this._assetsPath;
    }

    public get kioskId(): string {
        return this._kioskId;
    }

    public get storeName(): string {
        return this._storeName;
    }

    public get storeAddress(): string {
        return this._storeAddress;
    }

    public get storeCode(): string {
        return this._storeCode;
    }

    public get storeWIFI(): string {
        return this._storeWIFI;
    }

    public get storeWC(): string {
        return this._storeWC;
    }

    public get tweetPreferences(): boolean {
        return this._tweetPreferences;
    }

    public get tweetUniqueIdentifier(): string {
        return this._tweetUniqueIdentifier;
    }

    public get printerMaxCharsPerRow(): number {
        return this._printerMaxCharsPerRow;
    }

    public get printerMessage(): string {
        return this._printerMessage;
    }

    public get printPaymentReceipt(): boolean {
        return this._printPaymentReceipt;
    }

    public get partialCutCCReceipt(): boolean {
        return this._partialCutCCReceipt;
    }

    public get companyName(): string {
        return this._companyName;
    }

    public get companyCIF(): string {
        return this._companyCIF;
    }

    public get minOrderAmount(): number {
        return this._minOrderAmount;
    }

    public get bridgeUser(): string {
        return this._bridgeUser;
    }

    public get bridgePass(): string {
        return this._bridgePass;
    }


    public get reversedBasket(): boolean {
        return this._reversedBasket;
    }

    public get showOrderConfirmationOnAddItem(): boolean {
        return this._showOrderConfirmationOnAddItem;
    }


    public get beforeScreenTimouOut(): number {
        return this._beforeScreenTimeouOut;
    }

    public get afterScreenTimouOut(): number {
        return this._afterScreenTimeouOut;
    }

    public get biDestionationParams(): string {
        return this._biDestionationParams;
    }

    public get applicationCategory(): string {
        return this._applicationCategory;
    }
    public get applicationName(): string {
        return this._applicationName;
    }
    public get applicationVersion(): string {
        return this._applicationVersion;
    }

    public get marketTagsStore(): string {
        return this._marketTagsStore;
    }
    public get marketTagsKiosk(): string {
        return this._marketTagsKiosk;
    }
    public get displayMode(): 'FULL_HD' | 'ACCESSIBILITY' {
        return this._displayMode;
    }
    public set displayMode(displayMode: 'FULL_HD' | 'ACCESSIBILITY') {
        this._displayMode = displayMode;
    }

    public get peripheralsCheckTimer(): number {
        return this._peripheralsCheckTimer;
    }

    public get printerCheckMode(): PeripheralsCheckMode {
        return this._printerCheckMode;
    }

    public get paymentCheckMode(): PeripheralsCheckMode {
        return this._paymentCheckMode;
    }

    public get scannerCheckMode(): PeripheralsCheckMode {
        return this._scannerCheckMode;
    }

    public get posCheckMode(): PeripheralsCheckMode {
        return this._posCheckMode;
    }

    public get biGoogleAnalytics(): BIGoogleAnalyticsTypes {
        return this._biGoogleAnalytics;
    }

    public get biMarket(): BIMarketTypes {
        return this._biMarket;
    }

    /**
     * Call this to get App BundleSettings on demand, to make sure you have the latest data set
     * @param pathToMocks: path to ATP Mocks (_atpMocksPath)
     * Check: https://developer.acrelec.com/resources/sdk/docs/6_1_1/#bundle-settings
     */
    private getAppBundleSettings(pathToMocks: string): Promise<any> {
        return MBirdSdk.isConnected() ?
            MBirdSdk.Settings.BundleSettings() :
            this.loadMockFile(`${pathToMocks}app-bundle-settings.mock.json`);
    }

    /**
     * Call this to get Environment About on demand, to make sure you have the latest data set
     * @param pathToMocks: path to ATP Mocks (_atpMocksPath)
     * Check: https://developer.acrelec.com/resources/sdk/docs/6_1_1/#about
     */
    private getEnvironmentAbout(pathToMocks: string): Promise<any> {
        return MBirdSdk.isConnected() ?
            MBirdSdk.Environment.About() :
            this.loadMockFile(`${pathToMocks}environment-about.mock.json`);
    }

    /**
     * Call this to get AppDetails on demand, to make sure you have the latest data set
     * @param pathToMocks: path to ATP Mocks (_atpMocksPath)
     * Check: https://developer.acrelec.com/resources/sdk/docs/6_1_1/#app-details
     */
    private getAppDetails(pathToMocks: string): Promise<any> {
        return MBirdSdk.isConnected() ?
            MBirdSdk.Settings.AppDetails() :
            this.loadMockFile(`${pathToMocks}environment-app-details.mock.json`);
    }



    /**
     * Internal, used to load mocks files
     * @param path: string, path to mock file
     */
    private loadMockFile(path: string): Promise<any> {
        return this.http.get(path).toPromise();
    }
}

