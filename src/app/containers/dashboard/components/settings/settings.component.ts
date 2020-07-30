import { Component, OnInit, Injector, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserProfileService } from '@shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  chooseIdx = 1;
  userData: any;
  constructor(
    private router: Router,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    this.getUserProfile();
    this.detectUrlChange(location.pathname);
    this.router.events.subscribe((val: NavigationEnd) => {
      if (val instanceof NavigationEnd && val.url) {
        this.detectUrlChange(val.url);
      }
    });
  }

  /**
   * 從rxjs取得使用者資料
   * @author kidin-1090723
   */
  getUserProfile() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userData = res;
    });

  }

  /**
   * 根據使用者點選的項目導引至該頁面
   * @event click
   * @param _idx {number}
   * @author kidin-1090723
   */
  handleTab(_idx) {
    this.chooseIdx = _idx;
    let url = '';
    switch (this.chooseIdx) {
      case 1:
        url = '/dashboard/settings/user-settings';
        break;
      case 2:
        url = '/dashboard/settings/personal-preferences';
        break;
      case 3:
        url = '/dashboard/settings/privacy-settings';
        break;
      default:
        url = '/dashboard/settings/account-info';
    }

    this.router.navigateByUrl(url);
  }

  /**
   * 根據url判斷所在頁面，並顯示該頁面
   * @param url {string}
   * @author kidin-1090723
   */
  detectUrlChange(url) {
    if (url.indexOf('/dashboard/settings/user-settings') > -1) {
      this.chooseIdx = 1;
    }
    if (url.indexOf('/dashboard/settings/personal-preferences') > -1) {
      this.chooseIdx = 2;
    }
    if (url.indexOf('/dashboard/settings/privacy-settings') > -1) {
      this.chooseIdx = 3;
    }
    if (url.indexOf('/dashboard/settings/account-info') > -1) {
      this.chooseIdx = 4;
    }
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1090723
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
