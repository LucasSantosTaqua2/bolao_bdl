import { Component, OnInit, OnDestroy } from '@angular/core'; // Importe OnInit e OnDestroy
import { CommonModule } from '@angular/common'; // Para *ngIf
import { AuthService } from '../../services/auth.service'; // <--- Importe o AuthService
import { Subscription } from 'rxjs'; // Para gerenciar a inscrição e evitar vazamentos de memória

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], // Adicione CommonModule para *ngIf
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy { // Implemente OnInit e OnDestroy
  username: string | null = null; // Propriedade para armazenar o nome de usuário
  private userSubscription: Subscription | undefined; // Para gerenciar a inscrição

  constructor(private authService: AuthService) { } // Injete o AuthService

  ngOnInit(): void {
    // Inscreve-se nas mudanças do nome de usuário
    this.userSubscription = this.authService.currentUserUsername$.subscribe(
      (username) => {
        this.username = username; // Atualiza a propriedade local com o nome de usuário
      }
    );
  }

  ngOnDestroy(): void {
    // É crucial desinscrever-se para evitar vazamentos de memória
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}