import { Injectable } from '@angular/core';
import { ReplaySubject, Observable, Subject, BehaviorSubject } from 'rxjs';
import { ToastMessage } from './models';
import { Log } from './logger/log';

type Status = 'idle' | 'suspended' | 'running';

@Injectable({
  providedIn: 'root'
})
export class CODUpdateService {

    private _status = new BehaviorSubject<Status>('idle');

    private _updaters: (() => Promise<void>)[] = [];

    private _message = new ReplaySubject<ToastMessage>(null, 500);

    public get updateRequired(): boolean {
        return this._updaters.length > 0;
    }

    public get message(): Observable<ToastMessage> {
        return this._message.asObservable();
    }

    public async suspend(): Promise<void> {
        if (this._status.value === 'running') {
            let resolve: () => void;
            const subscription = this._status.subscribe(_ => {
                if (resolve && _ === 'idle' ) {
                    resolve();
                }
            });
            await new Promise(_ => resolve = _);
            subscription.unsubscribe();
        }

        this._status.next('suspended');
    }

    public async resume(): Promise<void> {
        if (this._status.value === 'suspended') {
            this._status.next('idle');
        }

        if (this._status.value === 'idle') {
            await this.update();
        }
    }

    public async require(updater: () => Promise<void>): Promise<void> {
        this._updaters.push(updater);
        if (this._status.value === 'idle') {
            await this.update();
        }
    }

    private async update(): Promise<void> {
        if (this._status.value === 'suspended') {
            Log.warn('Update service is suspended. No update will be performed. Please, resume it before requesting to update');
            return;
        }

        if (this._status.value === 'running') {
            Log.warn('Update service is already running. Please, wait if to complete before making a new request');
            return;
        }

        if (!this._updaters.length) {
            return;
        }

        Log.info('Starting update process...');

        this._status.next('running');

        this._message.next({
            type: 'info', timeout: 0, value: '2019092601'
        });

        try {
            while (this._updaters.length > 0) {
                const updater = this._updaters.first();
                await updater();
                this._updaters.remove(updater);
            }

            this._message.next({
                type: 'info', timeout: 3000, value: '2019092602'
            });
            Log.info('Update completed!');
        } catch (ex) {
            this._message.next({
                type: 'info', timeout: 3000, value: '2019092603'
            });
            Log.warn('Could not complete the update process due to: {0}', ex);
            Log.info('New update request will be schedule to be execute in 5 seconds...');
            setTimeout(async () => {
                if (this._status.value === 'idle') {
                    await this.update();
                }
            }, 5 * 1000);
        }

        this._status.next('idle');
    }
}
