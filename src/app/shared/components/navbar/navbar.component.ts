import { Component, OnInit } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { Router } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isShowMask = false;
  isCollapseShow = false;
  isCollapseSearchShow = false;
  href: string;
  isShowResetPwd = false;
  isShowDashboard = false;

  constructor(
    private globalEventsManager: GlobalEventsManager,
    private router: Router
  ) {}

  ngOnInit() {
    this.href = this.router.url;
    if (this.href.indexOf('resetpassword') > -1) {
      this.isShowResetPwd = true;
    } else {
      this.isShowResetPwd = false;
    }
    this.isShowDashboard = true;
    // if (this.href.indexOf('dashboardalaala') > -1) {
    //   const sessionValue = sessionStorage.web;
    //   if (sessionValue === '12345678') {
    //     this.isShowDashboard = true;
    //   } else {
    //     this.validate();
    //   }
    // }
  }
  validate() {
    const pwd = window.prompt('請輸入密碼: ');
    if (pwd === '12345678') {
      sessionStorage.web = pwd;
      return this.isShowDashboard = true;
    }
    return (location.href = '/');
  }
  toggleSearch() {
    if (this.isCollapseShow) {
      this.isCollapseShow = !this.isCollapseShow;
    } else {
      this.isShowMask = !this.isShowMask;
      this.globalEventsManager.showMask(this.isShowMask);
    }
    this.isCollapseSearchShow = !this.isCollapseSearchShow;
    this.globalEventsManager.openCollapse(this.isCollapseSearchShow);
  }
  toggleMask() {
    if (this.isCollapseSearchShow) {
      this.isCollapseSearchShow = !this.isCollapseSearchShow;
      this.globalEventsManager.openCollapse(this.isCollapseSearchShow);
    } else {
      this.isShowMask = !this.isShowMask;
    }
    this.isCollapseShow = !this.isCollapseShow;
    this.globalEventsManager.showMask(this.isShowMask);
  }
  reloadPage() {
    location.reload();
  }
}
