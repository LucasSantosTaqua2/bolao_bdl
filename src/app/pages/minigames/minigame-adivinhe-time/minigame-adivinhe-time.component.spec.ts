import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinigameAdivinheTimeComponent } from './minigame-adivinhe-time.component';

describe('MinigameAdivinheTimeComponent', () => {
  let component: MinigameAdivinheTimeComponent;
  let fixture: ComponentFixture<MinigameAdivinheTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinigameAdivinheTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinigameAdivinheTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
