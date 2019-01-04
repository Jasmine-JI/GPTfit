import { Component, OnInit, Input } from '@angular/core';
import {  getUrlQueryStrings } from '@shared/utils/';
import { SettingsService } from '../../../services/settings.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

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
  constructor(
    private utils: UtilsService,
    private settingsService: SettingsService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { code } = queryStrings;

    if (code && code.length > 0) {
      const body = {
        token: this.utils.getToken(),
        thirdPartyAgency: '0',
        switch: '1',
        code,
        clientId: this.clientId
      };
      return this.handleThirdPartyAccess(body);
    }
    if (
      location.hostname === 'alatechcloud.alatech.com.tw' ||
      location.hostname === '152.101.90.130' ||
      location.hostname === 'cloud.alatech.com.tw'
    ) {
      this.clientId = '30796';
      this.stravaApiDomain = 'https://cloud.alatech.com.tw:5443';
    }
    const { strava, stravaValid } = this.userData.thirdPartyAgency;
    if (stravaValid === 'false') {
      this.stravaStatus = false;
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `您的綁定strava已失效，是否重新綁定您的strava?`,
          confirmText: '確定',
          cancelText: '取消',
          onConfirm: () => {
            location.href =
              ('https://www.strava.com/oauth/authorize?' +
              `client_id=${this.clientId}&response_type=code&` +
              `redirect_uri=${this.stravaApiDomain}/api/v1/strava/redirect_uri` +
              '/1/AlaCenter&scope=write&state=mystate&approval_prompt=force');
          }
        }
      });
    }
    this.stravaStatus = strava === '1';
  }
  handleThirdPartyAccess(body) {
    this.settingsService.updateThirdParty(body).subscribe(res => {
      if (res.resultCode !== 200) {
        this.stravaStatus = false;
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: `更新strava狀態失敗`,
            confirmText: '確定'
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
        '/1/AlaCenter&scope=write&state=mystate&approval_prompt=force');
    }
    const body = {
      token: this.utils.getToken(),
      thirdPartyAgency: '0',
      switch: this.stravaStatus ? '1' : '0',
      code: '',
      clientId: this.clientId
    };
    this.handleThirdPartyAccess(body);
  }
}
