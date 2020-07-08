import { Injectable } from '@angular/core';

import { StoreConfigurationService } from './store-configuration.service';

@Injectable({
  providedIn: 'root'
})
export class KioskService {
  configReq: any;
  private dotID: string;

  stateOk = 1;
  stateNok = -1;
  stateSim = 0;

  reqAbsent = -1;
  reqSimulated = 0;
  reqActiveMandatory = 1;
  reqActiveNotMandatory = 2;
  reqTestMandatory = 3;

  constructor(private store: StoreConfigurationService ) { }

  setDotID(value: string) {
    this.dotID = value;
  }

  getDotID(): string {
    return this.dotID;
  }

  getConfigReq(): any {
    this.configReq = this.store.getJSONSection('Acrelec', 'TestSequence');
    this.configReq.paySta = 1;
  }

}
