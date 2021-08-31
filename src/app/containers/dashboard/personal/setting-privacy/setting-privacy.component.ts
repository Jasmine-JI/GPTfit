import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserInfoService } from '../../services/userInfo.service';
import { SettingsService } from '../../services/settings.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { privacyObj, PrivacyCode, privacyEditObj } from '../../../../shared/models/user-privacy';
import { MatDialog } from '@angular/material/dialog';
import { ModifyBoxComponent } from '../../components/modify-box/modify-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

type PrivacyType = 'activityTracking' | 'activityTrackingReport' | 'lifeTrackingReport';

@Component({
  selector: 'app-setting-privacy',
  templateUrl: './setting-privacy.component.html',
  styleUrls: ['./setting-privacy.component.scss', '../personal-child-page.scss']
})
export class SettingPrivacyComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    editMode: 'close',
    showHrZoneDesc: null,
    showFtpZoneDesc: null,
    showTimeSelector: null
  };

  /**
   * 使用者設定
   */
  setting = {
    activityTracking: [privacyObj.self],
    activityTrackingReport: [privacyObj.self],
    lifeTrackingReport: [privacyObj.self]
  };

  userInfo: any;
  readonly privacyObj = privacyObj;
  readonly privacyEditObj = privacyEditObj;
  readonly anyOneList = [
    privacyObj.self,
    privacyObj.myGroup,
    privacyObj.onlyGroupAdmin,
    privacyObj.anyone
  ];

  constructor(
    private userInfoService: UserInfoService,
    private settingService: SettingsService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100830
   */
  getRxUserProfile() {
    const checkPrivacy = (privacy: Array<string>) => {
      const transformPrivach = privacy.map(_privacy => +_privacy);
      if (transformPrivach.includes(privacyObj.anyone)) {
        return [...this.anyOneList];
      } else {
        return transformPrivach;
      }

    };

    this.userInfoService.getRxTargetUserInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userInfo = res;
      const { privacy } = res;
      this.setting = {
        activityTracking: checkPrivacy(privacy.activityTracking),
        activityTrackingReport: checkPrivacy(privacy.activityTrackingReport),
        lifeTrackingReport: checkPrivacy(privacy.lifeTrackingReport),
      };

    });

  }

  /**
   * 變更隱私權
   * @param type {PrivacyType}-隱私權類別（檔案/運動報告/生活追蹤報告）
   * @param privacy {PrivacyCode}-隱私權設定
   * @author kidin-1100830
   */
  changePrivacy(type: PrivacyType, privacy: PrivacyCode) {
    const privacySetting = this.setting[type];
    if (privacy === privacyObj.anyone) {

      if (privacySetting.includes(privacyObj.anyone)) {
        this.setting[type] = [privacyObj.self];
      } else {
        this.setting[type] = [...this.anyOneList];
      }

    } else {
      
      if (privacySetting.includes(privacy)) {
        this.setting[type] = this.setting[type].filter(_setting => {
          return _setting !== privacy && _setting !== privacyObj.anyone
        });
      } else {
        this.setting[type].push(privacy);
        this.setting[type].sort((a, b) => a - b);
      }

    }

    this.saveSetting();
  }

  /**
   * 儲存隱私權設定
   * @author kidin-1100831
   */
  saveSetting() {
    const body = {
      token: this.utils.getToken(),
      userProfile: {
        privacy: {
          ...this.setting
        }

      }

    };

    this.settingService.updateUserProfile(body).subscribe(res => {
      const {processResult} = res as any;
      if (!processResult) {
        const { apiCode, resultMessage, resultCode } = res as any;
        this.utils.handleError(resultCode, apiCode, resultMessage);
      } else {
        const { apiCode, resultMessage, resultCode } = processResult;
        if (resultCode !== 200) {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else {
          this.translate.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const successMsg = this.translate.instant('universal_status_updateCompleted');
            this.snackBar.open(successMsg, 'OK', { duration: 2000 });
          });
          
        }

      }

    });
  }

  /**
   * 顯示批次修改框
   * @param type {number}-隱私權類別
   * @author kidin-1100830
   */
  showBatchModification(type: number) {
    this.dialog.open(ModifyBoxComponent, {
      hasBackdrop: true,
      minWidth: '330px',
      data: {
        type: type
      }

    });

  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
