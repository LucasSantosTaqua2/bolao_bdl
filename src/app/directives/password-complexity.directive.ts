import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { forwardRef } from '@angular/core'; // Importe forwardRef

@Directive({
  selector: '[appPasswordComplexity]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PasswordComplexityDirective), // <--- Use forwardRef aqui
      multi: true
    }
  ]
})
export class PasswordComplexityDirective implements Validator {

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['minlength'] = true;
    }

    if (!/[A-Z]/.test(value)) {
      errors['hasUppercase'] = true;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value)) {
      errors['hasSpecialCharacter'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }
}