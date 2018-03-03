import {
  Component,
  OnInit,
  HostListener,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { imgUrls } from '@shared/components/intl-phone-input/img.ts';
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
  selectedOption: any;
  @Input() isInvalid: boolean;
  @Input() control: FormGroup;
  @Input() isLoading: boolean;
  @Output() onChange = new EventEmitter();
  constructor() {}
  ngOnInit() {
    this.countryOptions = imgUrls;
    this.selectedOption = this.countryOptions[0];
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
    this.onChange.emit(this.selectedOption.code);
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
    this.selectedOption = this.countryOptions[idx];
    this.onChange.emit(this.selectedOption.code);
  }
}
