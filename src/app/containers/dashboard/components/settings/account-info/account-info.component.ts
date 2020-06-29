import { Component, OnInit, Input } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
import { SettingsService } from '../../../services/settings.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss', '../settings.component.scss']
})
export class AccountInfoComponent implements OnInit {
  @Input() userData: any;
  stravaStatus: boolean;
  clientId = '30689';
  stravaApiDomain = 'https://app.alatech.com.tw:5443';
  enableAccount = false;

  constructor(
    private utils: UtilsService,
    private settingsService: SettingsService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { code } = queryStrings;

    if (
      location.hostname === 'alatechcloud.alatech.com.tw' ||
      location.hostname === '152.101.90.130' ||
      location.hostname === 'cloud.alatech.com.tw'
    ) {
      this.clientId = '30796';
      this.stravaApiDomain = 'https://cloud.alatech.com.tw:5443';
    }

    if (code && code.length > 0) {
      const body = {
        token: this.utils.getToken() || '',
        thirdPartyAgency: '0',
        switch: '1',
        code,
        clientId: this.clientId
      };
      return this.handleThirdPartyAccess(body);
    }

    const { strava, stravaValid } = this.userData.thirdPartyAgency;
    this.stravaStatus = strava === '1';
    if (stravaValid === 'false' && this.stravaStatus) {
      this.stravaStatus = false;
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: this.translate.instant('universal_popUpMessage_stravaRebinding'),
          confirmText: this.translate.instant('universal_operating_confirm'),
          cancelText: this.translate.instant('universal_operating_cancel'),
          onConfirm: () => {
            location.href =
              'https://www.strava.com/oauth/authorize?' +
              `client_id=${this.clientId}&response_type=code&` +
              `redirect_uri=${
                this.stravaApiDomain
              }/api/v1/strava/redirect_uri` +
              '/1/AlaCenter&state=mystate&approval_prompt=force&scope=activity:write,read';
          }
        }
      });
    }
  }
  handleThirdPartyAccess(body) {
    this.settingsService.updateThirdParty(body).subscribe(res => {
      if (res.resultCode !== 200) {
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
        if (body.code.length === 0) {
          this.stravaStatus = false;
        } else {
          this.stravaStatus = true;
        }
      }
      this.router.navigateByUrl('/dashboard/settings/account-info');
    });
  }
  handleStravaStatus(value) {
    this.stravaStatus = value.checked;

    if (this.stravaStatus) {
      return (location.href =
        'https://www.strava.com/oauth/authorize?' +
        `client_id=${this.clientId}&response_type=code&` +
        `redirect_uri=${this.stravaApiDomain}/api/v1/strava/redirect_uri` +
        '/1/AlaCenter&state=mystate&approval_prompt=force&scope=activity:write,read');
    }
    const body = {
      token: this.utils.getToken() || '',
      thirdPartyAgency: '0',
      switch: this.stravaStatus ? '1' : '0',
      code: '',
      clientId: this.clientId
    };
    this.handleThirdPartyAccess(body);
  }

  // 轉導至編輯密碼-kidin-1090529
  navigateToEditPwd () {
    this.router.navigateByUrl('/editPassword-web');
  }

}
