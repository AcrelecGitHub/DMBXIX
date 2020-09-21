import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class ModernConnectorService extends Socket{

  constructor(private appSettings: AppSettingsService) {
    super({ 
      url: `${appSettings.modernConnectorWebSocket}`, options: {
        query: {
          deviceName: "DMB1", 
          deviceType: "DMB",
          deviceGroup: "LANE1",
          defaultScreen: "DMB1"
        } 
      }
    });
}

  listen(eventName: string) {
    return new Observable((subscriber) => {
      this.on(eventName, (data) => {
        subscriber.next(data);
      })
    });
  }

  emit(eventName: string, data: any){
    this.emit(eventName, data);
  }
}