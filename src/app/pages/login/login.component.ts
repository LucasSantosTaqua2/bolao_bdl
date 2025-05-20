import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  username!: string;
  password!: string;

  // Propriedades para controlar a visibilidade da senha
  showPassword = false;
  passwordFieldType: string = 'password'; // Começa como 'password'

  constructor() { }

  ngOnInit(): void {
  }

  onSubmit() {
    // Lógica de submissão do login
    console.log('Tentativa de Login:', {
      username: this.username,
      password: this.password
    });
    alert('Login simulado!');
    // Aqui você faria a chamada para o seu serviço de autenticação
  }

  // Método para alternar a visibilidade da senha
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
  }
}
