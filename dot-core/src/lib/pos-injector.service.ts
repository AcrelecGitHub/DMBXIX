import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from './environments/environment';
import { ConfigurationService } from './configuration.service';

@Injectable({
    providedIn: 'root'
})
export class PosInjectorService {
    constructor(private http: HttpClient,
                private configurationService: ConfigurationService) {
    }

    async testConnect(): Promise<any> {
        return this.http.post(environment.bridgeTestConnect.replace('{bridgeTestAddr}', this.configurationService.bridgeIP),
                              JSON.stringify({'WSID': this.configurationService.kioskId}),
                              {headers: this.getStreamHeaders()}).toPromise();
    }

    async sendDataToPOS(elog: any): Promise<any> {
        return this.http.post(environment.bridgeTransaction.replace('{bridgeTransactionAddr}',
            this.configurationService.bridgeIP), elog, {headers: this.getStreamHeaders()}).toPromise();
    }

    private getStreamHeaders() {
        let headers = new HttpHeaders();
        headers = headers.append('Content-Type', 'application/octet-stream')
            .append('Accept', 'application/json, text/plain, */*')
            .append('Authorization', 'Basic ' +  btoa(this.configurationService.bridgeUser + ':' + this.configurationService.bridgePass));
        return headers;
    }
}

