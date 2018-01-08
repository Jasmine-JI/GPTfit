import { Component, OnInit } from '@angular/core';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';
import { getUrlQueryStrings } from '@shared/utils/';
import { mapImages } from '@shared/mapImages';

@Component({
  selector: 'app-real-time-leaderboard',
  templateUrl: './real-time-leaderboard.component.html',
  styleUrls: ['./real-time-leaderboard.component.css']
})
export class RealTimeLeaderboardComponent implements OnInit {
  rankDatas: any;
  showDatas: any;
  idx = 1;
  isHaveDatas = false;
  bgImageUrl: string; // 背景圖
  timer: any;
  constructor(private eventInfoService: EventInfoService) {
    this.timer = setInterval(() => {
      this.idx++;
      this.handleRank();
    }, 10000);
  }

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { time_start, time_end, map_id } = queryStrings;
    this.bgImageUrl = `url(${mapImages[map_id - 1]})`;
    let params = new HttpParams();
    if (time_start && time_end) {
      params = params.set('start_date', time_start);
      params = params.set('end_date', time_end);
      params = params.set('map_id', map_id);
    }
    this.eventInfoService.fetchTodayRank(params).subscribe(results => {
      this.rankDatas = results;
      if (this.rankDatas.length > 0) {
        this.isHaveDatas = true;
      }
      this.handleRank();
    });
  }
  handleRank() {
    const maxIdx = Math.ceil(this.rankDatas.length / 10);
    if (this.idx > maxIdx) {
      this.idx = 1;
    }
    this.showDatas = this.rankDatas.slice((this.idx - 1) * 10, 10 * this.idx);
  }
}
