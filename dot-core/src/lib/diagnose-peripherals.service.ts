import { Injectable } from '@angular/core';

import { KioskService } from './kiosk.service';
import { PaymentService } from './payment.service';
import { PosInjectorService } from './pos-injector.service';
import { PrintService } from './print.service';
// import { MBirdSDKWrapperSettings } from '../../mbird/services/mbird-settings.service';
import { Log } from './logger/log';

@Injectable({
  providedIn: 'root'
})
export class DiagnosePeripheralsService {

  deviceIgnore = -1;
  deviceSimulated = 0;
  deviceTest = 1;

  devicesStatusDiagnose: string;
  previousDeviceStatusDiagnose: string;
  essentialDeviceFailure: Boolean;
  peripheralsState: any;

  constructor(private kiosk: KioskService) { }

  decisionTest(kioskReq): number {
    if (kioskReq == this.kiosk.reqAbsent) {
      return this.deviceIgnore;
    } else if (kioskReq == this.kiosk.reqSimulated ) {
      return this.deviceSimulated;
    } else {
      return this.deviceTest;
    }
  }

//   async diagnosePeripheralsSequence() {
//     const self = this;

//     this.mbSettings.getPeripheralsStatus('assets/data/mbird-calls/').then((success) => {
//       Log.debug('Success = ' + JSON.stringify(success));
//       self.peripheralsState = success;


//       // ----------------test printer --------------------------
//       this.print.testPrinter(this.peripheralsState.IsPrinterAvailable);
//       // ----------------test payment --------------------------
//       this.pay.testPayment(this.peripheralsState.IsPaymentAvailable);
//       // ----------------test pos --------------------------
//       this.pos.testConnect(this.pos.testPos.bind(this));

//     }, (error) => {
//       Log.debug('Error = ' + JSON.stringify(error));
//     });

//   }

}

