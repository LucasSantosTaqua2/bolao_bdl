import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinigameCacaEmblemasComponent } from './minigame-caca-emblemas.component';

describe('MinigameCacaEmblemasComponent', () => {
  let component: MinigameCacaEmblemasComponent;
  let fixture: ComponentFixture<MinigameCacaEmblemasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinigameCacaEmblemasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinigameCacaEmblemasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
