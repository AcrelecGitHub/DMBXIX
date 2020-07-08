export const enum BIEventTypes {
    OrderChoiceSelection = 'OrderChoiceSelection',
    PageViewTracking = 'PageViewTracking',
    ProductImpressionView = 'ProductImpressionView',
    ProductImpressionClick = 'ProductImpressionClick',
    ProductDetailView = 'ProductDetailView',
    AddToCart = 'AddToCart',
    RemoveFromCart = 'RemoveFromCart',
    CheckoutProcess1 = 'CheckoutProcess1',
    CheckoutProcess2 = 'CheckoutProcess2',
    PurchaseTracking = 'PurchaseTracking',
    FailedPaymentEvent = 'FailedPaymentEvent',
    MenuClick = 'MenuClick',
    BackClick = 'BackClick',
    CancelOrder = 'CancelOrder',
    ViewOrder = 'ViewOrder',
    LanguageSelection = 'LanguageSelection',
    DisplayModeSelection = 'DisplayModeSelection',
    AppButtonClick = 'AppButtonClick',
    PaymentSucceed = 'PaymentSucceed',
    PrintingStarted = 'PrintingStarted',
    PrintingEnded = 'PrintingEnded',
    SessionTracking = 'SessionTracking',
    PromotionImpressionView = 'PromotionImpressionView',
    PromotionImpressionClick = 'PromotionImpressionClick',
}

export const enum BIGoogleAnalyticsTypes {
    Disabled = 'disabled',
    SendAtRunTime = 'sendAtRunTime',
    DumpToFile = 'dumpToFile'
}
export const enum BIMarketTypes {
    Disabled = 'disabled',
    Enabled = 'enabled',
}
