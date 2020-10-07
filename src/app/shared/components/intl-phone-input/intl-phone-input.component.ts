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
import { TranslateService } from '@ngx-translate/core';
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

  @Input() disabled = false;
  @Input() currentCountryCode: number;
  @Input() webUi: boolean;

  @Output() onChange = new EventEmitter();

  constructor(
    public translate: TranslateService,
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
    } else if (this.utils.getLocalStorageObject('countryCode')) {
      setTimeout(() => { // 處理develop mode的angular檢查機制
        this.countryCode = `+${this.utils.getLocalStorageObject('countryCode')}`;
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
