import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {DataModel, User} from '../model/data.model';
import mockData from '../../assets/kiosk-shared-mocks/assets/secretKey.json';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private data:DataModel = mockData;

  constructor() { }

  public getData():Observable<DataModel> {
    return of(this.data);
  }

  public hasDataEntryMatchingNumber(typedNumber:string):boolean {
    return typedNumber.length === 8  && this.data.items.userdata.some(userdata => `${userdata.creditdetails.number}` === typedNumber);
  }

  public findMatchingEntryForNumber(typedNumber:string):User | null {
    return this.data.items.userdata.find(userdata => `${userdata.creditdetails.number}` === typedNumber)
  }

}