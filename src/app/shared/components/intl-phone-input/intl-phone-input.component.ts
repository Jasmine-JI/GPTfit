import {
  Component,
  OnInit,
  OnChanges,
  HostListener,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { codes } from '@shared/components/intl-phone-input/countryCode';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-intl-phone-input',
  templateUrl: './intl-phone-input.component.html',
  styleUrls: ['./intl-phone-input.component.scss']
})
export class IntlPhoneInputComponent implements OnInit, OnChanges {
  active = false; // select options的開關
  phone = '';
  isClearIconShow = false;
  countryOptions: any;
  countryCode: any;
  phoneI18n = '';

  @Input() isPhoneInvalid: boolean;
  @Input() isCodeInvalid: boolean;
  @Input() control: FormGroup;
  @Input() isLoading: boolean;
  @Input() disabled = false;
  @Input() uiVersion: string;
  @Input() regPhone: any;
  @Input() phoneCue: string;
  @Input() currentValue: string;
  @Input() currentCountryCode: number;
  @Input() qrcodeLink: boolean;
  @Input() webUi: boolean;

  @Output() onChange = new EventEmitter();
  @Output() focusoutPhoneInt = new EventEmitter();

  constructor(
    public translate: TranslateService,
    private router: Router,
    private utils: UtilsService
  ) {
    translate.onLangChange.subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit() {
    this.getTranslate();
    this.countryOptions = codes;
  }

  ngOnChanges () {

    if (this.currentCountryCode) {
      this.countryCode = `+${this.currentCountryCode}`;
      this.onChange.emit(this.countryCode);
      this.emitPhoneNum();
    } else if (this.utils.getLocalStorageObject('countryCode')) {
      setTimeout(() => { // 處理develop mode的angular檢查機制
        this.countryCode = `+${this.utils.getLocalStorageObject('countryCode')}`;
        this.onChange.emit(this.countryCode);
        this.emitPhoneNum();
      });

    }

    if (this.currentValue) {
      this.phone = this.currentValue;
      this.emitPhoneNum();
    } else {
      this.currentValue = '';
    }

  }

  // 取得多國語系翻譯-kidin-1090629
  getTranslate () {
    this.translate.get('hollo world').subscribe(() => {
      this.phoneI18n = this.translate.instant('universal_userAccount_phone');
    });
  }

  @HostListener('document:click')

  close() {
    this.active = false;
  }

  clear() {
    if (this.control) {
      this.control.patchValue({ phone: '' });
    }

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
    if (!this.disabled) {
      this.active = !this.active;
    }
  }

  chooseCountry(idx) {
    this.countryCode = this.countryOptions[idx].code;
    this.onChange.emit(this.countryCode);

    if (this.phone.length > 0) {
      this.emitPhoneNum ();
    }

    if (this.phoneCue === 'universal_userAccount_countryRegionCode') {
      this.phoneCue = '';
    }

  }

  // 當輸入完手機號碼後傳給父組件-kidin-1090504
  emitPhoneNum () {

    if (this.phone[0] === '0') {
      this.phone = this.phone.slice(1, this.phone.length);
    }

    if (this.countryCode === undefined) {
      this.phoneCue = 'universal_userAccount_countryRegionCode';
      this.focusoutPhoneInt.emit('');
    } else if (this.phone.length > 0 && this.regPhone.test(this.phone) && this.phoneCue !== 'accountRepeat') {
      this.phoneCue = '';
      this.focusoutPhoneInt.emit(this.phone);
    } else if (this.phoneCue !== 'accountRepeat') {
      this.phoneCue = 'universal_userAccount_phoneFormat';
      this.focusoutPhoneInt.emit('');
    } else {
      this.focusoutPhoneInt.emit(this.phone);
    }

  }

  // 轉導至qrcode sign頁面-kidin-1090527
  navigateToQrcodeSign () {
    this.router.navigateByUrl('/signInQrcode');
  }

}
