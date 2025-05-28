import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinigameAcerteEscudoComponent } from './minigame-acerte-escudo.component';

describe('MinigameAcerteEscudoComponent', () => {
  let component: MinigameAcerteEscudoComponent;
  let fixture: ComponentFixture<MinigameAcerteEscudoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinigameAcerteEscudoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinigameAcerteEscudoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
