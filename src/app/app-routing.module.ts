import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SelectivePreloadingStrategyService } from './services/selective-preloading-strategy.service';

import * as pages from './pages';
import { StartupGuard } from './startup-guard';

const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: pages.WelcomeComponent },
  { path: 'ordering', component: pages.OrderingComponent },
  { path: 'confirmorder', component: pages.ConfirmOrderComponent },
  { path: 'orderarea', component: pages.OrderAreaComponent },
  { path: 'confirmOrder', component: pages.ConfirmOrderComponent },
  { 
    path: '**',
    redirectTo: '/welcome'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes, {
      useHash: true,
      preloadingStrategy: SelectivePreloadingStrategyService,
    }
  )],
  exports: [RouterModule],
  providers: [StartupGuard]
})
export class AppRoutingModule { }
