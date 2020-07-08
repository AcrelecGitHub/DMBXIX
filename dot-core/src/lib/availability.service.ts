import { Injectable } from '@angular/core';
import { Availability } from './models/sale-cond.model';
import { AvailabilityResponse } from './models/availability.model';
import { InternationalizationService } from './internationalization.service';
import { LocalizationService } from './localization.service';
import { BasketService } from './basket.service';

@Injectable({
    providedIn: 'root'
})

export class AvailabilityService {

    constructor(private internationalizationService: InternationalizationService,
                private localizationService: LocalizationService,
                private basketService: BasketService) { }
    testAvlb(avlbObj: Availability, dateofcomparing: Date ): string {
        if (!avlbObj) {
            return '';
        }
        const avlbResponse = this.evaluateAvlb(avlbObj, dateofcomparing);
        switch (avlbResponse.AvailabilityType) {
            case 0: return '';                                                        // No error
            case 1: return this.internationalizationService.translate('631');         // Lock temporary
            case 2: return this.internationalizationService.translate('632');         // Lock permanently
            case 3: return this.internationalizationService.translate('633');         // Service available only for Eat In
            case 4: return this.internationalizationService.translate('634');         // Service available only for Take Away
            case 5: {
                const ldate = new Date(avlbResponse.StartDate);
                return this.internationalizationService.translate('635') + ' ' + this.localizationService.formatDate(ldate, 'd MM yyyy');
            }
            case 6: {
                const ldate = new Date(avlbResponse.StopDate);
                return this.internationalizationService.translate('636') + ' ' + this.localizationService.formatDate(ldate, 'd MM yyyy');
            }
            case 7: {
                const ldate = new Date(avlbResponse.StartTime);
                return this.internationalizationService.translate('637') + ' ' + this.localizationService.formatDate(ldate, 'hh:mm');
            }
            case 8: {
                const ldate = new Date(avlbResponse.StopTime);
                return this.internationalizationService.translate('638') + ' ' + this.localizationService.formatDate(ldate, 'hh:mm');
            }
            case 9: {
                let lError = '';
                for (let i = 0; i < 7 ; i++) {
                    if ((Math.pow(2, i) & avlbResponse.DOW) !== 0) {
                        if (lError = '') {
                            lError = lError + this.internationalizationService.translate((i + 640).toString());
                        } else {
                            lError = lError + ',' + this.internationalizationService.translate((i + 640).toString());
                        }
                    }
                }
                return this.internationalizationService.translate('639') + ' ' + lError;
            }
        }
    }

    evaluateAvlb(avlbObj: Availability, dateofcomparing: Date): AvailabilityResponse {
        const lResult: AvailabilityResponse = {
            AvailabilityType: 0,
            StartDate: dateofcomparing.valueOf() - 100 * 24 * 60 * 60 * 1000,
            StopDate: dateofcomparing.valueOf() + 100 * 24 * 60 * 60 * 1000,
            StartTime: dateofcomparing.setFullYear(1970, 1, 1) - 60 * 60 * 1000,
            StopTime: dateofcomparing.setFullYear(1970, 1, 1) + 60 * 60 * 1000,
            DOW: 127
        };

        // check Day Of Week availability
        const dow = avlbObj['DOW'] || 127; // ('DOW' in avlbObj) ? avlbObj['DOW'] : 127
        if (!this.isAllowedDay(dateofcomparing, dow)) {
            lResult.AvailabilityType = 9; // day not allowed
            return lResult;
        }
        // check temporary lock
        if (avlbObj['LocTemp'] === '1') {
            lResult.AvailabilityType = 1; // Temporary locked
            return lResult;
        }
        // check permanent lock
        if (avlbObj['LocPerm'] === '1') {
            lResult.AvailabilityType = 2; // permanently locked
            return lResult;
        }
        // check In service

        if (avlbObj['Service'] === '1' && this.basketService.serviceType()  === 'out') {
            lResult.AvailabilityType = 3; // available only for eat in
            return lResult;
        }
        // check Out service
        if (avlbObj['Service'] === '2'  && this.basketService.serviceType() === 'in') {
            lResult.AvailabilityType = 4; // available only for take away
            return lResult;
        }

        // check day availability
        const daysAvlb = avlbObj['Days'];
        if (avlbObj['Days']) {
            lResult.StartDate = Date.parse(avlbObj['Days']['Start']) || dateofcomparing.valueOf() - 100 * 24 * 60 * 60 * 1000;
            lResult.StopDate = Date.parse(avlbObj['Days']['Stop']) || dateofcomparing.valueOf() + 100 * 24 * 60 * 60 * 1000;
            const dateComp = dateofcomparing.setHours(0, 0, 0, 0);
            if (dateComp < lResult.StartDate) {
                lResult.AvailabilityType = 5;
                return lResult;
            }
            if (lResult.StopDate < dateComp) {
                lResult.AvailabilityType = 6;
                return lResult;
            }
        }
        // check hour periods
        const hoursAvlb = avlbObj['THS'];
        if (avlbObj['Days']) {
            lResult.StartTime = Date.parse(avlbObj['THS']['Start']) || dateofcomparing.setFullYear(1970, 1, 1) - 60 * 60 * 1000;
            lResult.StopTime = Date.parse(avlbObj['THS']['Stop']) || dateofcomparing.setFullYear(1970, 1, 1) + 60 * 60 * 1000;
            const timeComp = dateofcomparing.setFullYear(1970, 1, 1);
            if (lResult.StartTime > lResult.StopTime  || timeComp < lResult.StartTime) {
                lResult.AvailabilityType = 7;
                return lResult;
            }
            if (lResult.StopTime < timeComp) {
                lResult.AvailabilityType = 8;
                return lResult;
            }
        }
        lResult.AvailabilityType = 0;
        return lResult;
    }

    isAllowedDay(aTimestamp: Date, allowedDays: number): boolean {
        return (allowedDays & this.dateMask(aTimestamp)) !== 0;
    }

    dateMask(aTimestamp: Date): number {
        const curday = aTimestamp.getDay() !== 0  ? aTimestamp.getDay() : 7;
        return Math.pow(2, curday - 1 );
    }

}
