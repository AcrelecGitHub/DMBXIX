import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { StartupService } from './services/startup.service';

@Injectable()
export class StartupGuard implements CanActivate {

    constructor(private _router: Router, private _startupService: StartupService) {
    }

    public canActivate(): boolean {
        if (this._startupService.initialized) {
            return true;
        }

        this._router.navigate(['/startup']);
        return false;
    }
}
