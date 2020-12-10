import { Component, OnInit } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
import { SettingsService } from '../../../services/settings.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../shared/services/auth.service';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss', '../settings.component.scss']
})
export class AccountInfoComponent implements OnInit {
  stravaStatus = false;
  clientId = 30689;
  stravaApiDomain = 'https://app.alatech.com.tw:5443';
  account: string;
  accountStatus: number;
  thirdPartyAgency: Array<any>;

  constructor(
    private utils: UtilsService,
    private settingsService: SettingsService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.getThirdPartyAgency();
    this.checkDomain();
    this.handleQueryStrings();
  }

  /**
   * call api 1003取得包含第三方的帳號資訊
   * @author kidin-1090723
   */
  getThirdPartyAgency(): void {
    const body = {
      signInType: 3,
      token: this.utils.getToken() || ''
    };

    this.auth.loginServerV2(body).subscribe(res => {
      this.thirdPartyAgency = res.thirdPartyAgency;
      this.accountStatus = res.signIn.accountStatus;

      switch (res.signIn.accountType) {
        case 1:
          this.account = res.userProfile.email;
          break;
        case 2:
          this.account = `+${res.userProfile.countryCode} ${res.userProfile.mobileNumber}`;
          break;
        default:
          this.account = 'Unknow';
          break;
      }

      const status = this.thirdPartyAgency.filter(_thirdParty => _thirdParty.interface === 1).map(_strava => _strava.status);
      if (status.length === 0) {
        this.stravaStatus = false;
      } else {
        this.stravaStatus = status[0];
      }

    });

  }

  /**
   * 確認網域來變更strava client id 和 domain
   * @author kidin-1090723
   */
  checkDomain(): void {
    if (
      location.hostname === 'alatechcloud.alatech.com.tw' ||
      location.hostname === '152.101.90.130' ||
      location.hostname === 'cloud.alatech.com.tw' ||
      location.hostname === 'www.gptfit.com'
    ) {
      this.clientId = 52136;
      if (location.hostname === 'cloud.alatech.com.tw') {
        this.stravaApiDomain = 'https://cloud.alatech.com.tw:5443';
      } else if (location.hostname === 'www.gptfit.com') {
        this.stravaApiDomain = 'https://www.gptfit.com:6443';
      }

    }

  }

  /**
   * 取得url的search string，並根據內容進行下一步
   * @author kidin-1090723
   */
  handleQueryStrings(): void {
    const queryStrings = getUrlQueryStrings(location.search);
    const { code } = queryStrings;

    if (code && code.length > 0) {
      const body = {
        token: this.utils.getToken() || '',
        switch: true,
        thirdPartyAgency: 1,
        thirdPartyAgencyCode: code,
        clientId: this.clientId
      };

      this.handleStravaAccess(body);
    }

  }

  /**
   * 更新同步strava的狀態
   * @param body {object}
   * @author kidin-1090723
   */
  handleStravaAccess(body: any): void {
    this.settingsService.updateThirdParty(body).subscribe(res => {
      if (res.processResult.resultCode !== 200) {
        this.stravaStatus = false;
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.translate.instant('universal_userProfile_updateThirdPpartyFailed', {'thirdPartyUsage': 'strava'}),
            confirmText: this.translate.instant('universal_operating_confirm')
          }
        });
      } else {
        if (body.thirdPartyAgencyCode.length === 0) {
          this.stravaStatus = false;
        } else {
          this.stravaStatus = true;
        }
      }

      this.router.navigateByUrl('/dashboard/settings/account-info');
    });

  }

  /**
   * 使用者切換strava開關後更新同步strava狀態
   * @event change
   * @param value {changeEvent}
   */
  handleStravaStatus(value: Event): any {
    this.stravaStatus = (value as any).checked;
    if (this.stravaStatus) {
      return (location.href =
        'https://www.strava.com/oauth/authorize?' +
        `client_id=${this.clientId}&response_type=code&` +
        `redirect_uri=${this.stravaApiDomain}/api/v1/strava/redirect_uri` +
        '/1/AlaCenter&state=mystate&approval_prompt=force&scope=activity:write,read'
      );
    }

    const body = {
      token: this.utils.getToken() || '',
      switch: this.stravaStatus,
      thirdPartyAgency: 1,
      thirdPartyAgencyCode: '',
      clientId: this.clientId
    };

    this.handleStravaAccess(body);
  }

  /**
   * 轉導至指定頁面
   * @param url {string}
   * @author kidin-1090529
   */
  navigateToAssignPage (url: string) {
    this.router.navigateByUrl(url);
  }

}
