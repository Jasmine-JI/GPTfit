import { Component, OnInit } from '@angular/core';
import {
  getUrlQueryStrings,
} from '@shared/utils/';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isPreviewMode = false;
  constructor() {
    console.log(location.search);
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
  }

  ngOnInit() {}
}
