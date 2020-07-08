export class GlobalPromotions {
    actualState: number; // taActive, taDeleted
    promoStatus: number;
    // vechiul PromoStatus, de fapt tipul de promotie, din lista din uGlobals [ALL_PROMOTIONS]
    itemID: string; // Itemul oferit
    promoPolicyID: string; // ID found in DPSPages*.Promo.ID
    // may be found in XMLrefecenceNode.ID , BUT needed when saving and reloading !
    promoPrice:  number; // pretul la care este oferit ( Beware of QTY !!)
    regularPrice: number;
    promoDiscountPOSID: string; // ID of the promotion , for POS reference - one per policy ID
    promoSrvRef: string; // refence given by a server
    DOTItemJSON: any; // nodul DOTItems care este oferit
    ReferenceJSON: any; // un alt nod /depinde de promostatus
    referenceID: string; // for ex an PageID

    promoCount: number; // default 1 - how it is promo counted in promo totals (we can have a menu
    // with 2 promos, but it must count as one, so we add first promo with PromoCount = 1 and the second promo
    // with PromoCount = 0
    points: number; // points spent if this promo is taken; it is used by McDo
    comboGroup: number; // point to combogroup of promo item
    subType: string;

  constructor() {
  }

}
