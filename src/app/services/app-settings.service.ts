import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AtpEnvironmentService, MocksOptions, IBundleSettings, PosServingLocation } from 'dotsdk';
import { Observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {

  // is Special of the Month active
  isSpecialOfTheMonthActive: boolean;

  // hardcoded configs:
  public readonly environmentMocksPath = '/assets/dot-sdk-mocks/atp-environment/';
  public useMocksForEnvironment: boolean;

  public readonly payMocksPath = '/assets/dot-sdk-mocks/atp-pay/';
  public useMocksForPay: boolean;

  public readonly posMocksPath = '/assets/dot-sdk-mocks/pos-injector/';
  public useMocksForPos: boolean;

  // App Config (loaded from local settings json file):
  

  // App BundleSettings:
  public defaultLanguage: string;
  public acreBridgeAssets: string;
  public sharedFolderPath: string;
  public posInjectorPath: string;
  public posInjectorPathTest: string;
  public backupPosInjectorPath: string;
  public backupPosInjectorPathTest: string;
  public modernConnectorPath: string;
  public modernConnectorFilesPath: string;
  public modernConnectorWebSocket: string;

  // App's Setings that could change after app starts:
  public serviceType: PosServingLocation;
  public languageCode: string;

  private atpEnvironmentService: AtpEnvironmentService;

  // AB Tasty related code and calls to get the payload for variations defined
  // Adding the AB Tasty analytics API to decide which screen to be displayed for different visitors
  public variationID: string;
  public promotionType: string;
  public mergedModifications: Object;
  flagShipData$: Observable<any>;
  private myFlagShipMethod = new Subject<any>();

  constructor(private httpClient: HttpClient) {
    // console.log('Version 1.1.15');
    this.flagShipData$ = this.myFlagShipMethod.asObservable();
  }

  kioskID = 1234;
  visitorID: string;    
  
  flagShipData() {
    this.visitorID = (this.kioskID * Math.floor(Math.random() * 10) + 1).toString();
    // console.log("checking app settings", this.visitorID);
    return this.httpClient.post(
      "https://decision-api.flagship.io/v1/blnnccjggr1327h6l0e0/campaigns?mode=simple",
      {
        visitor_id: this.visitorID,
        context: {
          "pageType": "Title Name",
          "device": "kiosk"
        },
        trigger_hit: true, // this is the one to use
        // Optional : see #/decision_groups for details
        decision_group: null
      }
    );
  }

  public abTasty(){
    // console.log('this.flagShipData ');
    this.flagShipData().subscribe((response: any) => {
      // // this.variationID = response.variation.id;
      // response = this.variationID;

      this.mergedModifications = response.mergedModifications;
      this.promotionType = response.mergedModifications.promotionType;

      // console.log('AB Tasty Response', response);
      // console.log('This.PromotionType', this.promotionType);

      this.myFlagShipMethod.next(response);
    });
  }

  public async initialize() {
    // Random Special of the Month
    this.isSpecialOfTheMonthActive = Math.random() < 0.5;

    // Load Apps Settings:
    const appConfig = await this.httpClient.get('/assets/config.json').toPromise();
    this.useMocksForEnvironment = appConfig['useMocksForEnvironment'];
    this.useMocksForPay = appConfig['useMocksForPay'];
    this.useMocksForPos = appConfig['useMocksForPos'];

    // Load Apps BundleSettings from ATP with the use of AtpEnvironmentService
    // Use MockOptions object to set it's (not) use of mocks:
    const mocksOptions: MocksOptions = {
      useMocks: this.useMocksForEnvironment,
      mocksFolder: this.environmentMocksPath
    };
    AtpEnvironmentService.getInstance().mocksOptions = {
      useMocks: this.useMocksForEnvironment,
      mocksFolder: this.environmentMocksPath
    };

    // Register for BS Update:
    AtpEnvironmentService.getInstance().onBundleSettingsChanged().subscribe();

    // The actual BS load:
    await this.loadBS();

    // Loading the AB Tasty call before the page load
    this.abTasty();

    // Return Succes:
    return true;
  }

  /**
   * Called at the begining of App Load and each time BS change
   */
  private async loadBS() {
    // atpEnvironmentService.getBundleSettings contains validators and it may return an error, make sure you catch it:
    // for this brif example, we return null. For a production App you will want to log this error
    const appBundleSettings: IBundleSettings = await AtpEnvironmentService.getInstance().getBundleSettings().catch((e: Error) => {
      // console.log('bs error', e); 
      return null;
    });

    if (appBundleSettings) {
      this.defaultLanguage = appBundleSettings.defaultLanguage;
      this.sharedFolderPath = appBundleSettings.sharedFolderPath;
      this.acreBridgeAssets = `${appBundleSettings.sharedFolderPath}/assets`;
      this.posInjectorPath = `${appBundleSettings.posInjectorPath}/pos/transaction`;
      this.backupPosInjectorPath = `${appBundleSettings.backupPosInjectorPath}/pos/transaction`;
      this.posInjectorPathTest = `${appBundleSettings.posInjectorPath}/pos/testconnect`;
      this.backupPosInjectorPathTest = `${appBundleSettings.backupPosInjectorPath}/pos/testconnect`;
      this.modernConnectorPath = appBundleSettings.modernConnectorPath;
      this.modernConnectorFilesPath = appBundleSettings.modernConnectorFilesPath;
      this.modernConnectorWebSocket = appBundleSettings.modernConnectorWebSocket;
    } else {
      // TODO: Could not get BS, should display error
    }
    return true;
  }
}
