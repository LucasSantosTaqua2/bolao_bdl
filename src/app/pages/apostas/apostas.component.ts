import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  dateTime: Date;
}

@Component({
  selector: 'app-apostas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apostas.component.html',
  styleUrl: './apostas.component.css'
})
export class ApostasComponent implements OnInit {
  games: Game[] = [];
  message: string = '';

  constructor() { }

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    // Simula o carregamento de jogos com data/hora
    this.games = [
      { id: 1, homeTeam: 'Palmeiras', awayTeam: 'Corinthians', homeScore: null, awayScore: null, dateTime: new Date('2025-05-25T16:00:00') },
      { id: 2, homeTeam: 'Flamengo', awayTeam: 'Vasco', homeScore: null, awayScore: null, dateTime: new Date('2025-05-25T18:30:00') },
      { id: 3, homeTeam: 'Grêmio', awayTeam: 'Internacional', homeScore: null, awayScore: null, dateTime: new Date('2025-05-26T14:00:00') },
      { id: 4, homeTeam: 'Atlético-MG', awayTeam: 'Cruzeiro', homeScore: null, awayScore: null, dateTime: new Date('2025-05-26T16:00:00') },
      { id: 5, homeTeam: 'Fluminense', awayTeam: 'Botafogo', homeScore: null, awayScore: null, dateTime: new Date('2025-05-26T18:30:00') },
    ];
  }

  // Método para submeter todas as apostas de uma vez
  onSubmitAllBets(form: NgForm): void {
    // Verificar se o formulário é inválido (campos 'required' não preenchidos)
    if (form.invalid) {
      console.log('Formulário inválido. Preencha todos os placares.');
      this.message = 'Por favor, preencha todos os placares para registrar suas apostas.';
      // Opcional: marcar todos os campos como 'touched' para exibir as mensagens de erro
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    // Validação adicional: Verificar se algum jogo já começou
    const futureGames = this.games.filter(game => new Date() < game.dateTime);
    const pastGames = this.games.filter(game => new Date() >= game.dateTime);

    if (pastGames.length > 0) {
        this.message = `Não é possível apostar nos jogos que já começaram ou terminaram: ${pastGames.map(g => g.homeTeam + ' x ' + g.awayTeam).join(', ')}.`;
        // Opcional: Você pode desabilitar os inputs dos jogos passados no HTML também.
        return;
    }


    // Se todas as validações passarem
    console.log('Todas as apostas a serem enviadas:', this.games);
    this.message = 'Todas as suas apostas foram registradas com sucesso (simulado)!';

    // Em uma aplicação real, você enviaria este array 'this.games' para sua API de apostas:
    // this.betService.submitAllBets(this.games).subscribe(
    //   response => {
    //     this.message = 'Apostas registradas com sucesso!';
    //     // Opcional: Limpar os campos após o sucesso ou recarregar os jogos
    //     // this.loadGames();
    //   },
    //   error => {
    //     this.message = 'Erro ao registrar apostas. Tente novamente.';
    //     console.error('Erro de API:', error);
    //   }
    // );
  }
}