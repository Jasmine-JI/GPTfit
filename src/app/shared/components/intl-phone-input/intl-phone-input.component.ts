import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { codes } from '../../models/countryCode';
import { TranslateService } from '@ngx-translate/core';
import { getLocalStorageObject } from '../../utils/index';

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

  @Input() disabled = false;
  @Input() currentCountryCode: number;
  @Input() webUi: boolean;

  @Output() onChange = new EventEmitter();

  constructor(
    public translate: TranslateService
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
    } else if (getLocalStorageObject('countryCode')) {
      setTimeout(() => { // 處理develop mode的angular檢查機制
        this.countryCode = `+${getLocalStorageObject('countryCode')}`;
        this.onChange.emit(this.countryCode);
      });

    }

  }

  // 取得多國語系翻譯-kidin-1090629
  getTranslate () {
    this.translate.get('hollo world').subscribe(() => {
      this.phoneI18n = this.translate.instant('universal_userAccount_phone');
    });
  }

  openActive(event: any) {
    if (!this.disabled) {
      this.active = !this.active;
    }
  }

  chooseCountry(idx) {
    this.countryCode = this.countryOptions[idx].code;
    this.active = false;
    this.onChange.emit(this.countryCode);
  }

}
