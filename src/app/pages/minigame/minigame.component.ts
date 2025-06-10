import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Importe o RouterLink

interface MinigameMenuItem {
  name: string;
  route: string;
  iconClass: string; // Classe do ícone Bootstrap (ex: 'bi-controller')
  description: string;
}

@Component({
  selector: 'app-minigame',
  standalone: true,
  imports: [CommonModule, RouterLink], // Adicione RouterLink aqui
  templateUrl: './minigame.component.html',
  styleUrls: ['./minigame.component.css']
})
export class MinigameComponent implements OnInit {

  minigameList: MinigameMenuItem[] = [];

  constructor() { }

  ngOnInit(): void {
    this.minigameList = [
     /* {
        name: 'Acerte o Escudo',
        route: '/minigames/acerte-o-escudo',
        iconClass: 'bi-shield-check', // Ícone de escudo com check
        description: 'Teste seus conhecimentos sobre os emblemas dos times!'
      },*/
      {
        name: 'Jogo da Memória',
        route: '/minigames/memoria',
        iconClass: 'bi-grid-3x3-gap-fill', // Ícone de grade
        description: 'Encontre os pares de escudos e treine sua memória.'
      },
      {
        name: 'Quem é este Time?',
        route: '/minigames/adivinhe-time',
        iconClass: 'bi-question-circle-fill', // Ícone de interrogação
        description: 'Adivinhe o time pelo escudo distorcido.'
      },
      {
        name: 'Monte seu Ranking',
        route: '/minigames/monte-ranking',
        iconClass: 'bi-list-ol', // Ícone de lista ordenada
        description: 'Ordene os times e crie seu ranking ideal.'
      },
      {
        name: 'Caça-Emblemas',
        route: '/minigames/caca-emblemas',
        iconClass: 'bi-bullseye', // Ícone de alvo
        description: 'Clique no escudo certo antes que ele suma!'
      },
      {
        name: 'Time dos Sonhos',
        route: '/minigames/time-sonhos',
        iconClass: 'bi-people-fill', // Ícone de pessoas/time
        description: 'Monte sua escalação ideal arrastando os emblemas.'
      }
      // Adicione mais minigames aqui no futuro
    ];
  }
}
