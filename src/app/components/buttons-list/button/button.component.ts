import { Component, OnInit, Input, Output, EventEmitter, HostBinding, Renderer2, Inject } from '@angular/core';
import { DotButton } from 'dotsdk';
import { AppSettingsService } from '../../../services';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent implements OnInit {

  buttonCaption: string;
  public screens; 
  @Input() public button: DotButton;

  constructor(public appSettings: AppSettingsService,
    private _renderer2: Renderer2, @Inject(DOCUMENT) private _document: Document,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient) { }

  ngOnInit() {
    console.log("Buttons", this.button.Caption);
  }

  public get picture(): string {
    return `${this.appSettings.acreBridgeAssets}/Items/${this.button.Picture}`;
  }

}
