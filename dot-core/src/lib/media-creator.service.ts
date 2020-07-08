import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { LocalizationService } from './localization.service';
import { ConfigurationService } from './configuration.service';
import { Log } from './logger/log';
import { AtpFilesSystemService } from './atp-files-system.service';
import { MBirdSdk } from '../externals/mbird-sdk';

@Injectable({
    providedIn: 'root'
})
export class MediaCreatorService {

    private httpOption;
    private mediaContent = [];

    constructor(private http: HttpClient,
                private localizationService: LocalizationService,
                private atpFilesSystemService: AtpFilesSystemService,
                private configurationService: ConfigurationService) {
    }

    loadAllMedia() {

        const mediaList = [];
        mediaList.push('assets/media_templates/media1/index.html');
        mediaList.push('assets/media_templates/media2/index.html');
        const self = this;

        let req = this.http.get(mediaList[0] + '?time=' + new Date()).subscribe(
            res => {
                self.mediaContent[0] = res;
                // Log.debug(' ------------------> media loaded');
            },
            err => {
                this.mediaContent[0] = err.error.text;
                // Log.debug(' ------------------> media Error loaded' + JSON.stringify(err.error.text) );
            }
        );

        req = this.http.get(mediaList[1] + '?time=' + new Date()).subscribe(
            res => {
                self.mediaContent[1] = res;
                // Log.debug(' ------------------> media loaded');
            },
            err => {
                this.mediaContent[1] = err.error.text;
                // Log.debug(' ------------------> media Error loaded' + JSON.stringify(err.error.text) );
            }
        );

    }

    generateMedia(pageInfo: any = null, mediaId = 2) {
        if (mediaId == 1) {
            this.generateMedia1(pageInfo);
        } else {
            this.generateMedia2(pageInfo);
        }
    }


    generateMedia1(pageInfo: any = null) {

        if (this.mediaContent[0]) {

            let mediaContent = this.mediaContent[0];
            let extraCss = '';

            const normalWidth = 700;
            const normalHeight = 720;


            let itemScale = 0.50;

            let numberOfLines = 1;
            const availableAreaW = 1080;
            const availableAreaH = 960;


            const startingLeft = 0;
            const startingTop = 960;


            let left = startingLeft;
            let top = startingTop;

            if (pageInfo && pageInfo.Buttons) {
                let itemsToPosition = pageInfo.Buttons.length - 1;
                if (itemsToPosition > 16) {
                    itemsToPosition = 16;
                }

                if (itemsToPosition > 3 && itemsToPosition <= 6) {
                    numberOfLines = 2;
                } else if (itemsToPosition > 6 && itemsToPosition <= 9) {
                    numberOfLines = 3;
                    itemScale = 0.35;
                } else if (itemsToPosition > 9) {
                    numberOfLines = 4;
                    itemScale = 0.35;
                }

                const itemWidth = normalWidth * itemScale;
                const itemHeight = normalHeight * itemScale + 5;


                const itemsToNewline = Math.ceil(itemsToPosition / numberOfLines);

                const distanceY = (availableAreaH - (numberOfLines * itemHeight)) / (numberOfLines + 1);
                const distanceX = (availableAreaW - (itemsToNewline * itemWidth)) / (itemsToNewline + 1);

                left = startingLeft + distanceX;
                top = startingTop + distanceY;

                for (let i = 0; i < pageInfo.Buttons.length; i++) {
                    const item = pageInfo.Buttons[i];
                    let image = '';
                    let caption = '';
                    let price = '';
                    if (item) {
                        image = this.configurationService.assetsPath + 'assets/Items/' + item.Picture;
                        caption = item.Caption;
                        if (item.Price) {
                            price = this.localizationService.formatCurrency(item.Price / 100);
                        }
                    }
                    mediaContent = mediaContent.replace('{$image_placeholder_' + i + '}', image);
                    mediaContent = mediaContent.replace('{$name_placeholder_' + i + '}', caption);
                    mediaContent = mediaContent.replace('{$price_placeholder_' + i + '}', price);

                    if (item.ButtonStatus == '2') {
                        mediaContent = mediaContent.replace('{$price_vis_' + i + '}', 'none');
                        mediaContent = mediaContent.replace('{$unav_vis_' + i + '}', 'inline-table !important');
                    } else {
                        mediaContent = mediaContent.replace('{$price_vis_' + i + '}', 'block');
                        mediaContent = mediaContent.replace('{$unav_vis_' + i + '}', 'none');
                    }

                    if (i === 0) {
                        extraCss += '\n #media-kfc-55 .item_big' + i + '{ left: 190px; top: 220px; display: block !important;}';
                    } else {
                        extraCss += '\n #media-kfc-55 .item_big' + i + '{ left: ' +
                            left + 'px; top: ' + top + 'px; transform: scale(' + itemScale + '); display: block !important;}';
                        if (i > 0 && (i % itemsToNewline == 0)) {
                            left = startingLeft + distanceX;
                            top = top + itemHeight + distanceY;
                        } else {
                            left = itemWidth + left + distanceX;
                        }
                    }
                }
                mediaContent = mediaContent.replace('{$extra_css}', extraCss);
                mediaContent = mediaContent.replace('{$page_title}', pageInfo.Title);
            }
            this.saveToDisk(mediaContent);
        }

    }

    async generateMedia2(pageInfo: any = null) {

        if (this.mediaContent[1]) {

            let mediaContent = this.mediaContent[1];

            let extraCss = '';

            const normalWidth = 700;
            const normalHeight = 700;

            let itemScale = 0.55;

            let numberOfLines = 1;
            const availableAreaW = 1200;
            const availableAreaH = 800;

            const startingLeft = 0;
            const startingTop = 269;

            let left = startingLeft;
            let top = startingTop;

            if (pageInfo && pageInfo.Buttons) {
                let itemsToPosition = pageInfo.Buttons.length - 1;
                if (itemsToPosition > 12) {
                    itemsToPosition = 12;
                }

                if (itemsToPosition > 3 && itemsToPosition <= 6) {
                    numberOfLines = 2;
                } else if (itemsToPosition > 6) {
                    numberOfLines = 2;
                    itemScale = 0.35;
                }

                const itemWidth = normalWidth * itemScale;
                const itemHeight = normalHeight * itemScale;

                const itemsToNewline = Math.ceil(itemsToPosition / numberOfLines);

                const distanceY = (availableAreaH - (numberOfLines * itemHeight)) / (numberOfLines + 1);
                const distanceX = (availableAreaW - (itemsToNewline * itemWidth)) / (itemsToNewline + 1);

                left = startingLeft + distanceX;
                top = startingTop + distanceY;

                for (let i = 0; i < pageInfo.Buttons.length; i++) {
                    const item = pageInfo.Buttons[i];
                    let image = '';
                    let caption = '';
                    let price = '';
                    if (item) {
                        image = this.configurationService.assetsPath + 'assets/Items/' + item.Picture;
                        caption = item.Caption;
                        if (item.Price) {
                            price = this.localizationService.formatCurrency(item.Price / 100);
                        }

                    }
                    mediaContent = mediaContent.replace('{$image_placeholder_' + i + '}', image);
                    mediaContent = mediaContent.replace('{$name_placeholder_' + i + '}', caption);
                    mediaContent = mediaContent.replace('{$price_placeholder_' + i + '}', price);

                    if (item.ButtonStatus == '2') {
                        mediaContent = mediaContent.replace('{$price_vis_' + i + '}', 'none');
                        mediaContent = mediaContent.replace('{$unav_vis_' + i + '}', 'inline-table !important');
                    } else {
                        mediaContent = mediaContent.replace('{$price_vis_' + i + '}', 'block');
                        mediaContent = mediaContent.replace('{$unav_vis_' + i + '}', 'none');
                    }

                    if (i === 0) {
                        extraCss += '\n #media-kfc-55 .item_big' + i + '{ left: 1255px; top: 230px; display: block !important;}';
                    } else {

                        extraCss += '\n #media-kfc-55 .item_big' + i + '{ left: ' + left + 'px; top: ' +
                            top + 'px; transform: scale(' + itemScale + '); display: block !important;}';
                        if (i === itemsToNewline) {
                            left = startingLeft + distanceX;
                            top = top + itemHeight + distanceY;
                        } else {
                            left = itemWidth + left + distanceX;
                        }
                    }
                }
                mediaContent = mediaContent.replace('{$extra_css}', extraCss);
                mediaContent = mediaContent.replace('{$page_title}', pageInfo.Title);
            }

            if (MBirdSdk.isConnected()) {
                Log.info('MediaCreator: will start removing files');
                try {
                    await this.removeMedia();
                } catch (e) {
                    Log.warn('this.removeMedia() Error = {0}', e);
                }
                Log.info('MediaCreator: files removed. Will start coping new files.');
                try {
                    await this.saveToDisk(mediaContent);
                } catch (e) {
                    Log.warn('this.saveToDisk() Error = {0}', e);
                }
            }
        }
    }


    async saveToDisk(content: string) {
        const id = this.configurationService.DMBID;
        const hashContent = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
        await this.atpFilesSystemService.writeFile('shared\\suggestiveMedia\\' + id + '\\index.html', content);
        await this.atpFilesSystemService.writeFile('shared\\suggestiveMedia\\' + id + '\\hash.txt', hashContent);
    }

    async removeMedia() {
        const id = this.configurationService.DMBID;
        await  this.atpFilesSystemService.deleteFile('shared\\suggestiveMedia\\' + id + '\\index.html');
        await  this.atpFilesSystemService.deleteFile('shared\\suggestiveMedia\\' + id + '\\hash.txt');
    }

}
