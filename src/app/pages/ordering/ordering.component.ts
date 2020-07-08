import { Component, AfterViewInit, ViewChild, AfterViewChecked, ChangeDetectorRef, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { CODBannersService } from '../../../../dot-core/src/lib/cod-banners.service';
import { CODConfigurationService } from '../../../../dot-core/src/lib/cod-configuration.service';
import { CODService } from '../../../../dot-core/src/lib/cod.service';
import { CODOrderView } from '../../../../dot-core/src/lib/models/cod-order-view.model';
import { Banner } from '../../../../dot-core/src/lib/models/banner.model';
import { CODProduct } from '../../../../dot-core/src/lib/models/cod-product.model';
import { ToastMessage } from '../../../../dot-core/src/lib/models/toast-message.model';

import { DotBannersLoader } from 'dotsdk';

//import { OrderViewComponent } from '../../components';

@Component({
    templateUrl: './ordering.component.html',
    styleUrls: ['./ordering.component.scss']
})
export class OrderingComponent implements AfterViewInit, AfterViewChecked, OnInit, OnDestroy {

    @ViewChild('itemsContainer', {static: false}) private _itemsContainer: ElementRef<HTMLElement>;

    private _timeoutHandler: any = null;
    private _subscriptions: Subscription[] = [];

    private _toastMessage: ToastMessage;
    private _orderViewExpanded = false;
    private _orderViewHiddenItemsCount = 0;    

    constructor(private _bannersService: CODBannersService,
        private _configurationService: CODConfigurationService<{ productsAnimationInterval: number }>,
        private _codService: CODService,
        private _changeDetectorRef: ChangeDetectorRef) {
    }
    
    banners = DotBannersLoader.getInstance().loadedModel;

    public get animationInterval(): number {
        return this._configurationService.get('productsAnimationInterval');
    }

    public get sideBanners(): Banner[] {
        return this._bannersService.getBanners('Banner2');
    }

    public get slides(): Banner[] {
        return this._bannersService.getBanners('Slide');
    }

    public get dynamicProducts(): CODProduct[] {
        return this._codService.products;
    }

    public get openChoices(): CODProduct[] {
        if (!this.orderView || !this.orderView.customData) {
            return null;
        }

        return this.orderView.customData.openChoices;
    }

    public get orderView(): CODOrderView {
        return this._codService.orderView;
    }

    public get orderViewExpanded(): boolean {
        return this._orderViewExpanded;
    }

    public get orderViewHiddenItemsCount(): number {
        return this._orderViewHiddenItemsCount;
    }

    public get toastMessage(): ToastMessage {
        return this._toastMessage;
    }

    public get loyaltyData(): any {
        if (!this.orderView || !this.orderView.customData) {
            return null;
        }

        return this.orderView.customData.loyalty;
    }

    public get loyaltyProducts(): CODProduct[] {
        if (!this.orderView.customData || !this.orderView.customData.loyalty) {
            return null;
        }

        return this.orderView.customData.loyalty.products;
    }

    private onToastMessage(message: ToastMessage): void {
        this._toastMessage = message;

        if (this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
            this._timeoutHandler = null;
        }

        if (message && message.timeout > 0) {
            this._timeoutHandler = setTimeout(() => {
                this._toastMessage = null;
            }, message.timeout);
        }
    }

    public ngAfterViewInit(): void {
    }

    public ngAfterViewChecked(): void {
        if (!this._itemsContainer) {
            return;
        }

        const element = this._itemsContainer.nativeElement;
        const overflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

        if (overflow) {
            if (!this._orderViewExpanded) {
                this._orderViewExpanded = true;
            } else {
                this._orderViewHiddenItemsCount++;
            }
            this._changeDetectorRef.detectChanges();
        }
    }

    public ngOnInit(): void {
        this._subscriptions.push(this._codService.message.subscribe(_ => this.onToastMessage(_)));
    }

    public ngOnDestroy(): void {
        this._subscriptions.forEach(_ => _.unsubscribe());
        if (this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
            this._timeoutHandler = null;
        }
    }

    public isChoiceSelected(choice: CODProduct): boolean {
        return choice.items.some(_ => _.selected);
    }

    public isHighlightedChoice(choice: CODProduct): boolean {
        return this.openChoices.clone().sort((a, b) => a.items.length - b.items.length).last() === choice;
    }
}
