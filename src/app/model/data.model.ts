export interface DataModel {
    items: {
      userdata: Array<User>
    }
}

export interface User {
    firstName: string;
    lastName: string;
    address: {
        [key: string]: Address
    };
    creditdetails: {
        [key: string]: CreditCard
    }
}

export interface Address {
    street: string;
    apt: string;
    zip_code: number;
    city: string;
    state: string;
}

export interface CreditCard {
    number: number;
    cvv: number;
}
  