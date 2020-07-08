import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BusyTimeComponent } from './busy-time.component';

describe('BusyTimeComponent', () => {
  let component: BusyTimeComponent;
  let fixture: ComponentFixture<BusyTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BusyTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusyTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
