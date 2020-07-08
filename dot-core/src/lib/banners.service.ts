import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConfigurationService } from './configuration.service';
import { Log } from './logger/log';
import { Banner } from './models';

@Injectable({
    providedIn: 'root'
})
export class BannersService {

    private _data: Banner[] = null;

    constructor(private http: HttpClient,
                private configurationService: ConfigurationService) { }

    public async initialize(): Promise<boolean> {
        Log.info('Initializing Banners Service...');

        const url = this.configurationService.assetsPath + 'assets/banners.json?t=' + Date.now();
        Log.debug('Banners Service data path: {0}', url);

        const data = await this.http.get<{
            ID: number;
            Name: string;
            Image: string;
            Active: boolean;
            Interval: number;
            Order: number;
            Skin: string;
            BannerType: string;
        }[]>(url).toPromise().catch( e => {
            Log.error('BannersService.initialize: Could not load Banners data. Error ', e['message']);
            return null;
        });

        if (!data) {
            return false;
        }

        Log.info('Banners Service initialized!');

        this._data = data.filter(_ => _.Active).map(_ => {
            const banner = {
                media: this.configurationService.assetsPath + 'assets/Banners/' + _.Image,
                active: _.Active,
                interval: _.Interval,
                order: _.Order,
                skin: _.Skin,
                type: _.BannerType
            };

            Object.freeze(banner);
            return banner;
        });

        return true;
    }

    public getBanners(bannerType: string): Banner[] {
        const filter = bannerType ? (_: Banner) => _.type === bannerType : (_: Banner) => true;

        return this._data.filter(filter).sort((a, b) => a.order - b.order);
    }
}
