import { Component, OnInit } from '@angular/core';
import {
  getUrlQueryStrings,
} from '@shared/utils/';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { MatSidenav, MatDrawerToggleResult } from '@angular/material';

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
  constructor(private globalEventsManager: GlobalEventsManager) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
  }

  ngOnInit() {
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
    sideNav.toggle().then(result  => {
      // console.log('result: ', result);
    });
  }
  chooseItem(_target, sidenav) {
    this.target = _target;
    if (window.innerWidth < 769 && this.target > 0) {
      this.toggleSideNav(sidenav);
    }
  }
}
