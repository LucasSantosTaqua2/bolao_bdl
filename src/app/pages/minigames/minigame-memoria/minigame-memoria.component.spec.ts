import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinigameMemoriaComponent } from './minigame-memoria.component';

describe('MinigameMemoriaComponent', () => {
  let component: MinigameMemoriaComponent;
  let fixture: ComponentFixture<MinigameMemoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinigameMemoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinigameMemoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
