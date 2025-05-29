import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { TeamNameToFileNamePipe } from '../../../utils/team-name-to-file-name.pipe'; // Ajuste o caminho
import html2canvas from 'html2canvas';
import { RouterLink } from '@angular/router';

interface TeamForSelection {
  id: string;
  name: string;
  emblemUrl: string;
}

interface FieldPosition {
  id: string; 
  name: string;
  placeholderText: string;
  items: TeamForSelection[]; 
}

@Component({
  selector: 'app-minigame-time-sonhos',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TeamNameToFileNamePipe,
    RouterLink
  ],
  templateUrl: './minigame-time-sonhos.component.html',
  styleUrls: ['./minigame-time-sonhos.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class MinigameTimeSonhosComponent implements OnInit {
  allTeamNames: string[] = [
    'Palmeiras', 'Flamengo', 'Cruzeiro', 'Bragantino', 'Ceará', 'Bahia',
    'Fluminense', 'Corinthians', 'Atlético-MG', 'Botafogo', 'São Paulo',
    'Mirassol', 'Vasco', 'Fortaleza', 'Internacional', 'EC Vitória',
    'Grêmio', 'Juventude', 'Santos', 'Sport'
  ];

  availableTeams: TeamForSelection[] = [];
  playerPositions: FieldPosition[] = []; 
  coachPosition!: FieldPosition; 

  allDropListIds: string[] = [];

  gameMessage: string = 'Arraste os emblemas para montar seu time dos sonhos!';
  showSaveConfirmation: boolean = false;

  @ViewChild('dreamTeamFieldToCapture') dreamTeamFieldElement!: ElementRef;

  readonly availableTeamsListId = 'availableTeamsList';

  constructor(
    private teamNamePipe: TeamNameToFileNamePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeGameStructure(); // Configura a estrutura inicial e os IDs das listas
    this.loadDreamTeam();         // Carrega o time salvo ou inicia um novo
  }

  initializeGameStructure(clearAll: boolean = true): void {
    if (clearAll) {
      this._resetAndPopulateAvailableTeams(); // Usa o novo método privado
    }

    const currentFieldTeams: { [key: string]: TeamForSelection | undefined } = {};
    if(!clearAll) {
        this.playerPositions.forEach(p => {
            if (p.items.length > 0) currentFieldTeams[p.id] = p.items[0];
        });
        if(this.coachPosition && this.coachPosition.items.length > 0) {
            currentFieldTeams[this.coachPosition.id] = this.coachPosition.items[0];
        }
    }

    this.playerPositions = [
      { id: 'GK', name: 'Goleiro', items: [], placeholderText: 'GOLEIRO' },
      { id: 'LD', name: 'Lateral Dir.', items: [], placeholderText: 'LAT. DIR.' },
      { id: 'ZD1', name: 'Zagueiro 1', items: [], placeholderText: 'ZAGUEIRO' },
      { id: 'ZE1', name: 'Zagueiro 2', items: [], placeholderText: 'ZAGUEIRO' },
      { id: 'LE', name: 'Lateral Esq.', items: [], placeholderText: 'LAT. ESQ.' },
      { id: 'VOL1', name: 'Volante', items: [], placeholderText: 'VOLANTE' },
      { id: 'MC1', name: 'Meia 1', items: [], placeholderText: 'MEIA' },
      { id: 'MC2', name: 'Meia 2', items: [], placeholderText: 'MEIA' },
      { id: 'ATA1', name: 'Atacante 1', items: [], placeholderText: 'ATACANTE' },
      { id: 'ATA2', name: 'Atacante 2', items: [], placeholderText: 'ATACANTE' },
      { id: 'ATA3', name: 'Atacante 3', items: [], placeholderText: 'ATACANTE' },
    ];
    this.coachPosition = { id: 'TEC', name: 'Técnico', items: [], placeholderText: 'TÉCNICO' };

     if (!clearAll) {
        this.playerPositions.forEach(pos => {
            if (currentFieldTeams[pos.id]) {
                pos.items = [currentFieldTeams[pos.id]!];
            } else {
                pos.items = [];
            }
        });
        if (this.coachPosition && currentFieldTeams[this.coachPosition.id]) {
            this.coachPosition.items = [currentFieldTeams[this.coachPosition.id]!];
        } else if (this.coachPosition) {
            this.coachPosition.items = [];
        }
    }
    
    this.updateConnectedDropListIds();

    if (clearAll) {
      this.gameMessage = 'Arraste os emblemas para montar seu time dos sonhos (4-3-3)!';
    }
    this.showSaveConfirmation = false;
    this.cdr.detectChanges();
  }
  
  // Novo método privado para encapsular o reset da lista de disponíveis
  private _resetAndPopulateAvailableTeams(): void {
    this.availableTeams = this.allTeamNames.map((name, index) => ({
      name,
      emblemUrl: `assets/emblemas/${this.teamNamePipe.transform(name)}`,
      id: `avail-${index}-${name.replace(/\s+/g, '-').toLowerCase()}`
    }));
    this.availableTeams.sort((a, b) => a.name.localeCompare(b.name));
  }

  private updateConnectedDropListIds(): void {
    const playerPosIds = this.playerPositions.map(p => p.id);
    this.allDropListIds = [this.availableTeamsListId, ...playerPosIds, this.coachPosition.id];
  }

  onDrop(event: CdkDragDrop<TeamForSelection[]>) {
    if (event.previousContainer === event.container) {
      if (event.container.id === this.availableTeamsListId) {
         moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      }
    } else {
      const itemToMove = event.previousContainer.data[event.previousIndex];
      const targetList = event.container.data; 
      const sourceList = event.previousContainer.data;

      if (event.container.id !== this.availableTeamsListId && targetList.length > 0) {
        const existingItemInTarget = targetList[0];
        if (existingItemInTarget.id !== itemToMove.id) { 
             this.addTeamToAvailableListIfNotPresent(existingItemInTarget);
        }
        targetList.length = 0; 
      }
      
      transferArrayItem(
        sourceList,
        targetList,
        event.previousIndex,
        event.currentIndex 
      );

      if (event.container.id !== this.availableTeamsListId && targetList.length > 1) {
          const itemJustDropped = targetList.find(i => i.id === itemToMove.id);
          targetList.length = 0;
          if(itemJustDropped) targetList.push(itemJustDropped);
      }
    }
    this.availableTeams.sort((a, b) => a.name.localeCompare(b.name));
    this.gameMessage = 'Time dos Sonhos atualizado!';
    this.showSaveConfirmation = false;
    this.cdr.detectChanges();
  }

  private addTeamToAvailableListIfNotPresent(team: TeamForSelection): void {
    if (!this.availableTeams.find(t => t.id === team.id)) {
      this.availableTeams.push(team);
      this.availableTeams.sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  
  public canDropIntoSlot(item: CdkDrag<TeamForSelection>, dropList: CdkDropList<TeamForSelection[]>): boolean {
    return dropList.data.length === 0 || (dropList.data.length === 1 && dropList.data[0].id === item.data.id);
  }

  clearPosition(position: FieldPosition): void {
    if (position.items.length > 0) {
      const teamToReturn = position.items[0];
      this.addTeamToAvailableListIfNotPresent(teamToReturn);
      position.items = [];
      this.gameMessage = `Posição ${position.name} limpa.`;
      this.showSaveConfirmation = false;
      this.cdr.detectChanges();
    }
  }

  clearAllField(): void {
    this.initializeGameStructure(true); 
    this.gameMessage = 'Time e lista resetados! Comece a montar sua equipe.';
  }

  saveDreamTeam(): void {
    if (typeof localStorage !== 'undefined') {
      const playerPositionsToSave = this.playerPositions.map(p => ({
        positionId: p.id,
        teamName: p.items.length > 0 ? p.items[0].name : null
      }));
      const coachToSave = this.coachPosition && this.coachPosition.items.length > 0 ? 
                          { positionId: this.coachPosition.id, teamName: this.coachPosition.items[0].name } :
                          { positionId: this.coachPosition.id, teamName: null };
      
      const teamToSave = [...playerPositionsToSave, coachToSave];

      localStorage.setItem('userDreamTeamTactical_433', JSON.stringify(teamToSave));
      this.gameMessage = 'Seu Time dos Sonhos (4-3-3) foi salvo!';
      this.showSaveConfirmation = true;
      setTimeout(() => this.showSaveConfirmation = false, 3000);
    } else {
      this.gameMessage = 'Não foi possível salvar (localStorage não disponível).';
      this.showSaveConfirmation = true;
      setTimeout(() => this.showSaveConfirmation = false, 3000);
    }
    this.cdr.detectChanges();
  }

  loadDreamTeam(): void {
    this._resetAndPopulateAvailableTeams(); // CORREÇÃO AQUI

    if (typeof localStorage !== 'undefined') {
      const savedTeamJson = localStorage.getItem('userDreamTeamTactical_433');
      if (savedTeamJson) {
        try {
          const savedTeamData: { positionId: string, teamName: string | null }[] = JSON.parse(savedTeamJson);
          const loadedTeamNamesOnField = new Set<string>();

          this.playerPositions.forEach(fp => fp.items = []); 
          if(this.coachPosition) this.coachPosition.items = [];


          savedTeamData.forEach(savedPos => {
            let fieldPos: FieldPosition | undefined | null = this.playerPositions.find(fp => fp.id === savedPos.positionId);
            if (!fieldPos && this.coachPosition && this.coachPosition.id === savedPos.positionId) {
                fieldPos = this.coachPosition;
            }

            if (fieldPos && savedPos.teamName) {
              const teamIndexInAvailable = this.availableTeams.findIndex(t => t.name === savedPos.teamName);
              if (teamIndexInAvailable > -1) {
                const teamToPlace = this.availableTeams.splice(teamIndexInAvailable, 1)[0];
                fieldPos.items = [teamToPlace];
                loadedTeamNamesOnField.add(savedPos.teamName);
              }
            }
          });
          this.availableTeams.sort((a,b) => a.name.localeCompare(b.name));

          if (loadedTeamNamesOnField.size > 0) {
            this.gameMessage = 'Time dos Sonhos (4-3-3) carregado!';
          } else {
             this.gameMessage = 'Nenhum time salvo encontrado. Monte sua equipe 4-3-3!';
          }

        } catch (e) {
          console.error("Erro ao carregar Time dos Sonhos:", e);
          localStorage.removeItem('userDreamTeamTactical_433');
          this.initializeGameStructure(true);
        }
      } else {
         this.gameMessage = 'Monte seu Time dos Sonhos (4-3-3) pela primeira vez!';
      }
    }
    this.cdr.detectChanges();
  }

  async downloadDreamTeamAsImage(): Promise<void> {
    if (!this.dreamTeamFieldElement || !this.dreamTeamFieldElement.nativeElement) {
      this.gameMessage = "Erro: área do time não encontrada para captura.";
      this.showSaveConfirmation = true; this.cdr.detectChanges();
      setTimeout(() => this.showSaveConfirmation = false, 3000);
      return;
    }
    const originalMessage = this.gameMessage;
    this.gameMessage = "Gerando imagem...";
    this.showSaveConfirmation = true; this.cdr.detectChanges();
    try {
      this.dreamTeamFieldElement.nativeElement.classList.add('capturing-dream-team');
      const canvas = await html2canvas(this.dreamTeamFieldElement.nativeElement, {
        logging: false, useCORS: true, scale: 1.5, backgroundColor: '#d4edda',
         onclone: (documentClone) => {
            const clonedElement = documentClone.querySelector('.dream-team-field-wrapper');
            if (clonedElement) {
              clonedElement.querySelectorAll('.position-placeholder-text').forEach(el => {
                const parentPosWrapper = el.closest('.field-position-wrapper');
                if(!(parentPosWrapper?.querySelector('.team-on-field img'))){
                    (el as HTMLElement).style.display = 'none';
                }
              });
              clonedElement.querySelectorAll('.clear-pos-btn').forEach(el => (el as HTMLElement).style.display = 'none');
              clonedElement.querySelectorAll('.field-drag-handle').forEach(el => (el as HTMLElement).style.display = 'none');
            }
        }
      });
      this.dreamTeamFieldElement.nativeElement.classList.remove('capturing-dream-team');
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'meu_time_dos_sonhos_433.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.gameMessage = 'Imagem gerada!';
      setTimeout(() => { this.showSaveConfirmation = false; this.gameMessage = originalMessage; this.cdr.detectChanges(); }, 3000);
    } catch (error) {
      this.dreamTeamFieldElement.nativeElement.classList.remove('capturing-dream-team');
      console.error("Erro ao gerar imagem:", error);
      this.gameMessage = "Erro ao gerar a imagem.";
      setTimeout(() => { this.showSaveConfirmation = false; this.gameMessage = originalMessage; this.cdr.detectChanges(); }, 3000);
    }
  }

  trackByFn(index: number, item: {id: string}): string {
    return item.id;
  }
}