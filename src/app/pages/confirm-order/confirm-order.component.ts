import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { AppSettingsService, ContentService } from '../../services';
import { DotPage } from 'dotsdk';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    templateUrl: './confirm-order.component.html',
    styleUrls: ['./confirm-order.component.scss']
})
export class ConfirmOrderComponent implements OnInit  {

    public orderData;
    public currentPage: DotPage;
    public items;
    public bgPath: string;
    public logoPath: string;
    public carImg: string;
    public orderState;
    public length: boolean;

    @ViewChild('itemsContainer', {static: false}) private _itemsContainer: ElementRef<HTMLElement>;
    @ViewChild('orderList', {static: false}) private myScrollContainer: ElementRef;

    constructor(private contentService: ContentService,
        private appSettings: AppSettingsService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private location: Location) {            
            this.bgPath = `${this.appSettings.acreBridgeAssets}/Items/image_2020_03_23T00_34_07_380Z.png`;
            this.logoPath = `${this.appSettings.acreBridgeAssets}/Items/Image_1.png`;
            this.carImg = `${this.appSettings.acreBridgeAssets}/Items/Gif-Car-1.1.gif`;
    }

    public ngOnInit() {
        this.currentPage = this.contentService.mainPage;
        this.activatedRoute.queryParams.subscribe((item) => {
            this.orderData = JSON.parse(item && item.data);
            this.orderState = this.orderData && this.orderData.OrderState;
            this.items = this.orderData && this.orderData.items;
            // Adding the boolean to handle the CSS separately for one column vs two column view
            this.length = (this.items.length < 8) ? true: false;
        });
        this.scrollToBottom();  
    }
    
    public ngAfterViewChecked() { 
        this.scrollToBottom(); 
    } 
  
    public ngAfterViewInit() {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        try {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch(err) { }                 
    }

    public goBackToOrderArea() {
        this.router.navigate(['welcome'], { skipLocationChange: true, queryParamsHandling: 'preserve' });
        this.location.replaceState('welcome');
    }
}
