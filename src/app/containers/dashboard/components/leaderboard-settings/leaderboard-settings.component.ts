import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';

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
  updateTime: any;
  map_id = 1;
  isLoading = false;
  constructor(private eventInfoService: EventInfoService) {}

  ngOnInit() {
    this.isLoading = true;
    this.fetchUpdateTime();
  }
  fetchUpdateTime() {
    let params = new HttpParams();
    params = params.set('isGetUpdateTime', 'true');
    this.eventInfoService.getUpdateTime(params).subscribe(res => {
      this.updateTime = res;
      this.updateTime = moment
        .unix(this.updateTime)
        .format('YYYY-MM-DD H:mm:ss');
      this.isLoading = false;
    });
  }
  public onTimeStartChange(e: any): void {
    this.time_start = moment(e.target.value).unix();
  }
  public onTimeEndChange(e: any): void {
    this.time_end = moment(e.target.value).unix();
  }
  updateRankInfo() {
    this.isLoading = true;
    this.eventInfoService.updateRank().subscribe(() => this.fetchUpdateTime());
  }
}
