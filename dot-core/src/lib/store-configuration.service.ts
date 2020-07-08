import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environments/environment';
import { Log } from './logger/log';
import { ConfigurationService } from './configuration.service';

@Injectable({
    providedIn: 'root'
})
export class StoreConfigurationService {


    storeData: any = {};
    private settingsJson: Observable<any>;
    private configurationsJSON: any = {};

    constructor(private httpClient: HttpClient,
                private configurationService: ConfigurationService) {
    }

    async initialize() {
        const url = this.configurationService.bridgePath + environment.storeEndpoint;
        this.storeData = await this.httpClient.get<any>(url, {headers: this.getStreamHeaders()} ).toPromise().catch(e => {
            Log.error('StoreConfigurationService.initialize: Could not load Store data. Error = {0}', e['message']);
            return null;
        });
        return !!this.storeData;
    }

    private getStreamHeaders() {
        let headers = new HttpHeaders();
        headers = headers.append('Content-Type', 'application/octet-stream')
            .append('Accept', 'application/json, text/plain, */*')
            .append('Authorization', 'Basic ' +  btoa(this.configurationService.bridgeUser + ':' + this.configurationService.bridgePass));
        return headers;
    }


    clear() {
        for (const prop in this.storeData) {
            if (this.storeData.hasOwnProperty(prop)) {
                this.storeData[prop] = '';
            }
        }
    }

    // async getOccupationLevelJson() {
    //     try {
    //         const storeJson = this.http.get<any>(this.bridgePath + environment.storeEndpoint);
    //         const self = this;

    //         storeJson.subscribe(response => {
    //             self.storeData = JSON.parse(JSON.stringify(response));
    //             Log.debug(self.storeData);
    //         }, err => {
    //             // errorFunction(err);
    //         });
    //     } catch (e) {
    //         // No content response..
    //         Log.debug('> Error is handled: ', e.name);
    //     }
    // }

    // async getSettingsJson() {
    //     try {
    //       // get json from file
    // tslint:disable-next-line: max-line-length
    // const url = this.configurationService.assetsPath + 'assets/settings.json?t=' + Date.now();
    //       this.settingsJson = this.http.get();

    //       // get array with all messages
    //       this.settingsJson.subscribe(response => {
    //         this.configurationsJSON = response;
    //       }, err => {

    //       });
    //     } catch (e) {
    //       // No content response..
    //       Log.debug('> Error is handled: ', e.name);
    //     }
    // }

    getValue(type: string, name: string, param: string): string {
        let configValue, sectionValue, parameterValue, value: any;
        value = '';
        if (this.configurationsJSON) {

            configValue = this.getConfiguration(this.configurationsJSON, type);
            if (configValue) {
                sectionValue = this.getSection(configValue, name);
                if (sectionValue) {
                    parameterValue = this.getParam(sectionValue, param);
                    if (parameterValue) {
                        value = parameterValue.value;
                    }
                }
            }
        }
        return value;
    }

    getConfiguration(globalValue: any, type: string): any {
        let configurations, configValue: any;
        configValue = null;

        configurations = globalValue.Configurations;
        if (configurations) {
            if (Array.isArray(configurations)) {
                configValue = configurations.find(x => x.type === type);
            } else {
                configValue = configurations;
            }
            // Log.debug(configValue);
            return (configValue);
        }
    }

    getSection(configValue: any, name: string): any {
        let sections, sectionValue: any;
        sectionValue = null;

        sections = configValue.value;
        if (sections) {
            if (Array.isArray(sections)) {
                sectionValue = sections.find(x => x.name === name);
            } else {
                sectionValue = sections;
            }
            // Log.debug(sectionValue);
        }
        return (sectionValue);
    }

    getJSONSection(type: string, name: string): string {
        let configValue, sectionValue: any;
        sectionValue = null;
        if (this.configurationsJSON) {

            configValue = this.getConfiguration(this.configurationsJSON, type);
            if (configValue) {
                sectionValue = this.getSection(configValue, name);
            }
        }
        return sectionValue;
    }

    getParam(sectionValue: any, param: string): any {
        let params, paramValue: any;
        paramValue = null;

        params = sectionValue.Parameter;
        if (params) {
            if (Array.isArray(params)) {
                paramValue = params.find(x => x.name === param);
            } else {
                paramValue = params;
            }
            // Log.debug(paramValue);
        }
        return (paramValue);
    }



}
