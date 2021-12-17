import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { formTest } from '../../../../shared/models/form-test';
import { UtilsService } from '../../../../shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';

enum ContentType {
  operation = 1,
  paymentsProblem,
  suggestion,
  other
}

type AlertType = 'empty' | 'format';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject;

  /**
   * ui上用到之flag
   */
  uiFlag = {
    progress: 100
  }

  /**
   * 訊息內容
   */
  contentInfo = {
    contentType: <ContentType>null,
    name: null,
    email: null,
    phone: null,
    content: null
  }

  formAlert = {
    name: <AlertType>null,
    email: <AlertType>null,
    phone: <AlertType>null,
    content: <AlertType>null,
    contentType: <AlertType>null
  }

  readonly ContentType = ContentType;

  constructor(
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private translateService: TranslateService,
    private ngLocation: Location
  ) { }

  ngOnInit(): void {

  }

  /**
   * 輸入名稱
   * @param e {MouseEvent | Event}
   * @author kidin-1101214
   */
  handleNameInput(e: MouseEvent | Event) {
    const name = (e as any).target.value.trim();
    if (name.length === 0) {
      this.formAlert.name = 'empty';
    } else {
      this.formAlert.name = null;
      this.contentInfo.name = name;
    }

  }

  /**
   * 輸入email
   * @param e {MouseEvent | Event}
   * @author kidin-1101214
   */
  handleEmailInput(e: MouseEvent | Event) {
    const email = (e as any).target.value.trim();
    if (email.length === 0) {
      this.formAlert.email = 'empty';
    } else if (!formTest.email.test(email)) {
      this.formAlert.email = 'format';
    } else {
      this.formAlert.email = null;
      this.contentInfo.email = email;
    }
  }

  /**
   * 輸入phone
   * @param e {MouseEvent | Event}
   * @author kidin-1101214
   */
  handlePhoneInput(e: MouseEvent | Event) {
    const phone = (e as any).target.value.trim();
    const regTest = /^([+0-9\s]*)$/;  // 可能為市話或國碼+手機號碼等，故放寬限制
    if (phone.length === 0) {
      this.formAlert.phone = 'empty';
    } else if (!regTest.test(phone)) {
      this.formAlert.phone = 'format';
    } else {
      this.formAlert.phone = null;
      this.contentInfo.phone = phone;
    }

  }

  /**
   * 輸入內容
   * @param e {MouseEvent | Event}
   * @author kidin-1101214
   */
  handleContentInput(e: MouseEvent | Event) {
    const content = (e as any).target.value;
    if (content.length === 0) {
      this.formAlert.content = 'empty';
    } else {
      this.formAlert.content = null;
      this.contentInfo.content = content;
    }

  }

  /**
   * 選擇主題類型
   * @param type {ContentType}-主題類型
   * @author kidin-1101214
   */
  selectContentType(type: ContentType) {
    this.contentInfo.contentType = type;
    this.formAlert.contentType = null;
  }

  /**
   * 寄送訊息
   * @author kidin-1101213
   */
  sendContent() {
    const checkValue = this.checkForm();
    const haveAlert = document.querySelector('.form__alert');
    if (checkValue && !haveAlert) {
      const { progress } = this.uiFlag;
      if (progress === 100) {
        this.uiFlag.progress = 30;
        combineLatest([
          this.officialActivityService.fetchOfficialContactus(this.contentInfo),
          this.translateService.get('hellow world')
        ]).pipe(
          takeUntil(this.ngUnsubscribe)
        ).subscribe(res => {
          const result = res[0];
          const succeeded = this.utils.checkRes(result);
          let msg = this.translateService.instant('universal_operating_send');
          if (succeeded) {
            msg = `${msg} ${this.translateService.instant('universal_status_success')}`;
          } else {
            msg = `${msg} ${this.translateService.instant('universal_status_failure')}`;
          }

          this.utils.showSnackBar(msg);
          this.uiFlag.progress = 100;
          if (succeeded) this.back();
        });

      }

    }

  }

  /**
   * 確認是否完整填寫表格
   * @author kidin-1101214
   */
  checkForm() {
    for (let _key in this.contentInfo) {
      const value = this.contentInfo[_key];
      if (!value) {
        this.formAlert[_key] = 'empty';
        return false;
      } else {
        return true;
      }

    }

  }

  /**
   * 返回上一頁
   * @author kidin-1101213
   */
  back() {
    this.ngLocation.back();
  }

  /**
   * 解除rxjs訂閱和計時器
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
