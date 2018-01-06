import { Component, OnInit } from '@angular/core';
import {
  getUrlQueryStrings,
} from '@shared/utils/';
import { GlobalEventsManager } from '@shared/global-events-manager';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isPreviewMode = false;
  isLoading = false;
  constructor(private globalEventsManager: GlobalEventsManager) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
  }

  ngOnInit() {
    this.globalEventsManager.showLoadingEmitter.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }
}
