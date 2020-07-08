import { BIEventTypes } from '../enums/bi-event-types';

export interface GaRules {
    GaRules: Events[];
}

interface Events {
    EventType: BIEventTypes;
    GAMapping: GAMap;
}

export interface GAMap {
    HitType: 'pageview'|'screenview'|'event'|'transaction'|'item'|'social'|'exception'|'timing';
    HitParams: string;
    EventLabel?: string;
    Button?: ButtonParam;
    AppButton?: SidesData;
    Start?: ButtonParam;
    End?: ButtonParam;
}

interface ButtonParam {
    HitParams: string;
}

interface SidesData {
    Top: ButtonParam;
    Bottom: ButtonParam;
}
