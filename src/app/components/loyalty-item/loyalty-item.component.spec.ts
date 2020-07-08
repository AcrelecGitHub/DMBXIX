import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyItemComponent } from './loyalty-item.component';

describe('LoyaltyItemComponent', () => {
  let component: LoyaltyItemComponent;
  let fixture: ComponentFixture<LoyaltyItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoyaltyItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoyaltyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
