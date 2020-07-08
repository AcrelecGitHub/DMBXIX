import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppComponent } from './app.component';

import * as pages from './pages/';
import * as components from './components';
import * as pipes from './pipes';
import bundleSettings from '../assets/dot-sdk-mocks/atp-environment/getBundleSettings.json';

import { AppSettingsService, ContentService } from './services/';
import { ModernConnectorService } from './services/modern-connector.service';

const config: SocketIoConfig = { url: `${bundleSettings.modernConnectorWebSocket}`, options: {
  query: {
    deviceName: "DMB1", 
    deviceType: "DMB",
    deviceGroup: "LANE1",
    defaultScreen: "DMB1"
  }
}};

@NgModule({
  declarations: [
    AppComponent,
    ...Object.keys(pages).map(_ => pages[_]),
    ...Object.keys(components).map(_ => components[_]),
    ...Object.keys(pipes).map(_ => pipes[_]),
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    SocketIoModule.forRoot(config),
    BrowserAnimationsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (appSettingsService: AppSettingsService, 
        contentService: ContentService) => () => appSettingsService.initialize().then(success => contentService.initialize(), error => {}),
      deps: [AppSettingsService, ContentService],
      multi: true
    },
    ModernConnectorService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() { 
  }
}
