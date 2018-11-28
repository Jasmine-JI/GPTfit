import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  chooseIdx = 1;
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.detectUrlChange(location.pathname);
    this.router.events.subscribe((val: NavigationEnd) => {
      if (val instanceof NavigationEnd && val.url) {
        this.detectUrlChange(val.url);
      }
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
