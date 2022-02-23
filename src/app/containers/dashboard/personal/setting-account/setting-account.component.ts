import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { AccountTypeEnum } from '../../../../shared/models/user-profile-info';
import { SignTypeEnum } from '../../../../shared/models/utils-type';

enum ThirdParty {
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

  uiFlag = {
    expand: false
  }

  userInfo: any;
  clientId = 30689;
  stravaApiDomain = 'https://app.alatech.com.tw:5443';
  readonly accountType = AccountTypeEnum;

  constructor(
    private utils: UtilsService,
    private auth: AuthService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    const { hostname, pathname, search } = location;
    this.getNeedInfo();
    this.checkDomain(hostname);
    this.checkPathname(pathname, search);
    this.handleQueryStrings();
  }

  /**
   * 從rxjs取得userProfile，及api 1003取得包含第三方的帳號資訊
   * @author kidin-1100819
   */
  getNeedInfo() {
    const body = {
      signInType: SignTypeEnum.token,
      token: this.utils.getToken()
    };

    this.userProfileService.getRxTargetUserInfo().pipe(
      switchMap(res => this.auth.loginServerV2(body).pipe(
        map(resp => {
          const { thirdPartyAgency, signIn, processResult } = resp;
          if (processResult.resultCode === 200) {
            const thirdObj = {};
            thirdPartyAgency.forEach(_party => {
              const { interface: type, status } = _party;
              switch (type) {
                case ThirdParty.strava:
                  Object.assign(thirdObj, { strava: status });
                  break;
                case ThirdParty.runKeeper:
                  Object.assign(thirdObj, { runKeeper: status });
                  break;
                case ThirdParty.line:
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
  checkDomain(hostname: string): void {
    if (
      hostname === '152.101.90.130' ||
      hostname === 'cloud.alatech.com.tw' ||
      hostname === 'www.gptfit.com'
    ) {
      this.clientId = 52136;
      if (hostname === 'cloud.alatech.com.tw') {
        this.stravaApiDomain = 'https://cloud.alatech.com.tw:5443';
      } else if (hostname === 'www.gptfit.com') {
        this.stravaApiDomain = 'https://www.gptfit.com:6443';
      }

    }

  }

  /**
   * 確認url路徑是否由strava轉導回GPTfit
   * @author kidin-1100819
   */
  checkPathname(pathname: string, search: string): void {
    if (pathname.includes('settings/account-info')) {
      const newUrl = `/dashboard/user-settings${search}`;
      window.history.pushState({path: newUrl}, '', newUrl);
      this.uiFlag.expand = true;
    };

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
    this.userProfileService.updateThirdParty(body).subscribe(res => {
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
   * 展開或收合整個帳號資訊內容
   * @author kidin-1100922
   */
  handleFolder() {
    this.uiFlag.expand = !this.uiFlag.expand;
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
