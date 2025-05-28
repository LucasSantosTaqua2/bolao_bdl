import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinigameMonteRankingComponent } from './minigame-monte-ranking.component';

describe('MinigameMonteRankingComponent', () => {
  let component: MinigameMonteRankingComponent;
  let fixture: ComponentFixture<MinigameMonteRankingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinigameMonteRankingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinigameMonteRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
