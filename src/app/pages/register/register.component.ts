// src/app/pages/register/register.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PasswordComplexityDirective } from '../../directives/password-complexity.directive';
import { PasswordMatchDirective } from '../../directives/password-match.directive';
import { Router, RouterLink } from '@angular/router'; // <--- Importe Router para navegação
import { AuthService } from '../../services/services/auth.service';
 // <--- Importe o AuthService

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PasswordComplexityDirective,
    PasswordMatchDirective,
    RouterLink // Certifique-se que RouterLink está aqui se for usar routerLink no HTML
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  username!: string;
  password!: string;
  confirmPassword!: string;

  showPassword = false;
  showConfirmPassword = false;
  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';

  // Adicione a propriedade para exibir mensagens da API
  apiMessage: string = '';
  isSuccess: boolean = false; // Para controlar a cor da mensagem (sucesso/erro)

  constructor(
    private authService: AuthService, // <--- Injeção do AuthService
    private router: Router // <--- Injeção do Router para navegação
  ) { }

  ngOnInit(): void { }

  validatePassword() { }
  validatePasswordMatch() { }

  onSubmit(registerForm: NgForm) {
    this.apiMessage = ''; // Limpa mensagens anteriores
    this.isSuccess = false;

    if (registerForm.invalid) {
      console.log('Formulário inválido. Verifique os campos.');
      this.apiMessage = 'Por favor, corrija os erros no formulário.';
      Object.values(registerForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    // A validação de confirmação de senha já é feita pela diretiva appPasswordMatch,
    // mas uma checagem final aqui não faz mal
    if (this.password !== this.confirmPassword) {
      this.apiMessage = 'As senhas não coincidem!';
      this.isSuccess = false;
      return;
    }

    // Chama o serviço de autenticação para registrar o usuário
    this.authService.register({ username: this.username, password: this.password })
      .subscribe({
        next: (response) => {
          console.log('Usuário registrado com sucesso!', response);
          this.apiMessage = 'Usuário registrado com sucesso! Você será redirecionado para o login.';
          this.isSuccess = true;
          registerForm.resetForm(); // Limpa o formulário

          // Redireciona para a página de login após alguns segundos
          setTimeout(() => {
            this.router.navigate(['/login']); // <--- Redireciona para a rota /login
          }, 3000); // 3 segundos
        },
        error: (error) => {
          console.error('Erro ao registrar usuário:', error);
          this.isSuccess = false;
          // Verifica o tipo de erro para dar um feedback mais específico
          if (error.status === 400 && error.error && error.error.detail) {
            this.apiMessage = error.error.detail; // Ex: "Nome de usuário já registrado."
          } else {
            this.apiMessage = 'Ocorreu um erro ao tentar registrar. Tente novamente mais tarde.';
          }
        }
      });
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
      this.passwordFieldType = this.showPassword ? 'text' : 'password';
    } else if (field === 'confirmPassword') {
      this.showConfirmPassword = !this.showConfirmPassword;
      this.confirmPasswordFieldType = this.showConfirmPassword ? 'text' : 'password';
    }
  }
}