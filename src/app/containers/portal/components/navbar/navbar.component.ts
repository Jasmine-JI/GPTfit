import { Component, OnInit } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { Router } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'portal-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isShowMask = false;
  isCollapseShow = false;
  isCollapseSearchShow = false;
  href: string;
  isShowResetPwd = false;

  constructor(
    private globalEventsManager: GlobalEventsManager,
    private router: Router
  ) {

  }

  ngOnInit() {
    this.href = this.router.url;
    if (this.href.indexOf('resetpassword') > -1) {
      return this.isShowResetPwd = true;
    }
    this.isShowResetPwd = false;
  }
  toggleSearch() {
    if (this.isCollapseShow) {
      this.isCollapseShow = !this.isCollapseShow;
    } else {
      this.isShowMask = !(this.isShowMask);
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
      this.isShowMask = !(this.isShowMask);
    }
    this.isCollapseShow = !this.isCollapseShow;
    this.globalEventsManager.showMask(this.isShowMask);
  }
}
