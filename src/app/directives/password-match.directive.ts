import { Directive, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { forwardRef } from '@angular/core'; // Importe forwardRef

@Directive({
  selector: '[appPasswordMatch]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PasswordMatchDirective), // <--- Use forwardRef aqui
      multi: true
    }
  ]
})
export class PasswordMatchDirective implements Validator {
  @Input('appPasswordMatch') controlNameToCompare!: string;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const controlToCompare = control.root.get(this.controlNameToCompare);

    if (controlToCompare && controlToCompare.value !== control.value) {
      // Força a atualização da validação da senha principal para que a mensagem suma/apareça
      // É importante tocar o controle para que os erros sejam exibidos.
      if (!controlToCompare.touched) {
        controlToCompare.markAsTouched();
      }
      controlToCompare.setErrors({ 'passwordMismatch': true });
      return { 'passwordMismatch': true };
    } else {
      // Se as senhas combinam, limpa o erro 'passwordMismatch' do controle da senha principal
      // É crucial limpar o erro no controle principal também!
      if (controlToCompare && controlToCompare.hasError('passwordMismatch')) {
        // Clonamos os erros existentes para remover apenas o 'passwordMismatch'
        const currentErrors = controlToCompare.errors;
        const newErrors = { ...currentErrors };
        delete newErrors['passwordMismatch'];

        // Se não houver mais erros, defina como null; caso contrário, atualize com os erros restantes.
        if (Object.keys(newErrors).length === 0) {
            controlToCompare.setErrors(null);
        } else {
            controlToCompare.setErrors(newErrors);
        }
      }
    }

    return null; // Válido
  }
}