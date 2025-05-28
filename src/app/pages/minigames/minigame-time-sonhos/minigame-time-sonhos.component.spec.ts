import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinigameTimeSonhosComponent } from './minigame-time-sonhos.component';

describe('MinigameTimeSonhosComponent', () => {
  let component: MinigameTimeSonhosComponent;
  let fixture: ComponentFixture<MinigameTimeSonhosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinigameTimeSonhosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinigameTimeSonhosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
