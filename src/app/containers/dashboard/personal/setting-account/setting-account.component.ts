import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { AccountTypeEnum, AccountStatusEnum } from '../../../../shared/enum/account';
import { Domain, WebIp, WebPort } from '../../../../shared/enum/domain';
import { UserService, AuthService, Api10xxService } from '../../../../core/services';
import { getUrlQueryStrings, checkResponse } from '../../../../core/utils/index';
import { ThirdParty } from '../../../../shared/enum/thirdParty';

/**
 * 測試環境與正式環境 strava 的 clientId
 */
enum StravaClientId {
  uat = 30689,
  prod = 52136,
}

@Component({
  selector: 'app-setting-account',
  templateUrl: './setting-account.component.html',
  styleUrls: ['./setting-account.component.scss', '../personal-child-page.scss'],
})
export class SettingAccountComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  uiFlag = {
    expand: false,
  };

  userInfo: any;
  signInfo: any;
  clientId = StravaClientId.uat;
  stravaApiDomain = `https://${Domain.uat}:${WebPort.common}`;

  readonly AccountTypeEnum = AccountTypeEnum;
  readonly AccountStatusEnum = AccountStatusEnum;
  readonly ThirdParty = ThirdParty;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private userService: UserService,
    private api10xxService: Api10xxService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const { hostname, pathname, search } = location;
    this.getNeedInfo();
    this.checkDomain(hostname as any);
    this.checkPathname(pathname, search);
    this.handleQueryStrings();
  }

  /**
   * 從rxjs取得userProfile，及api 1003取得包含第三方的帳號資訊
   */
  getNeedInfo() {
    this.userInfo = this.userService.getUser().userProfile;
    this.signInfo = this.userService.getUser().signInfo;
  }

  /**
   * 取得第三方狀態
   * @param thirdPartyInterface {ThirdParty}-第三方代碼
   */
  getThirdPartyStatus(thirdPartyInterface: ThirdParty) {
    return this.userService.getUser().getThirdPartyStatus(thirdPartyInterface);
  }

  /**
   * 跳出視窗至指定頁面
   * @param url {string}-指定頁面
   */
  navigateToAssignPage(url: string) {
    window.open(url, '', 'height=700,width=375,resizable=no');
  }

  /**
   * 確認網域來變更strava client id 和 domain
   * @author kidin-1100819
   */
  checkDomain(hostname: Domain | WebIp): void {
    const isProdEnvironment = [WebIp.prod, Domain.oldProd, Domain.newProd].includes(hostname);
    if (isProdEnvironment) {
      this.clientId = StravaClientId.prod;
      if (hostname === Domain.oldProd) {
        this.stravaApiDomain = `https://${Domain.oldProd}:${WebPort.common}`;
      } else if (hostname === Domain.newProd) {
        this.stravaApiDomain = `https://${Domain.newProd}:${WebPort.prod}`;
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
      window.history.pushState({ path: newUrl }, '', newUrl);
      this.uiFlag.expand = true;
    }
  }

  /**
   * 取得url的search string，並根據內容進行下一步
   * @author kidin-1100819
   */
  handleQueryStrings(): void {
    const queryStrings = getUrlQueryStrings(location.search);
    const { code } = queryStrings;
    if (code) {
      const body = {
        token: this.authService.token,
        switch: true,
        thirdPartyAgency: 1,
        thirdPartyAgencyCode: code,
        clientId: this.clientId,
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
    this.api10xxService.fetchThirdPartyAccess(body).subscribe((res) => {
      if (!checkResponse(res, false)) {
        this.userService.getUser().updateThirdPartyStatus(ThirdParty.strava, false);
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.translate.instant('universal_userProfile_updateThirdPpartyFailed', {
              thirdPartyUsage: 'strava',
            }),
            confirmText: this.translate.instant('universal_operating_confirm'),
          },
        });
      } else {
        const openStrava = body.thirdPartyAgencyCode.length !== 0;
        this.userService.getUser().updateThirdPartyStatus(ThirdParty.strava, openStrava);
      }
    });
  }

  /**
   * 使用者切換strava開關後更新同步strava狀態
   */
  handleStravaStatus(): any {
    const linkStrava = this.getThirdPartyStatus(ThirdParty.strava);
    if (!linkStrava) {
      return (location.href =
        'https://www.strava.com/oauth/authorize?' +
        `client_id=${this.clientId}&response_type=code&` +
        `redirect_uri=${this.stravaApiDomain}/api/v1/strava/redirect_uri` +
        '/1/AlaCenter&state=mystate&approval_prompt=force&scope=activity:write,read');
    }

    const body = {
      token: this.authService.token,
      switch: !linkStrava,
      thirdPartyAgency: 1,
      thirdPartyAgencyCode: '',
      clientId: this.clientId,
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
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
