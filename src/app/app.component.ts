import { Component, OnInit, HostBinding, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { AppSettingsService } from './services/app-settings.service';
import { AtpEnvironmentService } from 'dotsdk';
import { RecommendationsService } from './services/recommendations.service';

import { CODService } from '../../dot-core/src/lib/cod.service';
import { CODOrderState } from '../../dot-core/src/lib/models/cod-order-state.model';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('slide', [
        transition('* => *', [
            query(':enter', [
              style({ position: 'absolute', zIndex: '2', width: '100%', height: '100%', transform: 'translateX(100%)' }),
              animate(
                  `${400}ms cubic-bezier(.84,.14,.33,.34)`,
                  style({ position: 'absolute', zIndex: '2', width: '100%', height: '100%', transform: 'translateX(0)' })
              ) 
          ], { optional: true }),
            query(':leave', [
              style({ position: 'absolute', zIndex: '1', width: '100%', height: '100%', transform: 'translateX(0)' }),
              animate(
                  `${400}ms cubic-bezier(.84,.14,.33,.34)`,
                  style({ position: 'absolute', zIndex: '1', width: '100%', height: '100%', transform: 'translateX(-30%)' })
              )
          ], { optional: true })
        ])
    ])
  ]
})

export class AppComponent implements OnInit {
  
  @ViewChild(RouterOutlet, {static: false}) public _routerOutlet: RouterOutlet;

  constructor(public appSettings: AppSettingsService, 
    codService: CODService, 
    private _router: Router, 
    private readonly recommendationsService: RecommendationsService) { 
    codService.orderState.subscribe(_ => this.onOrderStateChange(_));
  }

  @HostBinding('@slide')
  public get activatedRoute(): ActivatedRoute {
      return this._routerOutlet && this._routerOutlet.isActivated ? this._routerOutlet.activatedRoute : null;
  }

  public ngOnInit() {
    const atpEnvironment = new AtpEnvironmentService();
    atpEnvironment.openDeveloperTools().catch(e => null);
  }

  private onOrderStateChange(orderState: CODOrderState): void {
    switch (orderState) {
        case CODOrderState.Idle:
            this._router.navigateByUrl('welcome');
            break;
        case CODOrderState.InProgress:
            this._router.navigateByUrl('ordering');
            break;
        case CODOrderState.Confirmation:
            this._router.navigateByUrl('confirmorder');
            break;
        case CODOrderState.Completed:
            this._router.navigateByUrl('endorder');
            break;
    }
  }
}
