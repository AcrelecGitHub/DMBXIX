import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AbBannerComponent } from './ab-banner.component';

describe('AbBannerComponent', () => {
  let component: AbBannerComponent;
  let fixture: ComponentFixture<AbBannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AbBannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AbBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
