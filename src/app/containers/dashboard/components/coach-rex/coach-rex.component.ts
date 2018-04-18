import {
  Component,
  OnInit,
  OnDestroy,
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/core';
import { mapImages } from '@shared/mapImages';
import { fakeDatas, fakeCoachInfo } from './fakeUsers';
import { CoachService } from '../../services/coach.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { Users } from '../../models/fakeUser';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-coach-rex',
  templateUrl: './coach-rex.component.html',
  styleUrls: ['./coach-rex.component.css'],
  animations: [
    trigger('animateState', [
      state(
        '0',
        style({
          backgroundColor: '#009fe1'
        })
      ),
      state(
        '1',
        style({
          backgroundColor: '#00e1b4'
        })
      ),
      state(
        '2',
        style({
          backgroundColor: '#5fe100'
        })
      ),
      state(
        '3',
        style({
          backgroundColor: '#dee100'
        })
      ),
      state(
        '4',
        style({
          backgroundColor: '#e18400'
        })
      ),
      state(
        '5',
        style({
          backgroundColor: '#e14a00'
        })
      ),
      state(
        '6',
        style({
          backgroundColor: '#e10019'
        })
      ),
      transition('* => *', animate('1000ms'))
    ])
  ]
})
export class CoachRexComponent implements OnInit, OnDestroy {
  width = 0;
  height = 0;
  fakeDatas: any;
  raceId: string;
  timer: any;
  displayCards = [];
  imgClassess = [];
  method = 2;
  window = window;
  isNotFirstChanged = false;
  renderCards = [];
  coachInfo: string;
  hrSortValues: any;
  hrMeanValue = 0;
  hrColors = [
    '#009fe1',
    '#00e1b4',
    '#5fe100',
    '#dee100',
    '#e18400',
    '#e14a00',
    '#e10019'
  ];
  displaySections = [true, true, true];
  isSectionIndividual = false;
  isMoreDisplay = false;
  constructor(
    private coachService: CoachService,
    private router: Router,
    private route: ActivatedRoute,
    private meta: Meta
  ) {}

  ngOnInit() {
    const ratio = window.devicePixelRatio;
    if (location.host !== '192.168.1.235:8080' && ratio === 3) {
      this.meta.updateTag({
        name: 'viewport',
        content: `width=device-width, initial-scale=${1 / ratio}`
      });
    }
    this.fakeDatas = fakeDatas;
    this.fakeDatas.forEach((_data, idx) => {
      const image = new Image();
      image.addEventListener('load', e => this.handleImageLoad(e, idx));
      image.src = _data.imgUrl;
    });
    this.raceId = this.route.snapshot.paramMap.get('raceId');
    this.handleRealTime();
    this.handleCoachInfo(fakeCoachInfo);
  }
  ngOnDestroy() {
    clearInterval(this.timer);
    this.meta.updateTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1'
    });
  }

  handleRealTime() {
    let params = new HttpParams();
    params = params.set('raceId', this.raceId);
    this.timer = setInterval(() => {
      this.coachService.fetchRealTimeData(params).subscribe(res => {
        this.displayCards = res;
        if (!this.isNotFirstChanged) {
          this.renderCards = new Array(this.displayCards.length);
          this.isNotFirstChanged = true;
        }
        this.handleMethod();
        this.handleChartHr(this.displayCards);
        let sum = 0;
        this.displayCards.forEach((_card, idx) => {
          const { current_heart_rate } = _card;
          const image = new Image();
          image.addEventListener('load', e => this.handleImageLoad(e, idx));
          image.src = _card.imgUrl;
          sum += current_heart_rate;
          this.handleCard(current_heart_rate, idx);
        });
        this.hrMeanValue = Math.round(sum / this.displayCards.length);
      });
    }, 2000);
  }
  handleChartHr(arr) {
    this.hrSortValues = [...arr]; // use spread operator deep copy because avoid being immutable
    this.hrSortValues = this.hrSortValues.sort(
      (a, b) => b.current_heart_rate - a.current_heart_rate
    );
  }
  handldeSection(idx) {
    this.isSectionIndividual = !this.isSectionIndividual;
    if (this.isSectionIndividual) {
      if (idx === 0) {
        this.displaySections[0] = true;
        this.displaySections[1] = false;
        this.displaySections[2] = false;
      } else if (idx === 1) {
        this.displaySections[0] = false;
        this.displaySections[1] = true;
        this.displaySections[2] = false;
      } else {
        this.displaySections[0] = false;
        this.displaySections[1] = false;
        this.displaySections[2] = true;
      }
    } else {
      this.displaySections[0] = true;
      this.displaySections[1] = true;
      this.displaySections[2] = true;
    }
    this.handleCoachInfo(fakeCoachInfo);
  }
  handleImageLoad(event, idx): void {
    this.width = event.target.width;
    this.height = event.target.height;
    this.imgClassess[idx] =
      this.width > this.height
        ? 'user-photo--landscape'
        : 'user-photo--portrait';
    if (this.imgClassess[idx] === 'user-photo--landscape') {
      const proportion = this.width / this.height;
      if (proportion > 1.5) {
        this.imgClassess[idx] += ' photo-fit__50';
      } else if (proportion > 1.2) {
        this.imgClassess[idx] += ' photo-fit__25';
      }
    }
  }
  handleCoachInfo(str) {
    const info = str.replace(/\r\n|\n/g, '').trim();
    if (
      info.length > 118 &&
      this.displaySections[0] === true &&
      !this.isSectionIndividual
    ) {
      this.coachInfo = info.substring(0, 118);
      this.isMoreDisplay = true;
    } else {
      this.coachInfo = info;
      this.isMoreDisplay = false;
    }
  }
  handleCard(hr, index) {
    this.displayCards[index].colorIdx = this.displayCards[
      index
    ].zones.findIndex(_val => hr < _val);
    if (this.displayCards[index].colorIdx === -1) {
      this.displayCards[index].colorIdx = 6;
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
  stop() {
    clearInterval(this.timer);
  }
  restart() {
    clearInterval(this.timer);
    this.handleRealTime();
  }
}
