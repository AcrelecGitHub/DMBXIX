import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyViewSmallComponent } from './loyalty-view-small.component';

describe('LoyaltyViewSmallComponent', () => {
  let component: LoyaltyViewSmallComponent;
  let fixture: ComponentFixture<LoyaltyViewSmallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoyaltyViewSmallComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoyaltyViewSmallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
