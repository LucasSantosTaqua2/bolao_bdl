import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile, UserUpdateData, UserPasswordUpdateData } from '../../services/auth.service';
import { PasswordComplexityDirective } from '../../directives/password-complexity.directive';
import { PasswordMatchDirective } from '../../directives/password-match.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    TitleCasePipe,
    PasswordComplexityDirective,
    PasswordMatchDirective
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  apiMessage: string = '';
  isSuccess: boolean = false;
  editMode: boolean = false;

  newUsername!: string;

  currentPassword!: string;
  newPassword!: string;
  confirmNewPassword!: string;

  // Propriedades para controlar a visibilidade das senhas
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  currentPasswordFieldType: string = 'password';
  newPasswordFieldType: string = 'password';
  confirmNewPasswordFieldType: string = 'password';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.newUsername = profile.username;
        console.log('Perfil do usuário carregado:', this.userProfile);
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.apiMessage = 'Erro ao carregar perfil. Por favor, faça login novamente.';
        this.isSuccess = false;
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.userProfile) {
      this.newUsername = this.userProfile.username;
    }
    this.clearMessages();
  }

  onUpdateProfile(): void {
    this.clearMessages();
    if (!this.newUsername || this.newUsername.trim() === '') {
        this.apiMessage = 'Nome de usuário não pode ser vazio.';
        this.isSuccess = false;
        return;
    }
    if (this.userProfile && this.newUsername === this.userProfile.username) {
        this.apiMessage = 'O novo nome de usuário é igual ao atual.';
        this.isSuccess = true;
        return;
    }

    const updateData: UserUpdateData = { username: this.newUsername };
    this.authService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.userProfile = updatedProfile;
        this.apiMessage = 'Nome de usuário atualizado com sucesso!';
        this.isSuccess = true;
        this.editMode = false;
        console.log('Perfil atualizado:', updatedProfile);
      },
      error: (error) => {
        console.error('Erro ao atualizar perfil:', error);
        this.isSuccess = false;
        if (error.status === 400 && error.error && error.error.detail) {
          this.apiMessage = error.error.detail;
        } else {
          this.apiMessage = 'Erro ao atualizar perfil. Tente novamente.';
        }
      }
    });
  }

  onChangePassword(): void {
    this.clearMessages();

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.apiMessage = 'Todos os campos de senha são obrigatórios.';
      this.isSuccess = false;
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.apiMessage = 'A nova senha e a confirmação não coincidem.';
      this.isSuccess = false;
      return;
    }

    const passwordData: UserPasswordUpdateData = {
      current_password: this.currentPassword,
      new_password: this.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        if (response.status === 204) {
          this.apiMessage = 'Senha alterada com sucesso! Por favor, faça login novamente com a nova senha.';
          this.isSuccess = true;
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmNewPassword = '';

          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.apiMessage = 'Erro inesperado ao alterar senha.';
          this.isSuccess = false;
        }
      },
      error: (error) => {
        console.error('Erro ao alterar senha:', error);
        this.isSuccess = false;
        if (error.status === 401 && error.error && error.error.detail) {
          this.apiMessage = error.error.detail;
        } else {
          this.apiMessage = 'Erro ao alterar senha. Tente novamente.';
        }
      }
    });
  }

  // Novo método para alternar a visibilidade das senhas
  togglePasswordVisibility(field: 'current' | 'new' | 'confirmNew'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        this.currentPasswordFieldType = this.showCurrentPassword ? 'text' : 'password';
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        this.newPasswordFieldType = this.showNewPassword ? 'text' : 'password';
        break;
      case 'confirmNew':
        this.showConfirmNewPassword = !this.showConfirmNewPassword;
        this.confirmNewPasswordFieldType = this.showConfirmNewPassword ? 'text' : 'password';
        break;
    }
  }

  private clearMessages(): void {
    this.apiMessage = '';
    this.isSuccess = false;
  }
}