import { Injectable } from '@angular/core';
import { ConfigurationService } from './configuration.service';
import { BasketService, OrderCloseCause } from './basket.service';
import { Log } from './logger/log';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private _sessionId;
    private _startSession = new Subject<void>();
    private _stopSession = new Subject<OrderCloseCause>();

    constructor(basketService: BasketService) {
        basketService.onCancelOrder.subscribe((x: OrderCloseCause) => this.stopSession(x));
        basketService.onCompleteOrder.subscribe(() => this.stopSession(OrderCloseCause.OrderSuccess));
    }

    public get onStartSession(): Observable<void> {
        return this._startSession.asObservable();
    }
    public get onStopSession(): Observable<OrderCloseCause> {
        return this._stopSession.asObservable();
    }

    public get sessionId(): string {
        return this._sessionId;
    }

    /**
     *
     */
    public startNewSession() {
        Log.debug('UserService.startNewSession');
        // Init New Session ONLY if _sessionId is falsy as this cand be called from multiple places
        if (!this._sessionId) {
            this._sessionId = ConfigurationService.generateUUID();
            this._startSession.next();
        }
    }

    private stopSession(cancelCause: OrderCloseCause = OrderCloseCause.CancelOrder): void {
        Log.debug('UserService.stopSession');
        this._stopSession.next(cancelCause);
        this._sessionId = null;
    }
}
