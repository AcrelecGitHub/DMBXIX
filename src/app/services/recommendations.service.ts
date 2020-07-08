import { Injectable, OnInit, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppSettingsService } from './app-settings.service';
import { DotButton } from 'dotsdk';
import { ContentService } from './content.service';

/**
 * Represent the state of an order
 */
export enum OrderState {
  IN_PROGRESS = 'IN_PROGRESS', // Just after selecting the service type
  CANCELLED = 'CANCELLED', // When the customer cancel the order or when the app timeout
  PAYMENT_FAILED = 'PAYMENT_FAILED', // When the customer tried to pay but was rejected
  PAID = 'PAID', // When the payment is accepted
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationsService {

  private orderId: number = null;

  public popularsItems: DotButton[] = [];
  public popularsItemsUpdated: EventEmitter<DotButton[]> = new EventEmitter();

  public recommendations: DotButton[] = [];
  public recommendationUpdated: EventEmitter<DotButton[]> = new EventEmitter();

  constructor(
    private readonly appSettingsService: AppSettingsService,
    private readonly contentService: ContentService,
    private readonly httpClient: HttpClient
  ) {
  }

  public async updatePopulars() {
    const populars = await this.httpClient
      .get<string[]>(`${this.appSettingsService.modernConnectorPath}/recommendations/populars`).toPromise();
    this.popularsItems = populars.map(
      popular =>
        this.contentService
          .dotCatalog
          .Buttons
          .find(button => button.Link === popular)
    ).filter(Boolean);
    this.popularsItemsUpdated.emit(this.popularsItems);
    return this.popularsItems;
  }

  public async updateRecommendations(buttons: DotButton[]) {
    if (!this.orderId) {
      return;
    }
    const recommendations = await this.httpClient
      .get<string[]>(`${this.appSettingsService.modernConnectorPath}/recommendations?orderId=${this.orderId}`).toPromise();
    this.recommendations = recommendations.map(
      recommendation =>
        this.contentService
          .dotCatalog
          .Buttons
          .find(button => button.Link === recommendation)
    ).filter(Boolean);
    this.recommendationUpdated.emit(this.recommendations);
    return this.recommendations;
  }

  public async createOrder() {
    const order = await this.httpClient.post<any>(`${this.appSettingsService.modernConnectorPath}/orders`, {
      storeId: 3377,
    }).toPromise();
    this.orderId = order.id;
    return order;
  }

  public async updateItem(itemId: string, quantity: number) {
    if (!this.orderId) {
      return;
    }
    await this.httpClient.post<any>(`${this.appSettingsService.modernConnectorPath}/orders/${this.orderId}/items`, {
      itemId,
      quantity,
    }).toPromise();
  }

  public async completeOrder() {
    if (!this.orderId) {
      return;
    }
    const orderId = this.orderId;
    this.orderId = null;
    await this.httpClient.patch<any>(`${this.appSettingsService.modernConnectorPath}/orders/${orderId}`, {
      state: OrderState.PAID,
      paymentDate: new Date()
    }).toPromise();
  }

  public async cancelOrder() {
    if (!this.orderId) {
      return;
    }
    const orderId = this.orderId;
    this.orderId = null;
    await this.httpClient.patch<any>(`${this.appSettingsService.modernConnectorPath}/orders/${orderId}`, {
      state: OrderState.CANCELLED,
    }).toPromise();
  }

}
