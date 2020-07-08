import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Log } from './logger/log';
import { Banner } from './models';
import { CODUpdateService } from './cod-update.service';
import { CODDataService } from './cod-data.service';

@Injectable({
    providedIn: 'root'
})
export class CODBannersService {

    private _mimeTypes: { [extension: string]: 'image' | 'video' } = {
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'mp4': 'video',
        'ogg': 'video',
        'ogv': 'video',
        'webm': 'video'
    };

    private _data: Banner[] = null;

    constructor(private _http: HttpClient,
        private _updateService: CODUpdateService,
        private _dataService: CODDataService) {
    }

    public async initialize(): Promise<void> {
        Log.info('Initializing Banners Service...');

        await Promise.retry(async () => await this.load(), (retry) => Math.min(60, retry) * 1000);

        this._dataService.dataUpdated.subscribe(() => {
            this._updateService.require(() => this.load());
        });
    }

    public async load(): Promise<void> {
        Log.info('Loading Banners Service...');

        const url = '/data/configuration/banners.json?t=' + Date.now();
        Log.debug('Banners Service data path: {0}', url);

        const data = await this._http.get<{
            ID: number;
            Name: string;
            Image: string;
            Active: boolean;
            Interval: number;
            Order: number;
            Skin: string;
            BannerType: string;
        }[]>(url).toPromise();

        Log.info('Banners Service initialized!');

        const timestamp = '?t=' + Date.now();

        this._data = data.filter(_ => _.Active).map(_ => {

            const media = '/data/banners/' + _.Image + timestamp;

            const extension = _.Image.split('.').last();
            const mimeType = this._mimeTypes[extension] || undefined;

            const banner = {
                media,
                mimeType,
                active: _.Active,
                interval: _.Interval,
                order: _.Order,
                skin: _.Skin,
                type: _.BannerType
            };

            Object.freeze(banner);
            return banner;
        });
    }

    public getBanners(bannerType: string): Banner[] {
        const filter = bannerType ? (_: Banner) => _.type === bannerType : (_: Banner) => true;

        return this._data.filter(filter).sort((a, b) => a.order - b.order);
    }
}
