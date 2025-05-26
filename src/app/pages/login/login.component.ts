// login.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service'; // Importe AuthService e UserRole
import { take } from 'rxjs/operators'; // Importe o operador take

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  username!: string;
  password!: string;

  showPassword = false;
  passwordFieldType: string = 'password';

  apiMessage: string = '';
  isSuccess: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  onSubmit(loginForm: NgForm) {
    this.apiMessage = '';
    this.isSuccess = false;

    if (loginForm.invalid) {
      this.apiMessage = 'Por favor, preencha o nome de usuário e a senha.';
      Object.values(loginForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: (response) => {
          this.apiMessage = 'Login realizado com sucesso! Redirecionando...';
          this.isSuccess = true;
          // loginForm.resetForm(); // Opcional: limpar o formulário aqui ou deixar para o onDestroy/onNavigate

          // ATUALIZAÇÃO AQUI: Redirecionamento baseado no papel do usuário
          this.authService.currentUserRole$.pipe(
            take(1) // Pega o valor atual e completa a subscrição
          ).subscribe(role => {
            // Pequeno atraso para o usuário ver a mensagem de sucesso
            setTimeout(() => {
              if (role === UserRole.ADMIN) { // Assumindo que UserRole.ADMIN está definido no seu enum
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/']); // Redireciona para a home para outros usuários
              }
              loginForm.resetForm(); // Limpa o formulário após o redirecionamento
            }, 1500); // Redireciona após 1.5 segundos (ajuste conforme necessário)
          });
        },
        error: (error) => {
          this.isSuccess = false;
          if (error.status === 401 && error.error && error.error.detail) {
            this.apiMessage = error.error.detail;
          } else {
            this.apiMessage = 'Ocorreu um erro ao tentar fazer login. Tente novamente.';
          }
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
  }
}
