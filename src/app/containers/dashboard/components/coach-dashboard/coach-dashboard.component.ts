import { Component, OnInit, OnDestroy } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { HttpParams } from '@angular/common/http';
import { debounce } from '@shared/utils/';

@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.css']
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
  timer: any;
  idx: number;
  fakeDatas: any;
  totalCount: number;
  age = 30;
  rest_hr = 60;
  method = 2;
  hr: number;
  zones = [];
  colorIdx = 0;
  colorDatas = [
    '#006dff',
    '#85e1ff',
    '#76ff40',
    '#fff72a',
    '#ffb000',
    '#ff0000'
  ];
  userDatas = [
    {
      userId: 46,
      age: 25,
      rest_hr: 60,
      file_name: '20171108203559',
      code: 'a9d2ba7e46bc8ae40c3b1aa448c037b4',
      fileDatas: []
    }
  ];
  constructor(private coachService: CoachService) {
    this.handleSearchFile = debounce(this.handleSearchFile, 1000);
  }

  ngOnInit() {
    this.handleHRZone();
    const codes = this.userDatas.map(_data => _data.code);
    const ids = this.userDatas.map(_data => _data.userId);
    const idBody = { ids };
    this.coachService.fetchFileName(idBody).subscribe((res) => {
        this.userDatas[0].fileDatas = res;
    });
    const body = {
      codes
    };
    this.coachService.fetchExample(body).subscribe(res => {
      this.fakeDatas = res;
      this.totalCount = res.length;
    });
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  addUser() {
    this.userDatas.push({
      userId: 1,
      age: 25,
      rest_hr: 60,
      file_name: '20171108224223',
      code: 'cdb33bd281d9d5aa98102670062f560b',
      fileDatas: []
    });
  }
  removeUser(idx) {
    this.userDatas.splice(idx, 1);
  }
  insertFakeData(idx) {
    if (this.totalCount > idx) {
      const { distance, heart_rate, pace, utc } = this.fakeDatas[idx - 1];
      const body = {
        raceId: '5219',
        heartRate: heart_rate,
        time: utc,
        pace,
        distance
      };
      this.coachService
        .postFakeData(body)
        .subscribe(res => this.handleCard(res.heartRate));
    } else {
      clearInterval(this.timer);
    }
  }
  handleSearchFile(userId, idx) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    this.coachService.fetchFileName(params).subscribe((res) => this.userDatas[idx].fileDatas = res);
  }
  handleCard(hr) {
    this.hr = hr;
    this.colorIdx = this.zones.findIndex(_val => this.hr * 1.5 < _val);
    if (this.colorIdx === -1) {
      this.colorIdx = 5;
    }
  }
  handleMethod() {
    this.handleHRZone();
  }
  handleHRZone() {
    this.zones = [];
    // 最大心律法
    if (this.method === 1) {
      let hrValue = (220 - this.age - this.rest_hr) * 0.55 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.6 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.65 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.75 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.85 + this.rest_hr;
      this.zones.push(hrValue);
    } else {
      let hrValue = (220 - this.age - this.rest_hr) * 0.5 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.6 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.7 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.8 + this.rest_hr;
      this.zones.push(hrValue);
      hrValue = (220 - this.age - this.rest_hr) * 0.9 + this.rest_hr;
      this.zones.push(hrValue);
    }
  }
  continue() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.insertFakeData(this.idx);
      this.idx++;
    }, 2000);
  }
  stop() {
    clearInterval(this.timer);
  }
  restart() {
    clearInterval(this.timer);
    this.idx = 1;
    this.timer = setInterval(() => {
      this.insertFakeData(this.idx);
      this.idx++;
    }, 2000);
  }
}
