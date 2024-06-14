import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NDBMoreMenuComponent} from './ndb-more-menu.component';

describe('NDBMoreMenuComponent', () => {
  let component: NDBMoreMenuComponent;
  let fixture: ComponentFixture<NDBMoreMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NDBMoreMenuComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NDBMoreMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
