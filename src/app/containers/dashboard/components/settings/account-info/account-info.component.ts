import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss', '../settings.component.scss']
})
export class AccountInfoComponent implements OnInit {
  @Input() userData: any;
  stravaStatus: boolean;
  constructor() {}

  ngOnInit() {
    const { strava } = this.userData.thirdPartyAgency;
    this.stravaStatus = strava === '1';
  }
}
