import { Injectable } from '@angular/core';
import { CustomerService } from './customer.service';
import { ConfigurationService } from './configuration.service';
import { StoreConfigurationService } from './store-configuration.service';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {

  constructor(private customerService: CustomerService,
              private configurationService: ConfigurationService,
              private storeConfigurationService: StoreConfigurationService) { }

  scoreItems(objMain, scorePage) {
    let score = 0;
    const buttons = objMain.Buttons || objMain;
    // let inserted = false;
    // const items = [];
    for ( let i = 0; i < buttons.length; i++) {
      score = 0;
      if (scorePage === 1) {
        // for presentation hardcode element
        if ( buttons[i].Link === 9601 && this.configurationService.tweetPreferences === true) {
          score = score + 100;
        }
        if (this.customerService.customers.man == 1  &&
            this.configurationService.isset(buttons[i], ['Scoring', 'Customer', 'Score', 'MAN']) &&
            buttons[i].Scoring.Customer.Score.MAN != 0) {
          score = score + parseInt(buttons[i].Scoring.Customer.Score.MAN, 10);
        } else if (this.customerService.customers.woman == 1 &&
                   this.configurationService.isset(buttons[i], ['Scoring', 'Customer', 'Score', 'WOMAN']) &&
                   buttons[i].Scoring.Customer.Score.WOMAN != 0 ) {
          score = score + parseInt(buttons[i].Scoring.Customer.Score.WOMAN, 10);
        }
        if (this.customerService.customers.many == 1 &&
          this.configurationService.isset(buttons[i], ['Scoring', 'Customer', 'Score', 'MANY']) &&
          buttons[i].Scoring.Customer.Score.MANY != 0 ) {
          score = score + parseInt(buttons[i].Scoring.Customer.Score.MANY, 10);
        }
      }
      if (scorePage === 2) {
        if (this.storeConfigurationService.storeData['DriveThruBusyStatus'] === true &&
            this.configurationService.isset(buttons[i], ['Scoring', 'Store', 'Score', 'DRIVEFULL'])) {
          if ( Number(buttons[i].Scoring.Store.Score.DRIVEFULL) !== 0 )  {
            score = score + parseInt(buttons[i].Scoring.Store.Score.DRIVEFULL, 10);
          } else {
            score = score + 0.1;
          }
        }
      }
      buttons[i].score = score;

      /*
      if (score > 0) {
        if (items.length === 0) {
          items.splice(0, 0, buttons[i]);
          items[0].score = score;
        } else {
          inserted = false;
          for (let j = items.length - 1; j >= 0; j--) {
            if (score > items[j].score) {
              continue;
            } else {
              // this._items.length++;
              items.splice(j + 1, 0, buttons[i]);
              items[j + 1].score = score;
              inserted = true;
              break;
            }
          }
          if (!inserted) {
            items.splice(0, 0, buttons[i]);
            items[0].score = score;
          }
        }
      }*/
    }
    buttons.sort((a, b) => a.score - b.score);
    return buttons;
  }


}
