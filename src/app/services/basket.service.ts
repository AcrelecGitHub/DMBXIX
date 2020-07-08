import { Injectable } from '@angular/core';
import { DotButton } from 'dotsdk';

@Injectable({
  providedIn: 'root'
})
export class BasketService {

  private _buttons: DotButton[] = [];

  constructor() { }



  public get buttons(): DotButton[] {
    return this._buttons;
  }

  public get totalPrice(): number {
    return this.calculateTotalPrice(this._buttons);
  }

  public addButtonToBasket(button: DotButton): void {
    this._buttons.push(button);
  }

  public resetBasket() {
    this._buttons = [];
  }



  /**
   *
   * @param buttons buttons to calculate total price
   */
  private calculateTotalPrice(buttons: DotButton[]): number {
    return buttons.reduce((subTotal: number, button: DotButton) => {
      let total = subTotal + parseInt(button.Price,10);
      if(button.ModifiersPage){
        button.ModifiersPage.Modifiers[0].Buttons.forEach((modifierBtn) => {
          total += modifierBtn.Selected ? parseInt(modifierBtn.Price,10) : 0;
        });
      }
      // TODO: this function is for DEMO PURPOSE ONLY and calculates total for simple products only,
      // In real life aplication you will need to TAKE IN CONSIDERATION MODIFIERS AND COMBO and calculate they price recursively!

      return total;
    }, 0);
  }
}
