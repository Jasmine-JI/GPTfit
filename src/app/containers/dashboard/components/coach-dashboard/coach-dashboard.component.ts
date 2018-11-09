import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { fakeDatas, fakeCoachInfo } from './fakeUsers';
import { CoachService } from '../../services/coach.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import * as Stock from 'highcharts/highstock';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import * as moment from 'moment';
import { stockChart } from 'highcharts/highstock';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UtilsService } from '@shared/services/utils.service';
import * as _ from 'lodash';


export class Message {
  constructor(
    public classMemberDataField: any,
    public classMemberDataFieldValue: any
  ) {}
}
@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None,
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
export class CoachDashboardComponent implements OnInit, OnDestroy {
  width = 0;
  height = 0;
  fakeDatas: any;
  classId: string;
  timer: any;
  displayCards = [];
  imgClassess = [];
  method = 2;
  window = window;
  isNotFirstChanged = false;
  isNotFirstDrawed = false;
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
  dispalyChartOptions = [false, true, false];
  dispalyMemberOptions = [false, true, false, false];
  isSectionIndividual = false;
  isMoreDisplay = false;
  radius = 10;
  elementRef: ElementRef;
  data = [];
  defChartIds = [2, 3, 4, 5, 6];
  chartWidth = 0;
  chartHeight = 0;
  s: any;
  time = 0;
  @ViewChild('hrChartTarget')
  hrChartTarget: ElementRef;
  @ViewChild('carousel')
  carouselElement: ElementRef;
  chart: any; // Highcharts.ChartObject
  heartValues = [];
  socketTimer: any;
  isFirstInit = true;
  currentMemberNum = 0;
  frameUrl: SafeResourceUrl;
  totalInfo: string;
  isLoading = false;
  isClassEnd = false;
  classImage =
    'https://www.healthcenterhoornsevaart.nl/wp-content/uploads/2018/02/combat-630x300.jpg';
  private socket$: WebSocketSubject<any>;

  public serverMessages: Message;
  userInfos: any = [];
  constructor(
    private coachService: CoachService,
    private router: Router,
    private route: ActivatedRoute,
    private meta: Meta,
    elementRef: ElementRef,
    private sanitizer: DomSanitizer,
    private utils: UtilsService
  ) {
    Stock.setOptions({ global: { useUTC: false } });
    this.elementRef = elementRef;
    this.socket$ = new WebSocketSubject('ws://192.168.1.231:9000/train');
    // this.socket$ = new WebSocketSubject('ws://192.168.1.235:3002');

    this.socket$.subscribe(
      // message => this.display(JSON.stringify(message)),
      message => this.display(message),
      err => console.error(err),
      () => console.warn('Completed!')
    );

    const url = 'https://player.twitch.tv/?channel=baoz';
    this.frameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('classId');
    this.handleCoachInfo(fakeCoachInfo);
    this.sendBoardCast();
  }
  display(msg) {
    let sum = 0;
    this.heartValues = [];
    if (typeof msg === 'string') {
      this.serverMessages = JSON.parse(msg
          .replace(/u'(?=[^:]+')/g, "'")
          .replace(/'/g, '"'));
      const chartDatas = this.serverMessages.classMemberDataFieldValue;
      const fields = this.serverMessages.classMemberDataField;
      const heartIdx = fields.findIndex(_field => _field === '129');
      const snIdx = fields.findIndex(_field => _field === 'equipmentSN');
      const zoneIdx = fields.findIndex(_field => _field === '133');

      if (this.userInfos.length === 0) {
        const equipSnDatas = chartDatas.map(_data => {
          return _data[snIdx];
        });
        this.handleSNInfo(equipSnDatas);
      } else {
        this.heartValues = chartDatas.map((_data, idx) => {
          const liveHr = _data[heartIdx];
          const colorIdx = _data[zoneIdx];
          this.chart.series[idx].addPoint([moment().unix() * 1000, liveHr]);
          sum += liveHr;
          return { liveHr, userName: this.userInfos[_data[snIdx]].userName, colorIdx, userIcon: this.userInfos[_data[snIdx]].userIcon, imgClassName: this.userInfos[_data[snIdx]].imgClassName };
        });
      }
      this.currentMemberNum = chartDatas.length;
    } else {
      if (msg.classStatus === '2') {
        clearInterval(this.socketTimer);
        this.socket$.unsubscribe();
        this.isLoading = false;
        this.isClassEnd = true;
      }
    }
    this.heartValues = this.heartValues.sort((a, b) => b.liveHr - a.liveHr);
    this.hrMeanValue = Math.round(sum / this.currentMemberNum);
  }
  handleSNInfo(snDatas: any) {
    const body = { token: this.utils.getToken(), pairEquipmentSN: snDatas };
    this.coachService.fetchFitPairInfo(body).subscribe(res => {
      const datas = res.info.deviceInfo;
      const series = [];
      const infos = datas.map((_data, idx) => {
        const { userName, pairEquipmentSN, pairIcon } = _data;
        series.push({ name: userName, data: [] });
        const userIcon =
          pairIcon && pairIcon.length > 0
            ? this.utils.buildBase64ImgString(pairIcon)
            : '/assets/images/user.png';
        const image = new Image();
        image.src = userIcon;
        const width = image.width;
        const height = image.height;
        let imgClassName =
          width > height ? 'user-photo--landscape' : 'user-photo--portrait';
        const proportion = width / height;
        if (proportion > 1.5) {
          imgClassName += ' photo-fit__50';
        } else if (proportion > 1.2) {
          imgClassName += ' photo-fit__25';
        }
        return { userName, pairEquipmentSN, userIcon, imgClassName };
      });
      const hrOptions: any = {
        title: {
          text: 'Live random data'
        },
        exporting: {
          enabled: false
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: {
            millisecond: '%H:%M:%S.%L',
            second: '%H:%M:%S',
            minute: '%H:%M',
            hour: '%H:%M',
            day: '%m/%d',
            week: '%m/%d',
            month: '%Y/%m',
            year: '%Y'
          }
        },
        series
      };
      this.initHChart(hrOptions);
      this.isLoading = false;
      this.userInfos = _.keyBy(infos, keyName => keyName.pairEquipmentSN);
    });
  }

  sendBoardCast() {
    this.isLoading = true;
    this.socketTimer = setInterval(() => {
      const data = { classViewer: '2', classId: this.classId }; // 1:執行，2:觀看
      this.socket$.next(data);
    }, 5000);
  }
  stopBoardCast() {
    clearInterval(this.socketTimer);
  }

  initHChart(option) {
    this.chart = stockChart(this.hrChartTarget.nativeElement, option);
  }
  handleRangeArray(start, end) {
    const final = (end - start) / 10;
    const arr = [];
    for (let i = 0; i <= final; i++) {
      arr.push(start + 10 * i);
      return arr;
    }
  }
  ngOnDestroy() {
    clearInterval(this.socketTimer);
  }

  handleCoachInfo(str) {
    this.totalInfo = str.replace(/\r\n|\n/g, '').trim();
    if (
      this.totalInfo.length > 118 &&
      this.displaySections[0] === true &&
      !this.isSectionIndividual
    ) {
      this.coachInfo = this.totalInfo.substring(0, 118);
      this.isMoreDisplay = true;
    } else {
      this.coachInfo = this.totalInfo;
      this.isMoreDisplay = false;
    }
  }
  handleExtendCoachInfo() {
    this.coachInfo = this.totalInfo;
    this.isMoreDisplay = false;
  }
  handldeSection(idx) {
    this.isSectionIndividual = !this.isSectionIndividual;
    if (this.isSectionIndividual) {
      if (idx === 0) {
        this.displaySections[0] = true;
        this.displaySections[1] = false;
        this.displaySections[2] = false;
      } else if (idx === 1) {
        this.dispalyChartOptions[2] = true;
        this.displaySections[0] = false;
        this.displaySections[1] = true;
        this.displaySections[2] = false;
      } else {
        this.dispalyMemberOptions[3] = true;
        this.displaySections[0] = false;
        this.displaySections[1] = false;
        this.displaySections[2] = true;
      }
    } else {
      // this.chart.destory();
      // this.initHChart();
      this.dispalyChartOptions[2] = false;
      this.dispalyMemberOptions[3] = false;
      this.displaySections[0] = true;
      this.displaySections[1] = true;
      this.displaySections[2] = true;
    }
    this.handleCoachInfo(fakeCoachInfo);
  }
}
