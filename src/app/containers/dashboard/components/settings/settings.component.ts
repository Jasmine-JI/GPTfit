import { Component, OnInit, Injector } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserProfileService } from '@shared/services/user-profile.service';
import { UtilsService } from '@shared/services/utils.service';
import { AuthService } from '@shared/services/auth.service';
import { UserInfoService } from '../../services/userInfo.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  chooseIdx = 1;
  userData: any;
  isLoading =  false;
  constructor(
    private router: Router,
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private userInfoService: UserInfoService,
    private authService: AuthService,
    private injector: Injector,
  ) {}

  ngOnInit() {
    this.fetchUserProfile();
    this.detectUrlChange(location.pathname);
    this.router.events.subscribe((val: NavigationEnd) => {
      if (val instanceof NavigationEnd && val.url) {
        this.detectUrlChange(val.url);
      }
    });
  }
  fetchUserProfile() {
    const body = {
      token: this.utils.getToken()
    };
    this.isLoading = true;
    const checkUserProfileService = new Promise((resolve, reject) => {
      this.userProfileService.getUserProfile(body).subscribe(
        res1 => {
          if (res1.resultCode === 400) {
            this.redirectLoginPage();
          } else if (res1.resultCode === 401) {
            this.redirectLoginPage();
          } else if (res1.resultCode === 402) {
            const token = this.utils.getToken();
            this.userInfoService.refreshToken({token}).subscribe(
              res2 => {
                if (res2.resultCode === 200) {
                  const { token, tokenTimeStamp } = res2.info;
                  this.utils.writeToken(token);
                  this.utils.setLocalStorageObject('ala_token_time', tokenTimeStamp);
                  resolve(false);
                } else if (res2.resultCode === 401) {
                  this.redirectLoginPage();
                }
              }
            );
          }
          if (res1.resultCode !== 402 && res1.resultCode !== 400 && res1.resultCode !== 401) {
            resolve(true);
          }
        }
      );
    });   
    return checkUserProfileService.then(res => {
      if (res === false) {
        const token = this.utils.getToken();
        this.getUserProfile({ token, iconType : 2 });
      } else {
        this.getUserProfile(body);
      }
      return res;
    });
  }
  redirectLoginPage() {
    this.authService.logout();
    const router = this.injector.get(Router);
    router.navigate(['/signin']);    
  }
  getUserProfile(body){
    this.userProfileService.getUserProfile(body).subscribe(
      res => {
        this.isLoading = false;
        this.userData = res.info;
      }
    );
  }
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
    this.fetchUserProfile();
  }
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
}
