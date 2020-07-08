import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyViewComponent } from './loyalty-view.component';

describe('LoyaltyViewComponent', () => {
  let component: LoyaltyViewComponent;
  let fixture: ComponentFixture<LoyaltyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoyaltyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoyaltyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
