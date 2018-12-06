import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserProfileService } from '@shared/services/user-profile.service';
import { UtilsService } from '@shared/services/utils.service';

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
    private utils: UtilsService
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
    this.userProfileService.getUserProfile(body).subscribe(res => {
      this.isLoading = false;
      this.userData = res.info;
    });
  }
  handleTab(_idx) {
    this.chooseIdx = _idx;
    let url = '';
    switch (this.chooseIdx) {
      case 1:
        url = '/dashboard/settings/user-settings';
        break;
      case 2:
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
    if (url.indexOf('/dashboard/settings/privacy-settings') > -1) {
      this.chooseIdx = 2;
    }
    if (url.indexOf('/dashboard/settings/account-info') > -1) {
      this.chooseIdx = 3;
    }
  }
}
