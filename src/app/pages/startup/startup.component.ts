import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { StartupService } from '../../services/startup.service';

@Component({
    templateUrl: './startup.component.html',
    styleUrls: ['./startup.component.scss']
})
export class StartupComponent implements OnInit {

    private _messages: string[] = [];
    private _startupSubscription: Subscription;

    constructor(private _startupService: StartupService,
        private _router: Router) {
    }

    public get messages(): string[] {
        return this._messages;
    }

    public ngOnInit(): void {
        this._startupService.initialize();
        this._startupSubscription = this._startupService.progressStream.subscribe(
            (progress) => this._messages.push(progress),
            () => this.complete()
        );
    }

    private complete(): void {
        this._startupSubscription.unsubscribe();
        this._router.navigateByUrl('welcome');
    }

}
