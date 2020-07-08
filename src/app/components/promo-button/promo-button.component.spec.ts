import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PromoButtonComponent } from './promo-button.component';

describe('PromoButtonComponent', () => {
  let component: PromoButtonComponent;
  let fixture: ComponentFixture<PromoButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PromoButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PromoButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
