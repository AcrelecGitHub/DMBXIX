
export interface TestConnectionResponse {
    TerminalID: number;
    EmployeeID: number;
    JobCodeID: number;
    QueueID: number;
    VoidReasonID: number;
    GuestCount: number;
    BusinessDay: Date;
    ErrorType: number;
    ErrorCode: number;
    ExecuteStarted: boolean;
    InternalReturnCode: number;
    ReturnCode: number;
    Class: null;
    AlohaFuncErrorOccurred: null;
    ReturnMessageDetail: null;
    COMMessage: string;
    ReturnMessage: string;
    Success: boolean;
}
export interface TransactionResponse {
    SubtotalCents: number;
    TaxCents: number;
    SubTotal: number;
    Tax: number;
    OrderPOSNumber: number;
    FunctionNumber: number;
    Receipt?: any;
    NotOpen?: boolean;
    OrderGuid?: string;
    LogonInsertNumber?: string;
    Elog: any;
    IsNewOrder?: boolean;
    ErrorType?: number;
    ErrorCode?: number;
    ExecuteStarted?: boolean;
    InternalReturnCode?: number;
    ReturnCode: number;
    Class?: any;
    FuncErrorOccurred?: any;
    ReturnMessageDetail?: any;
    POSMessage?: string;
    ReturnMessage: string;
    Success?: boolean;
    StoreDetails?: [];
    ForceImport?: boolean;
    TableID?: string;
}
