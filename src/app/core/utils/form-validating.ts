import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * 用於angular reactive forms 特殊符號驗證
 * @param nameReg 正則表達示
 */
export function SymbolsValidator(nameReg: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = !nameReg.test(control.value);
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };
}
