import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { UserInfoService } from '../../services/userInfo.service';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { accountTypeEnum } from '../../models/userProfileInfo';

enum thirdParty {
  strava = 1,
  runKeeper,
  line
};

@Component({
  selector: 'app-setting-account',
  templateUrl: './setting-account.component.html',
  styleUrls: ['./setting-account.component.scss', '../personal-child-page.scss']
})
export class SettingAccountComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  userInfo: any;
  clientId = 30689;
  stravaApiDomain = 'https://app.alatech.com.tw:5443';
  readonly accountType = accountTypeEnum;

  constructor(
    private userInfoService: UserInfoService,
    private settingsService: SettingsService,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.getNeedInfo();
    this.checkDomain();
    this.handleQueryStrings();
  }

  /**
   * 從rxjs取得userProfile，及api 1003取得包含第三方的帳號資訊
   * @author kidin-1100819
   */
  getNeedInfo() {
    const body = {
      signInType: 3,
      token: this.utils.getToken()
    };

    this.userInfoService.getRxTargetUserInfo().pipe(
      switchMap(res => this.auth.loginServerV2(body).pipe(
        map(resp => {
          const { thirdPartyAgency, signIn, processResult } = resp;
          if (processResult.resultCode === 200) {
            const thirdObj = {};
            thirdPartyAgency.forEach(_party => {
              const { interface: type, status } = _party;
              switch (type) {
                case thirdParty.strava:
                  Object.assign(thirdObj, { strava: status });
                  break;
                case thirdParty.runKeeper:
                  Object.assign(thirdObj, { runKeeper: status });
                  break;
                case thirdParty.line:
                  Object.assign(thirdObj, { line: status });
                  break;
              }

            });

            Object.assign(res, {
               accountStatus: signIn.accountStatus,
               thirdPartyAgency: thirdObj
            });

          }

          return res;
        })
      )),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(result => {
      this.userInfo = result;
    });

  }

  /**
   * 跳出視窗至指定頁面
   * @param url {string}-指定頁面
   * @author kidin-1100819
   */
  navigateToAssignPage(url: string) {
    window.open(url, '', 'height=700,width=375,resizable=no');
  }

  /**
   * 確認網域來變更strava client id 和 domain
   * @author kidin-1100819
   */
  checkDomain(): void {
    if (
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
   * @author kidin-1100819
   */
  handleQueryStrings(): void {
    const queryStrings = this.utils.getUrlQueryStrings(location.search),
          { code } = queryStrings;
    if (code) {
      const body = {
        token: this.utils.getToken(),
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
   * @author kidin-1100819
   */
  handleStravaAccess(body: any): void {
    this.settingsService.updateThirdParty(body).subscribe(res => {
      if (res.processResult.resultCode !== 200) {
        this.userInfo.thirdPartyAgency.strava = false;
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
          this.userInfo.thirdPartyAgency.strava = false;
        } else {
          this.userInfo.thirdPartyAgency.strava = true;
        }
      }

      this.router.navigateByUrl('/dashboard/account-info');
    });

  }

  /**
   * 使用者切換strava開關後更新同步strava狀態
   * @author kidin-1100819
   */
  handleStravaStatus(): any {
    this.userInfo.thirdPartyAgency.strava = !this.userInfo.thirdPartyAgency.strava;
    const { strava } = this.userInfo.thirdPartyAgency;
    if (strava) {
      return (location.href =
        'https://www.strava.com/oauth/authorize?' +
        `client_id=${this.clientId}&response_type=code&` +
        `redirect_uri=${this.stravaApiDomain}/api/v1/strava/redirect_uri` +
        '/1/AlaCenter&state=mystate&approval_prompt=force&scope=activity:write,read'
      );

    }

    const body = {
      token: this.utils.getToken() || '',
      switch: strava,
      thirdPartyAgency: 1,
      thirdPartyAgencyCode: '',
      clientId: this.clientId
    };

    this.handleStravaAccess(body);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
