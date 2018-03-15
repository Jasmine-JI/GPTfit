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
  method = 2;
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
      userId: null,
      age: 30,
      rest_hr: 60,
      file_name: '',
      code: '',
      fileDatas: [],
      totalCount: 0,
      idx: 1,
      fakeDatas: [],
      hr: 0,
      colorIdx: 0,
      zones: []
    }
  ];
  displayCards = [];
  constructor(private coachService: CoachService) {
    this.handleSearchFile = debounce(this.handleSearchFile, 1000);
  }

  ngOnInit() {}
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  addUser() {
    this.userDatas.push({
      userId: null,
      age: 30,
      rest_hr: 60,
      file_name: '',
      code: '',
      fileDatas: [],
      totalCount: 0,
      idx: 1,
      fakeDatas: [],
      hr: 0,
      colorIdx: 0,
      zones: []
    });
  }
  removeUser(idx) {
    this.userDatas.splice(idx, 1);
    this.displayCards.splice(idx, 1);
  }
  insertFakeData(data, index) {
    const { idx, totalCount, fakeDatas } = data;
    if (totalCount > idx) {
      const { distance, heart_rate, pace, utc } = fakeDatas[idx - 1];
      const body = {
        raceId: '5219',
        heartRate: heart_rate,
        time: utc,
        pace,
        distance
      };
      this.coachService.postFakeData(body).subscribe(res => {
        data.hr = res.heartRate;
        this.handleCard(data.hr, index);
        data.idx++;
      });
    }
  }
  handleSearchFile(userId, idx) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    this.coachService
      .fetchFileName(params)
      .subscribe(res => (this.userDatas[idx].fileDatas = res));
  }
  handleCard(hr, index) {
    this.userDatas[index].colorIdx = this.userDatas[index].zones.findIndex(
      _val => hr * 1.5 < _val
    );
    if (this.userDatas[index].colorIdx === -1) {
      this.userDatas[index].colorIdx = 5;
    }
  }
  handleMethod() {
    this.userDatas.forEach((data, index) => {
      this.handleHRZone(index, data.age, data.rest_hr);
    });
  }
  handleHRZone(index, age, rest_hr) {
    this.userDatas[index].zones = [];
    // 最大心律法
    if (this.method === 1) {
      let hrValue = (220 - age - rest_hr) * 0.55 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.6 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.65 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.75 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.85 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
    } else { // 儲備心率法
      let hrValue = (220 - age - rest_hr) * 0.5 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.6 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.7 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.8 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.9 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
    }
  }
  join(id, code, idx) {
    const codearr = [];
    codearr.push(code);
    this.handleHRZone(
      idx,
      this.userDatas[idx].age,
      this.userDatas[idx].rest_hr
    );
    const body = { codes: codearr };
    this.coachService.fetchExample(body).subscribe(res => {
      this.userDatas[idx].fakeDatas = res;
      this.userDatas[idx].totalCount = res.length;
      if (res.length > 0) {
        this.displayCards.push(code);
      }
    });
  }
  continue() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.userDatas.forEach((data, index) => {
        this.insertFakeData(data, index);
      });
    }, 2000);
  }
  stop() {
    clearInterval(this.timer);
  }
  restart() {
    clearInterval(this.timer);
    this.userDatas.forEach(data => {
      data.idx = 1;
    });
    this.timer = setInterval(() => {
      this.userDatas.forEach((data, index) => {
        this.insertFakeData(data, index);
      });
    }, 2000);
  }
}
