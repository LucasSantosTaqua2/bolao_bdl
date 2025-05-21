import { Component, OnInit, ViewChild } from '@angular/core';
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

  profileApiMessage: string = '';
  isProfileSuccess: boolean = false;

  passwordApiMessage: string = '';
  isPasswordSuccess: boolean = false;

  editMode: boolean = false;

  newUsername!: string;

  currentPassword!: string;
  newPassword!: string;
  confirmNewPassword!: string;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  currentPasswordFieldType: string = 'password';
  newPasswordFieldType: string = 'password';
  confirmNewPasswordFieldType: string = 'password';

  @ViewChild('changePasswordForm') changePasswordFormRef!: NgForm;


  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private parseDateAsUTC(dateString: string): string {
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const dateObject = new Date(utcString);
    return dateObject.toISOString();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = {
          ...profile,
          created_at: this.parseDateAsUTC(profile.created_at),
          updated_at: this.parseDateAsUTC(profile.updated_at)
        };
        console.log('Perfil do usuário carregado:', this.userProfile);
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.profileApiMessage = 'Erro ao carregar perfil. Por favor, faça login novamente.';
        this.isProfileSuccess = false;
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
    this.clearProfileMessages();
  }

  onUpdateProfile(): void {
    this.clearProfileMessages();
    if (!this.newUsername || this.newUsername.trim() === '') {
        this.profileApiMessage = 'Nome de usuário não pode ser vazio.';
        this.isProfileSuccess = false;
        return;
    }
    if (this.userProfile && this.newUsername === this.userProfile.username) {
        this.profileApiMessage = 'O novo nome de usuário é igual ao atual.';
        this.isProfileSuccess = true;
        return;
    }

    const updateData: UserUpdateData = { username: this.newUsername };
    this.authService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.userProfile = {
            ...updatedProfile,
            created_at: this.parseDateAsUTC(updatedProfile.created_at),
            updated_at: this.parseDateAsUTC(updatedProfile.updated_at)
        };
        this.profileApiMessage = 'Nome de usuário atualizado com sucesso! Use o novo nome para o próximo login.';
        this.isProfileSuccess = true;
        this.editMode = false;
        console.log('Perfil atualizado:', updatedProfile);
      },
      error: (error) => {
        console.error('Erro ao atualizar perfil:', error);
        this.isProfileSuccess = false;
        if (error.status === 400 && error.error && error.error.detail) {
          this.profileApiMessage = error.error.detail;
        } else {
          this.profileApiMessage = 'Erro ao atualizar perfil. Tente novamente.';
        }
      }
    });
  }

  onChangePassword(): void {
    this.clearPasswordMessages();

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.passwordApiMessage = 'Todos os campos de senha são obrigatórios.';
      this.isPasswordSuccess = false;
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordApiMessage = 'A nova senha e a confirmação não coincidem.';
      this.isPasswordSuccess = false;
      return;
    }

    const passwordData: UserPasswordUpdateData = {
      current_password: this.currentPassword,
      new_password: this.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        if (response.status === 204) {
          this.passwordApiMessage = 'Senha alterada com sucesso! Você precisará usar a nova senha no próximo login.';
          this.isPasswordSuccess = true;
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmNewPassword = '';
          this.changePasswordFormRef.resetForm();
          this.resetPasswordVisibility(); // <--- Chamada para o método que vamos adicionar
        } else {
          this.passwordApiMessage = 'Erro inesperado ao alterar senha.';
          this.isPasswordSuccess = false;
        }
      },
      error: (error) => {
        console.error('Erro ao alterar senha:', error);
        this.isPasswordSuccess = false;
        if (error.status === 401 && error.error && error.error.detail) {
          this.passwordApiMessage = error.error.detail;
        } else {
          this.passwordApiMessage = 'Erro ao alterar senha. Tente novamente.'; // <--- CORRIGIDO AQUI
        }
      }
    });
  }

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

  // NOVO MÉTODO: Reseta o tipo dos campos de senha para 'password' (escondido)
  private resetPasswordVisibility(): void {
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmNewPassword = false;
    this.currentPasswordFieldType = 'password';
    this.newPasswordFieldType = 'password';
    this.confirmNewPasswordFieldType = 'password';
  }

  private clearProfileMessages(): void {
    this.profileApiMessage = '';
    this.isProfileSuccess = false;
  }

  private clearPasswordMessages(): void {
    this.passwordApiMessage = '';
    this.isPasswordSuccess = false;
  }
}