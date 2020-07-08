import { Injectable } from '@angular/core';
import { CustomerData } from './models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  customers: CustomerData;
  private customerFID = '';
  constructor() {
    this.customers = new CustomerData();
  }

  setCustomerInfo( face: any ) {
    for ( let i = 0; i < (face as any).length; i++ ) {
      if ( face[i].faceAttributes.hasOwnProperty('gender') ) {
        if ( face[i].faceAttributes.gender === 'male' ) {
          this.customers.man = 1;
        } else {
          this.customers.woman = 1;
        }
      }
    }
    if ( (face as any).length > 1 ) {
      this.customers.many = 1;
    }
  }

  clear() {
    for (const prop in this.customers) {
      if (this.customers.hasOwnProperty(prop)) {
        this.customers[prop] = '';
      }
    }
  }

  setCustomerFID( value: string ) {
    this.customerFID = value;
  }

  getCustomerFID(): string {
    return this.customerFID;
  }

}


