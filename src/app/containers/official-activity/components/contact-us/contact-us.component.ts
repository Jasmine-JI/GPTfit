import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { formTest } from '../../../../shared/models/form-test';
import { TranslateService } from '@ngx-translate/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';
import { HintDialogService, ApiCommonService } from '../../../../core/services';

enum ContentType {
  operation = 1,
  paymentsProblem,
  suggestion,
  other,
}

type AlertType = 'empty' | 'format';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
})
export class ContactUsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * ui上用到之flag
   */
  uiFlag = {
    progress: 100,
  };

  /**
   * 訊息內容
   */
  contentInfo = {
    contentType: <ContentType>ContentType.operation,
    name: null,
    email: null,
    phone: null,
    content: null,
  };

  formAlert = {
    name: <AlertType>null,
    email: <AlertType>null,
    phone: <AlertType>null,
    content: <AlertType>null,
    contentType: <AlertType>null,
  };

  templateText = null;
  template = {
    operationalIssues: null,
    payIssues: null,
    suggestion: null,
    otherIssues: null,
  };

  readonly ContentType = ContentType;

  constructor(
    private officialActivityService: OfficialActivityService,
    private translate: TranslateService,
    private ngLocation: Location,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {
    this.getTemplateTranslate();
  }

  /**
   * 取得模板翻譯
   * @author kidin-111-126
   */
  getTemplateTranslate() {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const operationalIssues = `${this.translate.instant(
          'universal_vocabulary_hello'
        )}\n${this.translate.instant(
          'universal_vocabulary_problemDescription'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_problemTime'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_problemProcesss'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_registeredLeaveName'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_nickname'
        )}:\n\n\n${this.translate.instant('universal_vocabulary_replySoon')}`;
        const payIssues = `${this.translate.instant(
          'universal_vocabulary_hello'
        )}\n${this.translate.instant('universal_vocabulary_nickname')}:\n\n${this.translate.instant(
          'universal_vocabulary_eventNameWanted'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_signPackage'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_payMethod'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_problemTime'
        )}:\n\n${this.translate.instant(
          'universal_vocabulary_problemDescription'
        )}:\n\n\n${this.translate.instant('universal_vocabulary_replySoon')}`;
        const suggestion = `${this.translate.instant(
          'universal_vocabulary_hello'
        )}\n${this.translate.instant(
          'universal_vocabulary_opiContents'
        )}:\n\n\n${this.translate.instant('universal_vocabulary_tksReply')}`;
        const otherIssues = `${this.translate.instant(
          'universal_vocabulary_hello'
        )}\n\n${this.translate.instant('universal_vocabulary_contents')}:\n`;

        this.templateText = operationalIssues;
        this.template = {
          operationalIssues,
          payIssues,
          suggestion,
          otherIssues,
        };
      });
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
    const regTest = /^([+0-9\s]*)$/; // 可能為市話或國碼+手機號碼等，故放寬限制
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
    const { payIssues, suggestion, otherIssues, operationalIssues } = this.template;
    switch (type) {
      case ContentType.paymentsProblem:
        this.templateText = payIssues;
        break;
      case ContentType.suggestion:
        this.templateText = suggestion;
        break;
      case ContentType.other:
        this.templateText = otherIssues;
        break;
      default:
        this.templateText = operationalIssues;
        break;
    }
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
          this.translate.get('hellow world'),
        ])
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((res) => {
            const result = res[0];
            const succeeded = this.apiCommonService.checkRes(result);
            let msg = this.translate.instant('universal_operating_send');
            if (succeeded) {
              msg = `${msg} ${this.translate.instant('universal_status_success')}`;
            } else {
              msg = `${msg} ${this.translate.instant('universal_status_failure')}`;
            }

            this.hintDialogService.showSnackBar(msg);
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
    for (const _key in this.contentInfo) {
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
