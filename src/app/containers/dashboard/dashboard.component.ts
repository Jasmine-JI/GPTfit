import { Component, OnInit } from '@angular/core';
import {
  getUrlQueryStrings,
} from '@shared/utils/';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { MatSidenav, MatDrawerToggleResult } from '@angular/material';
import { AuthService } from '@shared/services/auth.service';
import { Router } from '@angular/router';
import { UserInfoService } from './services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isPreviewMode = false;
  isLoading = false;
  isMaskShow = false;
  isCollapseOpen = false;
  target = 0;
  isSideNavOpend = false;
  mode = 'side';
  isDefaultOpend = true;
  userName: string;
  userPhoto: string;
  isUserMenuShow = false;
  constructor(
    private globalEventsManager: GlobalEventsManager,
    private authService: AuthService,
    private router: Router,
    private userInfoService: UserInfoService,
    private utilsService: UtilsService,
    public translateService: TranslateService
  ) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
  }

  ngOnInit() {
    let browserLang = this.utilsService.getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translateService.getBrowserCultureLang().toLowerCase();
      this.translateService.use(browserLang);
      this.utilsService.setLocalStorageObject('locale', browserLang);
    } else {
      this.translateService.use(browserLang);
    }
    const token = this.utilsService.getToken();
    const body = {
      token,
      iconType: 2
    };
    this.userInfoService.getLogonData(body).subscribe(res => {
      if (res.resultCode === 200) {
        const {
          info: { name, nameIcon }
        } = res;
        this.userName = name;
        this.userPhoto = this.utilsService.buildBase64ImgString(nameIcon);
      }
    });

    this.globalEventsManager.showNavBarEmitter.subscribe(mode => {
      this.isMaskShow = mode;
    });
    this.globalEventsManager.showLoadingEmitter.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
    if (window.innerWidth < 769) {
      this.mode = 'push';
      this.isDefaultOpend = false;
    }
  }
  onResize(event, sideNav) {
    if (event.target.innerWidth < 769) {
      this.toggleSideNav(sideNav);
      this.mode = 'push';
      this.isDefaultOpend = false;
    } else {
      this.mode = 'side';
      this.isDefaultOpend = true;
    }
  }
  touchMask() {
    this.isCollapseOpen = false;
    this.globalEventsManager.openCollapse(this.isCollapseOpen);
    this.isMaskShow = false;
    this.globalEventsManager.closeCollapse(false);
  }
  toggleSideNav(sideNav: MatSidenav) {
    this.isSideNavOpend = !this.isSideNavOpend;
    sideNav.toggle().then(result => {
      // console.log('result: ', result);
    });
  }
  chooseItem(_target, sidenav) {
    this.target = _target;
    if (window.innerWidth < 769 && this.target > 0) {
      this.toggleSideNav(sidenav);
    }
  }
  handleUserMenu() {
    this.isUserMenuShow = !this.isUserMenuShow;
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
