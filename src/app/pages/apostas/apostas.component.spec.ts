import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApostasComponent } from './apostas.component';

describe('ApostasComponent', () => {
  let component: ApostasComponent;
  let fixture: ComponentFixture<ApostasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApostasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApostasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
