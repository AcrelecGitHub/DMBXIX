import { Component, Input, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

import { AppSettingsService, BasketService, ContentService } from '../../services';
import { DotBanner } from 'dotsdk';

@Component({
    selector: 'cod-slideshow',
    templateUrl: './slideshow.component.html',
    styleUrls: ['./slideshow.component.scss'],
    animations: [
        trigger('active', [
            transition(':enter', [
                style({ position: 'absolute', zIndex: '2', width: '100%', height: '100%', transform: 'translateX(100%)' }),
                animate(
                    `${400}ms cubic-bezier(.84,.14,.33,.34)`,
                    style({ position: 'absolute', zIndex: '2', width: '100%', height: '100%', transform: 'translateX(0)' })
                ) 
            ]),   
            transition(':leave', [
                style({ position: 'absolute', zIndex: '1', width: '100%', height: '100%', transform: 'translateX(0)' }),
                animate(
                    `${400}ms cubic-bezier(.84,.14,.33,.34)`,
                    style({ position: 'absolute', zIndex: '1', width: '100%', height: '100%', transform: 'translateX(-30%)' })
                )
            ])
        ])
    ]
})
export class SlideshowComponent implements OnDestroy {

    private _current: DotBanner;
    private _intervalHandler: any = null;

    private _slides: DotBanner[] = [];

    constructor(private appSettings: AppSettingsService, 
      private basketService: BasketService,
      private contentService: ContentService) { }
    
    bannersPath = `${this.appSettings.acreBridgeAssets}/Banners/`;
    
    public ngOnDestroy(): void {
        if (this._intervalHandler) {
            clearTimeout(this._intervalHandler);
        }
    }

    @Input() public set slides(value: DotBanner[]) {
        this._slides = value;
        if (!this._slides || this._slides.length === 0) {
            this.current = null;
            return;
        }

        if (!this._slides.contains(this._current)) {
            this.current = this._slides.first();
        }
    }

    public get slides(): DotBanner[] {
        return this._slides;
    }

    public set current(value: DotBanner) {
        this._current = value;
        if (!value) {
            clearTimeout(this._intervalHandler);
            return;
        }

        this._intervalHandler = setTimeout(() => {
            this.current = this._slides.next(this.current);
        }, this._current.Interval);
    }

    public get current(): DotBanner {
        return this._current;
    }

}
