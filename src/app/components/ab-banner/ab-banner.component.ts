import { Component, OnInit, Input, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { AppSettingsService } from '../../services';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Socket } from 'ngx-socket-io';

import { trigger, transition, style, animate, group, query } from '@angular/animations';

@Component({
  selector: 'app-ab-banner',
  templateUrl: './ab-banner.component.html',
  styleUrls: ['./ab-banner.component.scss'],
  animations: [
    trigger('active', [
        transition(':enter', [
            style({ 'clip-path': 'polygon(100% 0, 100% 100%, 100% 100%, 100% 0)', background: '#ee7700' }),
            animate('800ms ease-in-out', style({'clip-path': 'polygon(100% 0, 100% 100%, 0 100%, 0 0)', background: '#ee7700' })),
            animate('800ms ease-in-out', style({ background: '*' }))
        ])
    ]),
    trigger('quantity', [
        transition(':enter', [
            style({ background: '*' }),
            animate('400ms ease-in-out', style({ background: '#ee7700' })),
            animate('400ms ease-in-out', style({ background: '*' }))
        ])
    ]),
    trigger('slide', [
      transition('* <=> *', [
        group([
          query(':enter', [
            style({transform: 'translateX(100%)'}),
            animate('.6s', style({transform: 'translateX(0%)'}))
          ], {optional: true}),
        ])
      ])
    ])
  ]
})
export class AbBannerComponent implements OnInit {

  public variation = {};
  isOpen:boolean = true;

  @Input() public showBanner: boolean;  
  public orderArea: boolean;
  public items;
  public orderData;
  public orderState;
  public buttons;
  public totalValue;
  public randomNumber;
  
  @ViewChild('orderList', {static: false}) private myScrollContainer: ElementRef;

  constructor(
    public appSettings: AppSettingsService,
    private socket: Socket,
    private router: Router,
    private location: Location) { }

  public ngOnInit() {

    // default Qtimer banner state
    this.showBanner = true;

    this.socket.on("updateOrder", (data) => {
      if (data == null) return;

      this.orderData = JSON.stringify(data);
      this.totalValue = data.TotalValue;
      this.items = data && data.items;
      
      // this is the order data coming from the POS
      this.orderState = data.OrderState;
      const itemsLength = this.items && this.items.length;

      // this.orderState === '1' : when order is started at POS
      if ( (this.orderState === '1') && (itemsLength > 0) ){
        this.isOpen = !this.isOpen;        
        this.showBanner = false;
        this.orderArea = true;  
      } else if (this.orderState === '2') { // this.orderState === '2' : when order is confirmed
        this.goToConfirmOrder();
        return;
      } else if (this.orderState === '5') { // this.orderState === '5' : when order is complete         
        this.goToOrderArea();
        setTimeout (() => {}, 30000);
        return;       
      }    
    });

    // suggestions data - for you section
    this.buttons = this.suggestions.Buttons;
    this.randomNumber = randomIntFromInterval(1,5);

    function randomIntFromInterval(min, max) { // min and max included 
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    this.scrollToBottom();
  }

  public ngAfterViewChecked() { 
      this.scrollToBottom();
  } 

  public ngAfterViewInit() {
      this.scrollToBottom();
  }

  public get picture(): string {
    return `${this.appSettings.acreBridgeAssets}/Banners/banner_3260c3f1-016a-421f-8048-da4a35bb9459.png`;
  }

  imagePath = `${this.appSettings.acreBridgeAssets}/Items/`;

  @HostBinding('@active')
  public get active(): boolean {
      return true;
  }

  @HostBinding('@quantity')
  public get quantity(): number {
      if (!this.items) {
          return 0;
      }
      return this.items.quantity;
  }

  goToConfirmOrder() {
    this.router.navigate(['confirmOrder'], { 
      skipLocationChange: true, 
      queryParams: {data: this.orderData} 
    });
    this.location.replaceState('confirmOrder');
  }

  goToOrderArea() {
    this.router.navigate(['orderarea'], {skipLocationChange: true}); 
    this.location.replaceState('orderarea');

    setTimeout (() => {}, 45000);
    this.router.navigate(['welcome'], {skipLocationChange: true});
    this.location.replaceState('welcome');
  }

  scrollToBottom(): void {
    try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }                 
  }

  suggestions = {
    "Buttons": [
      {
        "Caption": "Sweet Potato Fries",
        "Calories": "200 CAL",
        "Price": "250",
        "Image": "img_f3c4f5d0-9d70-4289-b32a-85200ba7f97d.png"
      },
      {
        "Caption": "Winky Brownie",
        "Calories": "200 CAL",
        "Price": "350",
        "Image": "img_f923be91-6c04-4a43-a3ab-5cf752cf8044.png"
      },
      {
        "Caption": "Orange Juice",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_65b62b8d-cee3-4f92-81aa-d980ddb9a74f.png"
      },
      {
        "Caption": "Milkshake",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_20648e96-6f12-48e7-859e-797d9905e13b.png"
      },
      {
        "Caption": "Sunny Sunday",
        "Calories": "50 CAL",
        "Price": "350",
        "Image": "img_81f527df-a08c-4193-80f7-df0b6bd2cfe0.png"
      },
      {
        "Caption": "Salad",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_1bc5f417-d0e6-434b-b5d6-aa287deaa700.png"
      },
      {
        "Caption": "Sparkling Water",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_255cd959-c57d-43cb-b3a1-28dae369636f.png"
      },
      {
        "Caption": "Coca-Cola",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_8f2dda15-b625-4cf6-920b-95fd74afbfb3.png"
      },
      {
        "Caption": "Ice Tea",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_f5519b45-69d9-4d36-ad51-aa16f0efacb2.png"
      },
      {
        "Caption": "Americano",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_9497ceeb-679b-48a2-ab7b-74e6ae462c2b.png"
      },
      {
        "Caption": "Cherry Tomatoes",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_f29d2bd2-daf7-458e-961e-d172b892bc13.png"
      },
      {
        "Caption": "Mystery Cookie",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_8806e036-f087-486e-a414-592fdf566901.png"
      },
      {
        "Caption": "Sweetapple Pie",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_63174c77-9643-4172-9c83-1332e1ce5a4b.png"
      },
      {
        "Caption": "XL Tower",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_ba353ebe-9709-4b4c-bbf4-4736b8fb6651.png"
      },
      {
        "Caption": "Sprite",
        "Calories": "50 CAL",
        "Price": "200",
        "Image": "img_bfe1f420-25fa-411f-afc5-6ef03ee44426.png"
      }
    ]
  };
}
