import { Component, OnInit, OnDestroy } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { HttpParams } from '@angular/common/http';
import { debounce } from '@shared/utils/';
import { MatSnackBar } from '@angular/material';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import { HrZoneDialogComponent } from '../hr-zone-dialog/hr-zone-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DragulaService } from 'ng2-dragula/ng2-dragula';
import { mapImages } from '@shared/mapImages';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard-detail.component.html',
  styleUrls: ['./coach-dashboard-detail.component.css']
})
export class CoachDashboardDetailComponent implements OnInit, OnDestroy {
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
  raceList: any;
  mapImages = mapImages;
  raceId: string;
  constructor(
    private coachService: CoachService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private dragula: DragulaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.dragula.setOptions('bag-items', { revertOnSpill: true });
  }

  ngOnInit() {
    this.raceId = this.route.snapshot.paramMap.get('raceId');
    let params = new HttpParams();
    params = params.set('raceId', this.raceId);
    this.timer = setInterval(() => {
      this.coachService.fetchRealTimeData(params).subscribe(res => {
        this.displayCards = res;
        this.handleMethod();
        this.displayCards.forEach((_card, idx) => {
          const { current_heart_rate } = _card;
          this.handleCard(current_heart_rate, idx);

        });
      });
    }, 2000);

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


  handleCard(hr, index) {
    this.displayCards[index].colorIdx = this.displayCards[index].zones.findIndex(
      _val => hr < _val
    );
    if (this.displayCards[index].colorIdx === -1) {
      this.displayCards[index].colorIdx = 5;
    }
  }
  handleMethod() {
    this.displayCards.forEach((data, index) => {
      this.handleHRZone(index, data.age, data.rest_hr);
    });
  }
  handleHRZone(index, age, rest_hr) {
    this.displayCards[index].zones = [];
    // 最大心律法
    if (this.method === 1) {
      let hrValue = (220 - age) * 0.5;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.6;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.7;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.8;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.9;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 1;
      this.displayCards[index].zones.push(hrValue);
    } else {
      // 儲備心率法
      let hrValue = (220 - age - rest_hr) * 0.55 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.6 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.65 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.75 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.85 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 1 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
    }
  }
  openHRZoneWin(userId, zones) {
    this.dialog.open(HrZoneDialogComponent, {
      hasBackdrop: true,
      data: { userId, zones, method: this.method }
    });
  }

  continue() {
    clearInterval(this.timer);
    let params = new HttpParams();
    params = params.set('raceId', this.raceId);
    this.timer = setInterval(() => {
      this.coachService.fetchRealTimeData(params).subscribe(res => {
        this.displayCards = res;
        this.handleMethod();
        this.displayCards.forEach((_card, idx) => {
          const { current_heart_rate } = _card;
          this.handleCard(current_heart_rate, idx);
        });
      });
    }, 2000);
  }
  stop() {
    clearInterval(this.timer);
  }
  restart() {
    clearInterval(this.timer);
    let params = new HttpParams();
    params = params.set('raceId', this.raceId);
    this.timer = setInterval(() => {
      this.coachService.fetchRealTimeData(params).subscribe(res => {
        this.displayCards = res;
        this.handleMethod();
        this.displayCards.forEach((_card, idx) => {
          const { current_heart_rate } = _card;
          this.handleCard(current_heart_rate, idx);
        });
      });
    }, 2000);
  }
}
