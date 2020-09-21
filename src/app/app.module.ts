import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule } from 'ngx-socket-io';

import { AppComponent } from './app.component';

import * as pages from './pages/';
import * as components from './components';
import * as pipes from './pipes';
import { AppSettingsService, ContentService } from './services/';

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
    SocketIoModule,
    BrowserAnimationsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (appSettingsService: AppSettingsService, 
        contentService: ContentService) => () => appSettingsService.initialize().then(async (success) => {
          await contentService.initialize();
        }, error => {}),
      deps: [AppSettingsService, ContentService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() { 
  }
}
