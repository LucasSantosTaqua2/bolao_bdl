import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PasswordComplexityDirective } from '../../directives/password-complexity.directive';
import { PasswordMatchDirective } from '../../directives/password-match.directive';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule,
    PasswordComplexityDirective,
    PasswordMatchDirective,
    RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit{
  username!: string;
  password!: string;
  confirmPassword!: string;

  // Propriedades para controlar a visibilidade da senha
  showPassword = false;
  showConfirmPassword = false;
  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';

  constructor() { }

  ngOnInit(): void {
  }

  validatePassword() { }
  validatePasswordMatch() { }

  onSubmit(registerForm: NgForm) {
    if (registerForm.invalid) {
      console.log('Formulário inválido. Verifique os campos.');
      Object.values(registerForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    console.log('Dados de Registro:', {
      username: this.username,
      password: this.password
    });

    alert('Usuário registrado com sucesso (simulação)!');
  }

  // Método para alternar a visibilidade da senha
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