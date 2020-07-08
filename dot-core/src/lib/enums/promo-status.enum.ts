export enum PromoStatus {
    noPromoPosId = '',
    noPromoRef = -1,
    promoStatusNone = 0,
    promoStatusBarcode = 1,
    promoStatusFreeItem = 2, // item offered on IF - THEN basis
    promoStatusDiscAmount = 3, // item offered based on order amount
    promoStatusDirectpage = 4, // ex oldstyle MCPaille - not used
    promoStatusOtherPromos = 5,   // 2008  - but now used !
    promoStatusTunnel = 6,
    promoStatusTunnelSplit = 7,
    promoStatusOrder = 8,
    promoStatusCustomer = 9,
    promoStatusGroup = 10, // promo group, must be first choosed, then user select promo from group
    promoStatusJumpToPage = 11,
    promoStatusStamp = 20,
    promoStatusPoint = 21,
}
