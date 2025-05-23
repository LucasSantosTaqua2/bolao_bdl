import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms'; // Importe NgForm
import { Router, RouterLink } from '@angular/router'; // Importe Router
import { AuthService } from '../../services/auth.service'; // Importe o AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink // Certifique-se que RouterLink está aqui
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  username!: string;
  password!: string;

  showPassword = false;
  passwordFieldType: string = 'password';

  // Propriedades para exibir mensagens de feedback da API
  apiMessage: string = '';
  isSuccess: boolean = false; // true para sucesso (verde), false para erro (vermelho)

  constructor(
    private authService: AuthService, // Injete o AuthService
    private router: Router // Injete o Router para redirecionamento
  ) { }

  ngOnInit(): void {
  }

  // O método onSubmit agora recebe o formulário para validação
  onSubmit(loginForm: NgForm) {
    this.apiMessage = ''; // Limpa mensagens anteriores
    this.isSuccess = false; // Reseta o estado da mensagem

    if (loginForm.invalid) {
      this.apiMessage = 'Por favor, preencha o nome de usuário e a senha.';
      // Marca todos os campos como 'touched' para exibir as mensagens de erro
      Object.values(loginForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return; // Impede a submissão se o formulário for inválido
    }

    // Chama o método login do AuthService
    this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: (response) => {
          // Callback para sucesso
          this.apiMessage = 'Login realizado com sucesso! Você será redirecionado.';
          this.isSuccess = true; // Define para sucesso
          loginForm.resetForm(); // Opcional: limpa o formulário após o login

          // Redireciona para a página principal ou dashboard após um pequeno atraso
          setTimeout(() => {
            this.router.navigate(['/']); // Redireciona para a rota /home
          }, 2000); // Redireciona após 2 segundos
        },
        error: (error) => {
          // Callback para erro

          this.isSuccess = false; // Define para erro

          // Exibe uma mensagem de erro mais específica, se disponível na resposta da API
          if (error.status === 401 && error.error && error.error.detail) {
            this.apiMessage = error.error.detail; // Por exemplo: "Credenciais inválidas"
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
