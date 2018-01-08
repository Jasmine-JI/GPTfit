import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-leaderboard-settings',
  templateUrl: './leaderboard-settings.component.html',
  styleUrls: ['./leaderboard-settings.component.css']
})
export class LeaderboardSettingsComponent implements OnInit {
  timeStart = '';
  timeEnd = '';
  time_start: number;
  time_end: number;

  map_id = 1;

  constructor() {
    // this.timer = setInterval(() => {
    //   console.log('Ya!!!');
    // }, 5000);
  }

  ngOnInit() {}
  public onTimeStartChange(e: any): void {
    this.time_start = moment(e.target.value).unix();
    console.log('this.time_start: ', this.time_start);
  }
  public onTimeEndChange(e: any): void {
    this.time_end = moment(e.target.value).unix();
  }
  getTime() {


    console.log('timeStart: ', this.timeStart);
  }
}
