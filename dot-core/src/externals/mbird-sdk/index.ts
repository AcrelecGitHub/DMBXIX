/*
Acrelec Software (c) 2016 - 2019
version 6.1.1
release date: 28.05.2019
*/

export module MBirdSdk {

    declare var window: IMyWindow;
    var _canBeClosed: (payload?: any) => void;
    var _canReceiveChannelContent: (payload?: any) => void;

    export function isConnected() {
        var sdkHandler = window["JavaScriptSdkHandlerFullAsync"] as IJavaScriptSdkHandler;
        return (sdkHandler != null);
    }

    export function SdkVersion() {
        return "6.1.1";
    }

    class Base {

        protected static executeCommand(command: string): Promise<Object> {
            var sdkHandler = window["JavaScriptSdkHandlerFullAsync"] as IJavaScriptSdkHandler;

            return new Promise((resolve) => {
                sdkHandler.executeWithCommand(command, (response) => {
                    var responseParsed: Object = "";

                    try {
                        responseParsed = JSON.parse(response);
                    } catch (ex) {
                        resolve(response);
                    }

                    if (sdkHandler && command != null) {
                        try {
                            var obj = JSON.parse(responseParsed.toString());
                            resolve(obj);
                        } catch (ex) {
                            resolve(responseParsed);
                        }
                    }

                    resolve(response);
                });
            });
        }

        protected static executeNumber(command: string, value?: number): Promise<Object> {
            var sdkHandler = window["JavaScriptSdkHandlerFullAsync"] as IJavaScriptSdkHandler;

            return new Promise((resolve) => {

                sdkHandler.executeWithNumber(command, value, (response) => {
                    var responseParsed: Object = "";

                    try {
                        responseParsed = JSON.parse(response);
                    } catch (ex) {
                        resolve(response);
                    }

                    if (sdkHandler && command != null) {
                        try {
                            var obj = JSON.parse(responseParsed.toString());
                            resolve(obj);
                        } catch (ex) {
                            resolve(responseParsed);
                        }
                    }

                    resolve(response);
                });
            });
        }

        protected static executeString(command: string, content?: string): Promise<Object> {
            var sdkHandler = window["JavaScriptSdkHandlerFullAsync"] as IJavaScriptSdkHandler;

            return new Promise((resolve) => {
                sdkHandler.executeWithString(command, content, (response) => {
                    var responseParsed: Object = "";

                    try {
                        responseParsed = JSON.parse(response);
                    } catch (ex) {
                        resolve(response);
                    }

                    if (sdkHandler && command != null) {
                        try {
                            var obj = JSON.parse(responseParsed.toString());
                            resolve(obj);
                        } catch (ex) {
                            resolve(responseParsed);
                        }
                    }

                    resolve(response);
                });
            });
        }

        protected static executeIoCommand(command: string, parameters: string, content?: any): Promise<Object> {
            var sdkHandler = window["JavaScriptSdkHandlerFullAsync"] as IJavaScriptSdkHandler;

            return new Promise((resolve) => {

                sdkHandler.executeIoCommand(command, parameters, content, (response) => {
                    var responseParsed: Object = "";

                    try {
                        responseParsed = JSON.parse(response);
                    } catch (ex) {
                        resolve(response);
                    }

                    if (sdkHandler && command != null) {
                        try {
                            var obj = JSON.parse(responseParsed.toString());
                            resolve(obj);
                        } catch (ex) {
                            resolve(responseParsed);
                        }
                    }

                    resolve(response);
                });
            });
        }
    }

    export class Admin extends Base {
        static Open(): Promise<boolean> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("OpenAdmin").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }
    }

    export class App extends Base {

        static Hide(): Promise<boolean> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("Hide").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static GetDetails(): Promise<Object> {
            console.warn("App.GetDetails will be deprecated in the future, use Settings.AppDetails instead");
            return Settings.AppDetails();
        }

        static GetToken(): Promise<Object> {
            console.warn("App.GetToken will be deprecated in the future, use Settings.GetToken instead");
            return Settings.GetToken();
        }

        static WriteLog(message: string, isError: boolean): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (message == null || message.length === 0) {
                    reject("Log message is empty!");
                    return;
                }

                var obj: any = {
                    message: message,
                    isError: isError
                };

                Base.executeString("WriteLog", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static DeveloperTools(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("ShowDevTools").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });

            });
        }

        static BrowserVersion(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetBrowserVersion").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static OnInactivity(callback: () => void) {
            console.warn("App.OnInactivity will be deprecated in the future, use Callbacks.Inactivity instead");
            return Callbacks.Inactivity(callback);
        }
    }

    export class Callbacks extends Base {
        static Inactivity(callback: (payload?: any) => void) {
            CallbacksManager.On("Inactivity", callback);
        }
    }

    export class ChannelCallbacks extends Base {
        static CanReceiveChannelContent(callback: (payload?: any) => void) {
            _canReceiveChannelContent = callback;
        }

        static ChannelContentReceived(callback: (payload?: any) => void) {
            CallbacksManager.On("ChannelCallbacks.ChannelContentReceived", callback);
        }
    }

    export class SingleAppCallbacks extends Base {
        static CanBeClosed(callback: (payload?: any) => void) {
            _canBeClosed = callback;
        }
    }

    export class UserInterface extends Base {
        static CloseButton(alignment: UIAlignment, imageBase64: string, xPadding: number, yPadding: number): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (alignment == null) {
                    reject("Alignment type cannot be null!");
                    return;
                }

                var obj: any = {
                    xPadding: xPadding,
                    yPadding: yPadding,
                    alignment: UIAlignment[alignment],
                    imageBase64: imageBase64
                };

                Base.executeString("UIChangeCloseButton", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }
    }

    export class Core extends Base {

        static DeveloperTools(): Promise<Object> {
            console.warn("Core.DeveloperTools will be deprecated in the future, use App.DeveloperTools instead");
            return App.DeveloperTools();
        }

        static BrowserVersion(): Promise<Object> {
            console.warn("Core.BrowserVersion will be deprecated in the future, use App.BrowserVersion instead");
            return App.BrowserVersion();
        }

        static OpenAdmin(): Promise<boolean> {
            console.warn("Core.OpenAdmin is deprecated, please use Admin.Open instead!");
            return Admin.Open();
        }

        static GetVolume(): Promise<Number> {
            console.warn("Core.GetVolume is deprecated, please use Volume.Get instead!");
            return Volume.Get();
        }

        static GetWeather(): Promise<Object> {
            console.warn("Core.GetWeather is deprecated, please use Weather.Current instead!");
            return Weather.Current();
        }

        static UpdateVolume(value: string): Promise<boolean> {
            console.warn("Core.UpdateVolume is deprecated, please use Volume.Update instead!");
            return Volume.Update(value);
        }

        static Hide(): Promise<boolean> {
            console.warn("Core.Hide is deprecated, please use App.Hide instead!");
            return App.Hide();
        }

        static CallbackWithResponse(message: string, params?: any): any {
            switch (message) {
                case "SingleAppCallbacks.CanBeClosed":
                    {
                        return _canBeClosed.call(params);
                    }
                case "ChannelCallbacks.CanReceiveChannelContent":
                    {
                        return _canReceiveChannelContent.call(params);
                    }
            }

            return null;
        }

        static Callback(message: string, params?: any) {
            var response: string;
            switch (message) {
                case "BundlesettingsChanged":
                    {
                        CallbacksManager.Trigger("BundlesettingsChanged", null);
                        break;
                    }

                case "KioskSettingsChanged":
                    {
                        CallbacksManager.Trigger("KioskSettingsChanged", null);
                        break;
                    }

                case "StoreSettingsChanged":
                    {
                        CallbacksManager.Trigger("StoreSettingsChanged", null);
                        break;
                    }

                case "PayProgress":
                    {
                        try {
                            response = JSON.parse(params);
                        } catch (ex) {
                            response = params;
                        }
                        CallbacksManager.Trigger("PayProgress", response);
                        break;
                    }

                case "NewMessage":
                    {
                        try {
                            response = JSON.parse(params);
                        } catch (ex) {
                            response = params;
                        }
                        CallbacksManager.Trigger("NewMessage", response);
                        break;
                    }
                case "WingsNewMessage":
                    {
                        try {
                            response = JSON.parse(params);
                        } catch (ex) {
                            response = params;
                        }
                        CallbacksManager.Trigger("WingsNewMessage", response);
                        break;
                    }

                case "AsyncResponse":
                    {
                        try {
                            response = JSON.parse(params);
                        } catch (ex) {
                            response = params;
                        }
                        CallbacksManager.Trigger("WingsNewMessage", response);
                        break;
                    }

                case "Inactivity":
                    {
                        CallbacksManager.Trigger("Inactivity");
                        break;
                    }

                case "ChannelCallbacks.ChannelContentReceived":
                    {
                        CallbacksManager.Trigger("ChannelCallbacks.ChannelContentReceived");
                        break;
                    }

                case "ConsumptionCallbacks.Warning":
                    {
                        CallbacksManager.Trigger("ConsumptionCallbacks.Warning", params);
                        break;
                    }

                case "ConsumptionCallbacks.LastCall":
                    {
                        CallbacksManager.Trigger("ConsumptionCallbacks.LastCall", params);
                        break;
                    }

                case "EventRaised":
                    {
                        try {
                            response = JSON.parse(params);
                        } catch (ex) {
                            response = params;
                        }
                        CallbacksManager.Trigger("EventRaised", response);
                        break;
                    }
            }
        }
    }

    export class Board extends Base {
        static ShowNotification(title: string, message: string, notificationType: NotificationType, switchToAppIdentifier: string, fullNotification: boolean): Promise<boolean> {
            console.warn("Board.ShowNotification is deprecated, please use Notification.Show instead!");
            return Notification.Show(title, message, notificationType, switchToAppIdentifier, fullNotification);
        }

        static GetInfo(): Promise<Object> {
            console.warn("Board.GetInfo is deprecated, please use Settings.GetToken and Settings.GetCapabilities instead!");

            return new Promise((resolve, reject) => {
                Base.executeCommand("GetInfo").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Capabilities(): Promise<Object> {
            console.warn("Board.GetInfo is deprecated, please use Settings.GetToken and Settings.GetCapabilities instead!");

            return Settings.GetCapabilities();
        }

        static Tags(): Promise<Object> {
            console.warn("Board.Tags is deprecated, please use Environment.Tags instead!");
            return Environment.Tags();
        }

        static GetWorkingHours(): Promise<Object> {
            console.warn("Board.GetWorkingHours is deprecated, please use Environment.WorkingHours instead!");
            return Environment.WorkingHours();
        }
    }

    export class Weather extends Base {

        static Current(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetWeather").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class Volume extends Base {

        static Update(value: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (value == null || value.length === 0) {
                    reject("Value cannot be null or empty!");
                    return;
                }

                Base.executeNumber("UpdateVolume", parseInt(value)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static Get(): Promise<Number> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetVolume").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(Number(response.Result));
                });
            });
        }

    }

    export class Notification extends Base {

        static Show(title: string, message: string, notificationType: NotificationType, switchToAppIdentifier: string, fullNotification: boolean): Promise<boolean> {
            return new Promise((resolve, reject) => {

                if (title == null || title.trim().length === 0) {
                    reject("Notification title is empty");
                    return;
                }

                if (message == null || message.trim().length === 0) {
                    reject("Notification message is empty");
                    return;
                }

                var notificationTypeValue = "message";

                if (notificationType === NotificationType.HtmlContent)
                    notificationTypeValue = "htmlcontent";

                if (notificationType === NotificationType.HtmlFile)
                    notificationTypeValue = "htmlfile";

                if (notificationType === NotificationType.WarningMessage)
                    notificationTypeValue = "warning_message";

                if (notificationType === NotificationType.InfoMessage)
                    notificationTypeValue = "info_message";

                var obj: any = {
                    title: title,
                    message: message,
                    switchToAppIdentifier: switchToAppIdentifier,
                    notificationType: notificationTypeValue,
                    fullNotification: fullNotification
                };

                Base.executeString("ShowNotification", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }
    }

    export class IOBoard extends Base {
        static ExecuteCommand(commandType: IOBoardCommandType, params?: any): Promise<boolean> {

            return new Promise((resolve, reject) => {

                if (commandType == null) {
                    reject("Command type cannot be null!");
                    return;
                }

                var obj: any = {
                    commandType: IOBoardCommandType[commandType],
                    params: params
                };

                Base.executeString("ExecuteIOBoardCommand", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Status(): Promise<boolean> {
            return new Promise((resolve, reject) => {
                Base.executeString("IOBoard.Status").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

    }

    export class Scanner extends Base {
        static Scan(value: number): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Timeout seconds is invalid");
                    return;
                }

                Base.executeNumber("Scan", value).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class Nfc extends Base {
        static Read(value: number): Promise<Object> {
            console.warn("Nfc.Read will be deprecated in the future, use NfcReader.Read instead");
            return NfcReader.Read(value);
        }

        static ReadFileInfo(value: number, applicationId: string, authenticationKey: string): Promise<Object> {
            console.warn("Nfc.ReadFileInfo will be deprecated in the future, use NfcReader.FileInfo instead");
            return NfcReader.FileInfo(value, applicationId, authenticationKey);
        }
    }

    export class NfcReader extends Base {
        static Read(value: number): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Timeout seconds is invalid");
                    return;
                }

                Base.executeNumber("NfcRead", value).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static FileInfo(value: number, applicationId: string, authenticationKey: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Timeout seconds is invalid");
                    return;
                }

                if (applicationId.trim().length === 0) {
                    reject("Application Id is empty");
                    return;
                }

                if (authenticationKey.trim().length === 0) {
                    reject("Authentication Key is empty");
                    return;
                }

                var obj: any = {
                    ApplicationID: applicationId.trim(),
                    AuthenticationKey: authenticationKey.trim(),
                    Seconds: value
                };

                Base.executeString("NfcReadFileInfo", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class MagReader extends Base {
        static Read(value: number): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Timeout seconds is invalid");
                    return;
                }

                Base.executeNumber("MagReader.Read", value).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class Camera extends Base {
        static Snapshot(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("CameraSnapshot").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class FiscalPrinter extends Base {
        static PrintFiscalTicket(value: string, fiscalPrinterReceipts?: boolean, hasCustomerReceipt?: boolean, printPayReceiptsFirst?: boolean): Promise<Object> {
            return new Promise((resolve, reject) => {
                try {
                    JSON.parse(value);
                } catch (e) {
                    reject("The ticket text is not a valid JSON");
                    return;
                }

                var objWithName = {
                    content: value,
                    fiscalPrinterReceipts: fiscalPrinterReceipts,
                    hasCustomerReceipt: hasCustomerReceipt,
                    printPayReceiptsFirst: printPayReceiptsFirst
                };

                Base.executeString("FiscalPrinter.PrintFiscalTicketWithParams", JSON.stringify(objWithName)).then(
                    (response: ISdkResponse) => {
                        if (response.Error) {
                            reject(response.Error);
                            return;
                        }
                        resolve(true);
                    });
            });
        }
    }

    export class Printer extends Base {
        static TagContent(value: string, name: string = ""): Promise<Object> {
            console.warn("Printer.TagContent will be deprecated in the future, use Printer.PrintTagContent instead");
            return Printer.PrintTagContent(value, name);
        }

        static PrintTagContent(value: string, name: string = ""): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Print text cannot be empty");
                    return;
                }

                if (name.trim() === "") {
                    // need to keep this for backward compatibility
                    Base.executeString("PrintTagContent", value).then((response: ISdkResponse) => {
                        if (response.Error) {
                            reject(response.Error);
                            return;
                        }
                        resolve(true);
                    });
                } else {
                    var objWithName: any = {
                        Value: value,
                        PrinterName: name
                    };

                    Base.executeString("PrintTagContentWithName", JSON.stringify(objWithName)).then(
                        (response: ISdkResponse) => {
                            if (response.Error) {
                                reject(response.Error);
                                return;
                            }
                            resolve(true);
                        });
                }
            });
        }

        static SaveReceiptTagContent(value: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Print text cannot be empty");
                    return;
                }

                // need to keep this for backward compatibility
                Base.executeString("Printer.SaveReceiptTagContent", value).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }
    }

    export class Scale extends Base {
        static MeasureWeight(value: number): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (value == null) {
                    reject("Timeout seconds is invalid");
                    return;
                }

                Base.executeNumber("MeasureWeight", value).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class Peripherals extends Base {
        static Status(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetPeripheralsStatus").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static StatusDetails(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetPeripheralsStatusDetails").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Details(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetPeripheralDetails").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class Payment extends Base {
        static Pay(amount: number, transactionReference: string, name: string = ""): Promise<Object> {
            return new Promise((resolve, reject) => {

                if (Number.isInteger(amount) == false) {
                    reject("The amount must be an integer, current value: " + amount);
                    return;
                }

                if (amount <= 0) {
                    reject("The amount must be greater than 0, current value: " + amount);
                    return;
                }

                var obj: any = {
                    Amount: amount.toString(),
                    TransactionReference: transactionReference
                };

                if (name.trim() === "") {
                    // need to keep this for backward compatibility
                    Base.executeString("Pay", JSON.stringify(obj)).then((response: ISdkResponse) => {
                        if (response.Error) {
                            reject(response.Error);
                            return;
                        }
                        resolve(response.Result);
                    });
                } else {
                    // prepare object for payment with name
                    var objWithName: any = {
                        PayRequest: obj,
                        PaymentName: name
                    };

                    Base.executeString("PayWithName", JSON.stringify(objWithName)).then((response: ISdkResponse) => {
                        if (response.Error) {
                            reject(response.Error);
                            return;
                        }
                        resolve(response.Result);
                    });
                }
            });
        }

        static ElectronicPay(amount: number, transactionReference: string, name: string = ""): Promise<Object> {
            return new Promise((resolve, reject) => {

                if (Number.isInteger(amount) == false) {
                    reject("The amount must be an integer, current value: " + amount);
                    return;
                }

                if (amount <= 0) {
                    reject("The amount must be greater than 0, current value: " + amount);
                    return;
                }

                // prepare object for payment
                var obj: any = {
                    PayRequest: {
                        Amount: amount.toString(),
                        TransactionReference: transactionReference
                    },
                    PaymentName: name
                };

                Base.executeString("ElectronicPay", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static GetAcceptedCurrencies(name: string = ""): Promise<Object> {
            return new Promise((resolve, reject) => {
                // prepare object for payment
                var obj: any = {
                    PaymentName: name
                };

                Base.executeString("GetAcceptedCurrencies", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static StartAcceptMoney(name: string = ""): Promise<Object> {
            return new Promise((resolve, reject) => {
                // prepare object for payment
                var obj: any = {
                    PaymentName: name
                };

                Base.executeString("StartAcceptMoney", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static EndAcceptMoney(amountToBeKept: number, name: string = ""): Promise<Object> {
            return new Promise((resolve, reject) => {

                if (Number.isInteger(amountToBeKept) == false) {
                    reject("The amount must be an integer, current value: " + amountToBeKept);
                    return;
                }

                // prepare object for payment
                var obj: any = {
                    PayRequest: {
                        Amount: amountToBeKept.toString()
                    },
                    PaymentName: name
                };

                Base.executeString("EndAcceptMoney", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static OnProgress(callback: (payload?: any) => void) {
            console.warn("Payment.OnProgress will be deprecated in the future, use PaymentCallbacks.PayProgress instead");
            PaymentCallbacks.PayProgress(callback);
        }
    }

    export class PaymentCallbacks extends Base {
        static PayProgress(callback: (payload?: any) => void) {
            CallbacksManager.On("PayProgress", callback);
        }
    }

    class TraceTimeline extends Base {

        static Start(): Promise<boolean> {
            return new Promise((resolve, reject) => {
                Base.executeString("Trace.TraceTimeline.Start").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Add(traceIdentifier: string, type: string): Promise<boolean> {
            return new Promise((resolve, reject) => {

                var data = {
                    TraceIdentifier: traceIdentifier,
                    Type: type
                };

                Base.executeString("Trace.TraceTimeline.Add", JSON.stringify(data)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static Stop(traceIdentifier: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                Base.executeString("Trace.TraceTimeline.Stop", traceIdentifier).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }
    }

    export class Trace extends Base {

        static AddTransaction(transactionWasSuccessful: boolean, transactionReference: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (transactionWasSuccessful == null) {
                    reject("You must specify if transaction was successful or not");
                    return;
                }

                var transaction = {
                    TransactionWasSuccessful: transactionWasSuccessful,
                    TransactionReference: transactionReference
                };

                Base.executeString("TraceTransaction", JSON.stringify(transaction)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static AddEvent(event: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                try {
                    JSON.parse(event);
                } catch (e) {
                    reject("Event is not a valid JSON");
                    return;
                }

                Base.executeString("TraceEvent", event).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static AddAlert(alertType: string, emailSubject: string, emailBody: string, details: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                try {
                    if (details !== "")
                        JSON.parse(details);
                } catch (e) {
                    reject("Details is not a valid JSON");
                    return;
                }

                var alert = {
                    AlertType: alertType,
                    EmailSubject: emailSubject,
                    EmailBody: emailBody,
                    Details: details
                };

                Base.executeString("AddAlert", JSON.stringify(alert)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static AddStatus(status: string): Promise<boolean> {
            return new Promise((resolve, reject) => {

                try {
                    JSON.parse(status);
                } catch (e) {
                    reject("Status is not a valid JSON");
                    return;
                }

                Base.executeString("TraceStatus", status).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }


        static Transaction(transactionWasSuccessful: boolean, transactionReference: string): Promise<boolean> {
            console.warn("Trace.Transaction will be deprecated in the future, use Trace.AddTransaction instead");
            return Trace.AddTransaction(transactionWasSuccessful, transactionReference);
        }

        static Event(event: Object): Promise<boolean> {
            console.warn("Trace.Event will be deprecated in the future, use Trace.AddEvent instead");
            return Trace.AddEvent(JSON.stringify(event));
        }

        static Status(status: Object): Promise<boolean> {
            console.warn("Trace.Status will be deprecated in the future, use Trace.AddStatus instead");
            return Trace.AddStatus(JSON.stringify(status));
        }

        static Timeline = TraceTimeline;
    }

    export class BundleSettings extends Base {

        static Kiosk(): Promise<Object> {
            console.warn("BundleSettings.Kiosk will be deprecated in the future, use Settings.KioskSettings instead");
            return Settings.KioskSettings();
        }

        static Store(): Promise<Object> {
            console.warn("BundleSettings.Store will be deprecated in the future, use Settings.StoreSettings instead");
            return Settings.StoreSettings();
        }

        static App(): Promise<Object> {
            console.warn("BundleSettings.App will be deprecated in the future, use Settings.BundleSettings instead");
            return Settings.BundleSettings();
        }

        static OnAppSettingsChanged(callback: (payload?: any) => void) {
            console.warn("BundleSettings.OnAppSettingsChanged will be deprecated in the future, use BundleSettingsCallbacks.BundlesettingsChanged instead");
            BundleSettingsCallbacks.BundlesettingsChanged(callback);
        }
    }

    export class Settings extends Base {

        static KioskSettings(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetKioskSettings").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static StoreSettings(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetStoreSettings").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static BundleSettings(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetBundleSettingsLive").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static GetToken(): Promise<string> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetToken").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static GetCapabilities(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("Capabilities").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static AppDetails(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetAppDetails").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class BundleSettingsCallbacks extends Base {

        static BundlesettingsChanged(callback: (payload?: any) => void) {
            CallbacksManager.On("BundlesettingsChanged", callback);
        }

        static KioskSettingsChanged(callback: (payload?: any) => void) {
            CallbacksManager.On("KioskSettingsChanged", callback);
        }

        static StoreSettingsChanged(callback: (payload?: any) => void) {
            CallbacksManager.On("StoreSettingsChanged", callback);
        }
    }

    export class Sharing extends Base {

        static Register(name: string): Promise<boolean> {
            console.warn("Sharing.Register will be deprecated in the future, use Tweet.Register instead");
            return Tweet.Register(name);
        }

        static Discover(friendApps: SharedFriendApp[]): Promise<Object> {
            console.warn("Sharing.Discover will be deprecated in the future, use Tweet.Discover instead");
            return Tweet.Discover(friendApps);
        }

        static Message(destination: FoundFriendApp, message: string, waitForAnswer: boolean): Promise<Object> {
            console.warn("Sharing.Message will be deprecated in the future, use Tweet.NewMessage instead");
            return Tweet.NewMessage(destination, message, waitForAnswer);
        }

        static OnNewMessage(callback: (payload?: any) => void) {
            console.warn("Sharing.OnNewMessage will be deprecated in the future, use SharingCallbacks.NewMessage instead");
            SharingCallbacks.NewMessage(callback);
        }
    }

    export class Tweet extends Base {

        static Discover(friendApps: SharedFriendApp[]): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (friendApps == null || friendApps.length === 0) {
                    reject("Friend apps cannot be empty!");
                    return;
                }

                Base.executeString("Discover", JSON.stringify(friendApps)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static DiscoverByTopic(topics: string[]): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (topics == null || topics.length === 0) {
                    reject("Topics cannot be empty!");
                    return;
                }

                Base.executeString("DiscoverByTopic", JSON.stringify(topics)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static NewMessage(destination: FoundFriendApp, message: string, waitForAnswer: boolean): Promise<Object> {
            return new Promise((resolve, reject) => {

                // check if the message is a json format
                try {
                    JSON.parse(message);
                } catch (ex) {
                    reject("The message has to be a stringified JSON.");
                    return;
                }

                var obj: any = {
                    Destination: destination,
                    Message: message,
                    WaitForAnswer: waitForAnswer
                };

                Base.executeString("Message", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Register(name: string, topics?: string[]): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (name == null || name.length === 0) {
                    reject("Name cannot be null or empty");
                    return;
                }

                if (topics && topics.length > 0) {
                    var obj: any = {
                        Context: name,
                        Topics: topics
                    };

                    Base.executeString("RegisterWithTopics", JSON.stringify(obj)).then((response: ISdkResponse) => {
                        if (response.Error) {
                            reject(response.Error);
                            return;
                        }
                        resolve(true);
                    });
                } else {
                    Base.executeString("Register", name).then((response: ISdkResponse) => {
                        if (response.Error) {
                            reject(response.Error);
                            return;
                        }
                        resolve(true);
                    });
                }
            });
        }
    }

    export class SharingCallbacks extends Base {

        static NewMessage(callback: (payload?: any) => void) {
            CallbacksManager.On("NewMessage", callback);
        }
    }

    export class Wings extends Base {

        static Status(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("WingsStatus").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Subscribe(name: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (name == null || name.length === 0) {
                    reject("Topic name cannot be empty");
                    return;
                }
                Base.executeString("Subscribe", name).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static Unsubscribe(name: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (name == null || name.length === 0) {
                    reject("Topic name cannot be null or empty!");
                    return;
                }

                Base.executeString("Unsubscribe", name).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static Publish(message: string, topic: string, id: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                if (topic == null || topic.length === 0) {
                    reject("Topic name cannot be null or empty!");
                    return;
                }

                // check if the message is a json format
                try {
                    JSON.parse(message);
                } catch (ex) {
                    reject("The message has to be a stringified JSON.");
                    return;
                }

                var obj: any = {
                    Topic: topic,
                    Message: message,
                    Id: id
                };

                Base.executeString("Publish", JSON.stringify(obj)).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(true);
                });
            });
        }

        static OnNewMessage(callback: (payload?: any) => void) {
            console.warn("Wings.OnNewMessage will be deprecated in the future, use WingsCallbacks.NewMessage instead");
            WingsCallbacks.NewMessage(callback);
        }
    }

    export class WingsCallbacks extends Base {

        static NewMessage(callback: (payload?: any) => void) {
            CallbacksManager.On("WingsNewMessage", callback);
        }
    }

    export class ConsumptionCallbacks extends Base {

        static Warning(callback: (payload?: any) => void) {
            CallbacksManager.On("ConsumptionCallbacks.Warning", callback);
        }

        static LastCall(callback: (payload?: any) => void) {
            CallbacksManager.On("ConsumptionCallbacks.LastCall", callback);
        }
    }

    export class Environment extends Base {

        static About(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetEnvironmentAbout").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Tags(): Promise<string> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("Tags").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static StoreTags(): Promise<string> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("StoreTags").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static WorkingHours(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetWorkingHours").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static GeoLocation(): Promise<Object> {
            console.warn("Environment.GeoLocation will be deprecated in the future, use GeoLocation.Current instead");
            return GeoLocation.Current();
        }
    }

    export class EventTriggers extends Base {

        static Register(events: string[]): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (events == null || events.length == 0) {
                    reject("events lists is empty");
                    return;
                }

                Base.executeString("EventsRegister", JSON.stringify({ events: events })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Unregister(events: string[]): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (events == null || events.length == 0) {
                    reject("events lists is empty");
                    return;
                }

                Base.executeString("EventTriggers.Unregister", JSON.stringify({ events: events })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static List(): Promise<Object> {
            return new Promise((resolve, reject) => {

                var eventsNames: string[] = [];

                for (var event in RegisteredEventType) {
                    var name = RegisteredEventType[event];

                    if (name.length > 2)
                        eventsNames.push(name);
                }

                resolve(eventsNames);
            });
        }

        static OnEventRaised(callback: (payload?: any) => void) {
            CallbacksManager.On("EventRaised", callback);
        }
    }

    export class GeoLocation extends Base {

        static Current(): Promise<Object> {
            return new Promise((resolve, reject) => {
                Base.executeCommand("GetEnvironmentGeoLocation").then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

    }

    export class Directory extends Base {

        static Create(path: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("Directory.Create", JSON.stringify({ Path: path })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Delete(path: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("Directory.Delete", JSON.stringify({ Path: path })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static MoveTo(path: string, newPath: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                if (newPath == null || newPath.length === 0) {
                    reject("new path is empty");
                    return;
                }

                Base.executeIoCommand("Directory.MoveTo", JSON.stringify({ Path: path, NewPath: newPath })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Size(path: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("Directory.Size", JSON.stringify({ Path: path })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static List(path: string, filter?: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("Directory.List", JSON.stringify({ Path: path, Filter: filter })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    export class File extends Base {

        static Size(path: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("File.Size", JSON.stringify({ Path: path })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Delete(path: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("File.Delete", JSON.stringify({ Path: path })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Read(path: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("File.Read", JSON.stringify({ Path: path })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static Write(path: string, content: string, append: boolean = false): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("File.Write", JSON.stringify({ Path: path, TextContent: content, IsAppend: append })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static WriteBytes(path: string, content: any): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                var jssdkUrl = window["JSSDKUrl"] as string;

                var xhr = new XMLHttpRequest();
                xhr.open("POST", jssdkUrl + "/jssdk/upload", true);
                xhr.setRequestHeader("Path", path);

                xhr.onload = () => {
                    // Request finished. Do processing here.
                    if (xhr.status >= 200 && xhr.status < 300) {
                        var responseParsed: ISdkResponse;

                        try {
                            responseParsed = JSON.parse(xhr.response);
                        } catch (ex) {
                            responseParsed = xhr.response;
                        }

                        if (responseParsed.Error) {
                            reject(responseParsed.Error);
                            return;
                        }
                        resolve(responseParsed.Result);
                    };
                };

                xhr.onerror = () => reject(xhr.statusText);
                xhr.send(content);
            });
        }

        static MoveTo(path: string, newPath: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                if (newPath == null || newPath.length === 0) {
                    reject("new path is empty");
                    return;
                }

                Base.executeIoCommand("File.MoveTo", JSON.stringify({ Path: path, NewPath: newPath })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static CopyTo(path: string, newPath: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }

                if (newPath == null || newPath.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("File.CopyTo", JSON.stringify({ Path: path, NewPath: newPath })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }

        static DownloadUrlTo(path: string, url: string): Promise<Object> {
            return new Promise((resolve, reject) => {
                if (path == null || path.length === 0) {
                    reject("path is empty");
                    return;
                }
                if (url == null || url.length === 0) {
                    reject("path is empty");
                    return;
                }

                Base.executeIoCommand("File.DownloadUrlTo", JSON.stringify({ Path: path, Url: url })).then((response: ISdkResponse) => {
                    if (response.Error) {
                        reject(response.Error);
                        return;
                    }
                    resolve(response.Result);
                });
            });
        }
    }

    class CallbacksManager {

        private static callbacks: any = {};

        static On(message: string, callback: (payload?: any) => void) {
            var msg: ICallback = this.callbacks[message] || <ICallback>(this.callbacks[message] = new Callback(message));
            return msg.subscribe(callback);
        }

        static Off(callback: string, token: number) {
            if (this.callbacks[callback]) {
                (<ICallback>(this.callbacks[callback])).unSubscribe(token);
            }
        }

        static Trigger(callback: string, payload?: any) {
            if (this.callbacks[callback]) {
                (<ICallback>(this.callbacks[callback])).notify(payload);
            }
        }
    }

    class Subscription {
        constructor(
            public id: number,
            public callback: (payload?: any) => void) {
        }
    }

    export class SharedFriendApp {
        constructor(
            public AppIdentifier: string,
            public Context: string) {
        }
    }

    export class FoundFriendApp {
        constructor(
            public AppIdentifier: string,
            public Context: string,
            public EntityIp: string) {
        }
    }

    interface ICallback {
        subscribe(callback: (payload?: any) => void): number;
        unSubscribe(id: number): void;
        notify(payload?: any): void;
    }

    class Callback implements ICallback {

        private subscriptions: Subscription[];
        private nextId: number;

        constructor(public callback: string) {
            this.subscriptions = [];
            this.nextId = 0;
        }

        public subscribe(callback: (payload?: any) => void) {
            var subscription = new Subscription(this.nextId++, callback);
            this.subscriptions[subscription.id] = subscription;
            return subscription.id;
        }

        public unSubscribe(id: number) {
            this.subscriptions[id] = undefined;
        }

        public notify(payload?: any) {
            for (var index = 0; index < this.subscriptions.length; index++) {
                if (this.subscriptions[index]) {
                    this.subscriptions[index].callback(payload);
                }
            }
        }
    }

    export enum NotificationType {
        Message,
        HtmlFile,
        HtmlContent,
        WarningMessage,
        InfoMessage
    }

    export enum IOBoardCommandType {
        OpenPrinterDoor,
        OpenMaintenanceDoor,
        OpenAdditionalDoor,
        SetSemaphoreOK,
        SetSemaphoreNOK,
        OpenBarrier,
        SetCustomerJourneyPaymentON, // isBlinking
        SetCustomerJourneyPaymentOFF,
        SetCustomerJourneyPrinterON, // isBlinking
        SetCustomerJourneyPrinterOFF,
        SetCustomerJourneyScannerON, // isBlinking
        SetCustomerJourneyScannerOFF,
        SetBlinkStickOFF,
        SetBlinkStickON // isBlinking & color
    }

    export enum UIAlignment {
        TopLeft,
        TopCenter,
        TopRight,
        MiddleLeft,
        MiddleCenter,
        MiddleRight,
        BottomLeft,
        BottomCenter,
        BottomRight,
        Hide
    }

    enum RegisteredEventType {
        IOboard_CustomerDetected,
        IOboard_KeyAccessUsed,
        IOboard_AdditionalDoorStateChanged,
        IOboard_MaintenanceDoorStateChanged,
        IOboard_PrinterDoorStateChanged,
        MagReader_DataRead,
        Scanner_Scanned,
        Kiosk_OutOfWorkingHours_Started,
        Kiosk_OutOfWorkingHours_Ended
    }

    export interface IJavaScriptSdkHandler {
        executeWithNumber(command: string, value: number, resolve: (response: any) => any): Promise<string>;
        executeWithString(command: string, content: string, resolve: (response: any) => any): Promise<string>;
        executeWithCommand(command: string, resolve: (response: any) => any): Promise<string>;
        executeIoCommand(command: string, parameters: string, content: any, resolve: (response: any) => any): Promise<string>;
    }
    interface ISdkResponse {
        Error: string;
        Result: any;
    }
}

interface IMyWindow extends Window {
    JavaScriptSdkHandlerFullAsync: MBirdSdk.IJavaScriptSdkHandler;
    JSSDKUrl: string;
}

window['MBirdSdk'] = window['MBirdSdk'] || MBirdSdk;
