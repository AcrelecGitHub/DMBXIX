export class PeripheralsStatusDetails {
    Printer: PeripheralsStatusDetailsData;
    Scanner: PeripheralsStatusDetailsData;
    Scale: PeripheralsStatusDetailsData;
    Camera: PeripheralsStatusDetailsData;
    Payment: PeripheralsStatusDetailsData;
    NFC: PeripheralsStatusDetailsData;
    MagReader: PeripheralsStatusDetailsData;
    Wireless: PeripheralsStatusDetailsData;
    InternetAccess: PeripheralsStatusDetailsData;
    IOBoard: PeripheralsStatusDetailsData;
    FiscalPrinter: PeripheralsStatusDetailsData;
    Payments: any[];
    Printers: any[];
}
export class PeripheralsStatusDetailsData {
    StatusCode: number;
    Status: boolean;
    Description: string;
}
