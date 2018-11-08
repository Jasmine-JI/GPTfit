import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  HostListener
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
import { HttpParams } from '@angular/common/http';
import { Users } from '../../models/fakeUser';
import { Meta } from '@angular/platform-browser';
import * as d3 from 'd3';
import * as _Highcharts from 'highcharts';
import * as Stock from 'highcharts/highstock';
import { Observable } from 'rxjs/Observable';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import * as moment from 'moment';
import { chart } from 'highcharts';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

var Highcharts: any = _Highcharts; // 不檢查highchart型態
export class Message {
  constructor(
    public classStatus: string,
    public classIcon: string,
    public classMemberInfo: any,
    public className: string
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
export class CoachDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
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
  @ViewChild('hrChartTarget') hrChartTarget: ElementRef;
  @ViewChild('carousel') carouselElement: ElementRef;
  chart: any; // Highcharts.ChartObject
  heartValues: any;
  socketTimer: any;
  isFirstInit = true;
  currentMemberNum = 0;
  frameUrl: SafeResourceUrl;
  classImage = 'https://www.healthcenterhoornsevaart.nl/wp-content/uploads/2018/02/combat-630x300.jpg';
  // private socket$: WebSocketSubject<Message>;
  private socket$: WebSocketSubject<any>;

  // public serverMessages = new Array<Message>();
  public serverMessages: Message;

  constructor(
    private coachService: CoachService,
    private router: Router,
    private route: ActivatedRoute,
    private meta: Meta,
    elementRef: ElementRef,
    private sanitizer: DomSanitizer
  ) {
    this.elementRef = elementRef;
    // this.socket$ = new WebSocketSubject('ws://192.168.1.231:9000/train');
    this.socket$ = new WebSocketSubject('ws://192.168.1.235:3002');

    this.socket$.subscribe(
      message => this.display(JSON.stringify(message)),
      // message => this.display(message),
      err => console.error(err),
      () => console.warn('Completed!')
    );
    Highcharts.setOptions({
      global: {
        useUTC: false
      }
    });
    const url = 'https://www.youtube.com/embed/4ZxUz0weJUY';
    this.frameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    this.fakeDatas = fakeDatas;
    this.fakeDatas.forEach((_data, idx) => {
      const image = new Image();
      image.addEventListener('load', e => this.handleImageLoad(e, idx));
      image.src = _data.imgUrl;
    });
    this.raceId = this.route.snapshot.paramMap.get('raceId');
    // this.handleRealTime();
    this.handleCoachInfo(fakeCoachInfo);

  }
  display(msg) {
    let sum = 0;
    this.heartValues = [];
    const firstsSeries = [];
    // console.log('msg: ', msg);
    if (typeof(msg) === 'string') {
      this.serverMessages = JSON.parse(msg.replace(/u'(?=[^:]+')/g, "'").replace(/'/g, '"'));
      const totalInfoNum = this.serverMessages.classMemberInfo.length;
      console.log('this.serverMessages: ', this.serverMessages);
      this.serverMessages.classMemberInfo.map((serie, index) => {
        // console.log('serie: ', serie);
        const { userName, dataIndex } = serie;
        const liveHrIdx = dataIndex.findIndex(_data => _data.dataFormat === '129');
        const liveHr = dataIndex[liveHrIdx].value;
        // console.log('liveHr: ', liveHr);
        sum += liveHr;
        this.heartValues.push({ userName, liveHr });
        if (this.isFirstInit) {
          console.log('index: ', index);
          this.chart.addSeries({ data: [moment().unix() * 1000, liveHr] });

          // firstsSeries[index] = {data: [moment().unix() * 1000, liveHr]};
          console.log('liveHr: ', liveHr);

          console.log('firstsSeries: ', firstsSeries);
        } else if (totalInfoNum !== this.currentMemberNum && index >= this.currentMemberNum) {
          this.chart.addSeries({ data: [moment().unix() * 1000, liveHr]});
        } else {
          this.chart.series[index].addPoint([moment().unix() * 1000, liveHr]);
        }
      });
      if (this.isFirstInit) {
        console.log('firstsSeries: ', firstsSeries);
        // this.initHChart();
        this.isFirstInit = false;
      }
      this.currentMemberNum = this.serverMessages.classMemberInfo.length;
    } else {
      if (msg.classStatus === '2') {
        clearInterval(this.socketTimer);
        this.socket$.unsubscribe();
        alert('下課嚕');
      }
    }
    console.log('!!!!!!', this.chart.series);

    console.log('this.serverMessages: ', this.serverMessages);
    this.heartValues = this.heartValues.sort(
      (a, b) => b.liveHr - a.liveHr
    );
    this.hrMeanValue = Math.round(sum / this.currentMemberNum);
  }
  sendAddMember() {
    // this.stopBoardCast();
    const data = {
      classViewer: '1', // 1:執行，2:觀看
      classId: '1',
      memberAddNum: '1'
    };
    this.socket$.next(data);
  }
  sendBoardCast() {
    // const max = 180;
    // const min = 54;
    // const data = {
    //   classViewer: '2', // 1:執行，2:觀看
    //   classId: '1'
    // };
    this.socketTimer = setInterval(
      () => {
        const data = {
          classViewer: '2', // 1:執行，2:觀看
          classId: '1'
        };
        this.socket$.next(data);
        // this.serverMessages = data;
      }, 3000);
    // this.socket$.next(data);

  }
  stopBoardCast() {
    clearInterval(this.socketTimer);
    // this.socket$.unsubscribe();
  }

  initHChart() {
    // console.log('!!!series: ', series);
    const hrOptions: any = {
      // chart: {
      //   events: {
      //     load: function () {

      //       // set up the updating of the chart each second
      //       // const series = this.series[0];
      //       // this.hchartTimer = setInterval(() => {
      //       //   const x = (new Date()).getTime(), // current time
      //       //     y = Math.round(Math.random() * 100);
      //       //   series.addPoint([x, y], true, true);
      //       // }, 1000);
      //     }
      //   }
      // },
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
      }
      // series: [{ name: 'dd', data: [1541495410000, 150] }, { name: 'yy', data: [1541495410000, 175]}]
    };
    this.chart = new Stock.StockChart(this.hrChartTarget.nativeElement, hrOptions);
  }
  handleRangeArray(start, end) {
    const final = (end - start) / 10;
    const arr = [];
    for (let i = 0; i <= final; i++) {
      arr.push(start + 10 * i);
      return arr;
    }
  }
  ngAfterViewInit() {
    // this.handleDrawChart();
    this.initHChart();
  }
  ngOnDestroy() {
    clearInterval(this.timer);
    clearInterval(this.chart.hchartTimer); // 因為要到this.chart裡找hchartTimer
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
          this.renderCards = this.displayCards.map(_card => _card.user_id);
          this.isNotFirstChanged = true;
        }
        this.handleMethod();
        this.handleChartHr(this.displayCards);
        let sum = 0;
        this.data.push([(this.time + 1) * 2]);
        this.time++;
        this.displayCards.forEach((_card, idx) => {
          const { current_heart_rate, user_id } = _card;
          const index = this.renderCards.findIndex(_id => _id === user_id);
          const image = new Image();
          image.addEventListener('load', e => this.handleImageLoad(e, idx));
          image.src = _card.imgUrl;
          sum += current_heart_rate;
          this.handleCard(current_heart_rate, idx);
          this.data[this.data.length - 1][index + 1] = current_heart_rate;
        });
        // if (this.data.length > 0 && !this.isNotFirstDrawed) {
        //   this.handleDrawChart();
        //   this.isNotFirstDrawed = true;
        // } else {
        //   this.updateChart();
        // }
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
  handldeChartOptions(idx) {
    if (idx === 1) {
      this.dispalyChartOptions[0] = !this.dispalyChartOptions[0];
      this.dispalyChartOptions[1] = !this.dispalyChartOptions[1];
    } else {
      this.dispalyChartOptions[0] = !this.dispalyChartOptions[0];
      this.dispalyChartOptions[1] = !this.dispalyChartOptions[1];
    }
  }
  handldeMemberOptions(idx) {
    if (idx === 0) {
      this.dispalyMemberOptions[0] = !this.dispalyMemberOptions[0];
      if (this.dispalyMemberOptions[0]) {
        this.dispalyMemberOptions[1] = false;
      } else {
        this.dispalyMemberOptions[1] = true;
      }
      this.dispalyMemberOptions[2] = false;
    } else if (idx === 1) {
      this.dispalyMemberOptions[1] = !this.dispalyMemberOptions[1];
      if (this.dispalyMemberOptions[1]) {
        this.dispalyMemberOptions[0] = false;
      } else {
        this.dispalyMemberOptions[0] = true;
      }
      this.dispalyMemberOptions[2] = false;
    } else {
      this.dispalyMemberOptions[2] = !this.dispalyMemberOptions[2];
      if (this.dispalyMemberOptions[2]) {
        this.dispalyMemberOptions[0] = false;
        this.dispalyMemberOptions[1] = false;
      } else {
        this.dispalyMemberOptions[0] = false;
        this.dispalyMemberOptions[1] = true;
      }
    }
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
