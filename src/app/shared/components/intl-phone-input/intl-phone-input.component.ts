import {
  Component,
  OnInit,
  HostListener,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { codes } from '@shared/components/intl-phone-input/countryCode';
import { FormGroup, FormControl, NgForm } from '@angular/forms';

@Component({
  selector: 'app-intl-phone-input',
  templateUrl: './intl-phone-input.component.html',
  styleUrls: ['./intl-phone-input.component.css']
})
export class IntlPhoneInputComponent implements OnInit {
  active = false; // select options的開關
  phone = '';
  isClearIconShow = false;
  countryOptions: any;
  countryCode: any;
  @Input() isPhoneInvalid: boolean;
  @Input() isCodeInvalid: boolean;
  @Input() control: FormGroup;
  @Input() isLoading: boolean;
  @Input() placeholder: string;
  @Output() onChange = new EventEmitter();
  constructor() {}
  ngOnInit() {
    this.countryOptions = codes;
  }
  @HostListener('document:click')
  close() {
    this.active = false;
  }
  clear() {
    this.control.patchValue({ phone: '' });
    this.isClearIconShow = false;
  }
  handlePhoneChange(e) {
    this.phone = e.target.value.trim();
  }
  public inputEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && this.phone) {
      this.isClearIconShow = true;
    } else {
      this.isClearIconShow = false;
    }
  }
  public focusEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && this.phone) {
      this.isClearIconShow = true;
    } else {
      this.isClearIconShow = false;
    }
  }
  openActive(event: any) {
    event.stopPropagation();
    this.active = !this.active;
  }
  chooseCountry(idx) {
    this.countryCode = this.countryOptions[idx].code;
    this.onChange.emit(this.countryCode);
  }
}
