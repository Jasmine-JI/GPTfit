import { Component, OnInit, OnDestroy } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { HttpParams } from '@angular/common/http';
import { debounce } from '@shared/utils/';
import { MatSnackBar } from '@angular/material';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import { HrZoneDialogComponent } from '../hr-zone-dialog/hr-zone-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DragulaService } from 'ng2-dragula/ng2-dragula';

@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.css']
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
  timer: any;
  method = 2;
  colorDatas = [
    '#4D99FF',
    '#AAEAFF',
    '#9FFF7A',
    '#FFC84D',
    '#FFF96A',
    '#FF4D4D'
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
  constructor(
    private coachService: CoachService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private dragula: DragulaService
  ) {
    this.handleSearchFile = debounce(this.handleSearchFile, 1000);
    this.dragula.setOptions('bag-items', { revertOnSpill: true });
  }

  ngOnInit() {
  }
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
    this.snackBar.open(
      `教練，有userId: ${this.userDatas[idx].userId}學員，中途離開訓練大廳了!!`,
      '我知道了',
      { duration: 2000 }
    );
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
      let hrValue = (220 - age) * 0.5;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.6;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.7;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.8;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.9;
      this.userDatas[index].zones.push(hrValue);
      hrValue = (220 - age) * 1;
      this.userDatas[index].zones.push(hrValue);
    } else {
      // 儲備心率法
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
      hrValue = (220 - age - rest_hr) * 1 + rest_hr;
      this.userDatas[index].zones.push(hrValue);
    }
  }
  openHRZoneWin(userId, zones) {
    this.dialog.open(HrZoneDialogComponent, {
      hasBackdrop: true,
      data: { userId, zones, method: this.method }
    });
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
      const isHaveHR = res.some(_data => _data.heart_rate > 0);
      if (res.length > 0 && isHaveHR) {
        this.displayCards.push(code);
        this.snackBar.open(
          `教練，有userId: ${this.userDatas[idx].userId}學員，已進入訓練大廳!!`,
          '我知道了',
          { duration: 2000 }
        );
      } else {
        this.dialog.open(MsgDialogComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: '此運動檔案無數據，或是沒有heart rate數據都為0'
          }
        });
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
