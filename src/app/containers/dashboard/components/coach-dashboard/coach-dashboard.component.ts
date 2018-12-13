import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
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
import { fakeCoachInfo, demoCoachInfo, demoLessonInfo } from './fakeUsers';
import { CoachService } from '../../services/coach.service';
import { ActivatedRoute } from '@angular/router';
import * as Stock from 'highcharts/highstock';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import * as moment from 'moment';
import { stockChart } from 'highcharts/highstock';

import { DomSanitizer } from '@angular/platform-browser';
import { UtilsService } from '@shared/services/utils.service';
import { getUrlQueryStrings } from '@shared/utils/';
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
  styleUrls: ['./coach-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('animateState', [
      state(
        '0',
        style({
          backgroundColor: '#2e4d9f'
        })
      ),
      state(
        '1',
        style({
          backgroundColor: '#2eb1e7'
        })
      ),
      state(
        '2',
        style({
          backgroundColor: '#92c422'
        })
      ),
      state(
        '3',
        style({
          backgroundColor: '#f5ab14'
        })
      ),
      state(
        '4',
        style({
          backgroundColor: '#eb5b19'
        })
      ),
      state(
        '5',
        style({
          backgroundColor: '#c11920'
        })
      ),
      transition('* => *', animate('1000ms'))
    ])
  ]
})
export class CoachDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {
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
  meanValue = 0;
  hrColors = ['#2e4d9f', '#2eb1e7', '#92c422', '#f5ab14', '#eb5b19', '#c11920'];
  displaySections = [true, true, true];
  dispalyChartOptions = [false, true, false];
  dispalyMemberOptions = [false, true, false, false];
  isSectionIndividual = false;
  isCoachMoreDisplay = false;
  isLessonMoreDisplay = false;

  radius = 10;
  elementRef: ElementRef;
  data = [];
  defChartIds = [2, 3, 4, 5, 6];
  chartWidth = 0;
  chartHeight = 0;
  s: any;
  time = 0;
  @ViewChild('hrChartTarget') hrChartTarget: ElementRef;
  @ViewChild('hrChartTarget1') hrChartTarget1: ElementRef;
  @ViewChild('hrChartTarget2') hrChartTarget2: ElementRef;
  @ViewChild('carousel')
  carouselElement: ElementRef;
  chart: any; // Highcharts.ChartObject
  chart1: any;
  chart2: any;
  heartValues = [];
  socketTimer: any;
  isFirstInit = true;
  currentMemberNum = 0;
  totalCoachInfo: string;
  totalLessonInfo: string;
  isLoading = false;
  isClassEnd = false;
  token: string;
  isDemoMode = true;
  demoMaker: any;
  demoTime: any;
  lessonInfo: string;
  isHadVideoUrl = false;
  classInfo = {
    groupName: '',
    groupIcon: '',
    groupIconClassName: 'user-photo--landscape',
    coachAvatar: '',
    coachName: 'Eve Beardall',
    groupVideoUrl: null,
    coachDesc: '',
    groupDesc: ''
  };
  series1: any;
  series2: any;
  series3: any;
  chartType = 0;
  cardSortKind = 0;
  classType: string;
  sortType = 0;
  isCardDesc = true;
  demoData: Array<any> = [
    {
      liveHr: 100,
      calorie: 100,
      cadence: 0,
      speed: 0,
      userName: 'Eve Beardall',
      colorIdx: 0,
      userIcon: '/assets/demo/coach.png',
      imgClassName: 'user-photo--landscape'
    },
    {
      liveHr: 100,
      calorie: 100,
      cadence: 0,
      speed: 0,
      userName: 'Alexia',
      colorIdx: 0,
      userIcon: '/assets/demo/1.png',
      imgClassName: 'user-photo--landscape'
    },
    {
      liveHr: 100,
      calorie: 100,
      cadence: 0,
      speed: 0,
      userName: 'Florence',
      colorIdx: 0,
      userIcon: '/assets/demo/2.png',
      imgClassName: 'user-photo--landscape'
    },
    {
      liveHr: 100,
      calorie: 100,
      cadence: 0,
      speed: 0,
      userName: 'Katherine',
      colorIdx: 0,
      userIcon: '/assets/demo/3.png',
      imgClassName: 'user-photo--landscape'
    },
    {
      liveHr: 100,
      calorie: 100,
      cadence: 0,
      speed: 0,
      userName: 'Martina',
      colorIdx: 0,
      userIcon: '/assets/demo/4.png',
      imgClassName: 'user-photo--landscape'
    },
    {
      liveHr: 100,
      calorie: 100,
      cadence: 0,
      speed: 0,
      userName: 'Stephanie',
      colorIdx: 0,
      userIcon: '/assets/demo/5.png',
      imgClassName: 'user-photo--landscape'
    }
  ];
  classImage =
    'https://www.healthcenterhoornsevaart.nl/wp-content/uploads/2018/02/combat-630x300.jpg';
  private socket$: WebSocketSubject<any>;

  public serverMessages: Message;
  userInfos: any = [];
  constructor(
    private coachService: CoachService,
    private route: ActivatedRoute,
    elementRef: ElementRef,
    private sanitizer: DomSanitizer,
    private utils: UtilsService
  ) {
    Stock.setOptions({ global: { useUTC: false } });
    this.elementRef = elementRef;
    this.socket$ = new WebSocketSubject('wss://app.alatech.com.tw:9000/train');

    this.socket$.subscribe(
      message => this.display(message),
      err => console.error(err),
      () => console.warn('Completed!')
    );
  }

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    this.classType = queryStrings.type;
    this.classId = this.route.snapshot.paramMap.get('classId');
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      classId: this.classId
    };
    if (!(this.classId === '99999' && this.isDemoMode)) {
      this.coachService.fetchClassRoomDetail(body).subscribe(res => {
        this.classInfo = res.info;
        this.classInfo.groupIcon =
          this.classInfo.groupIcon && this.classInfo.groupIcon.length > 0
            ? this.utils.buildBase64ImgString(this.classInfo.groupIcon)
            : '/assets/images/group-default.svg';
        const groupIcon = new Image();
        groupIcon.src = this.classInfo.groupIcon;
        this.classInfo.groupIconClassName =
          groupIcon.width > groupIcon.height
            ? 'user-photo--landscape'
            : 'user-photo--portrait';
        this.classInfo.coachAvatar =
          this.classInfo.coachAvatar && this.classInfo.coachAvatar.length > 0
            ? this.utils.buildBase64ImgString(this.classInfo.coachAvatar)
            : '/assets/images/user.png';
        if (this.classInfo.groupVideoUrl.length > 0) {
          this.isHadVideoUrl = true;
          this.classInfo.groupVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.classInfo.groupVideoUrl
          );
        } else {
          this.isHadVideoUrl = false;
        }
        this.handleCoachInfo(this.classInfo.coachDesc);
        this.handleLessonInfo(this.classInfo.groupDesc);
      });
      this.sendBoardCast();
    }
  }
  handleDemoinit(type) {
    let series;
    if (type === 0) {
      series = _.cloneDeep(this.series1);
    } else if (type === 1) {
      series = _.cloneDeep(this.series2);
    } else {
      series = _.cloneDeep(this.series3);
    }
    if (series && series[0].data.length > 0) {
      series = series.sort(
        (a, b) => a.data[a.data.length - 1][0] - b.data[b.data.length - 1][0]
      );
    }
    if (this.classId === '99999' && this.isDemoMode) {
      this.classInfo.groupIcon = '/assets/demo/demoClass.jpg';
      this.classInfo.coachAvatar = '/assets/demo/coach.png';
      this.classInfo.groupVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.handleVideoUrl('https://www.youtube.com/embed/eHiDLxBhHGs')
      );
      this.handleCoachInfo(demoCoachInfo);
      this.handleLessonInfo(demoLessonInfo);

      this.currentMemberNum = 6;
      this.demoTime = moment().format('YYYY/MM/DD Ahh:mm');
      this.getDemoData(type);
    }
    const hrOptions: any = {
      chart: {
        height: 250
      },
      exporting: {
        enabled: false
      },
      rangeSelector: {
        inputEnabled: false,
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S.%L',
          second: '%H:%M:%S',
          minute: '%H:%M:%S',
          hour: '%H:%M:%S',
          day: '%H:%M:%S',
          week: '%H:%M:%S',
          month: '%H:%M:%S',
          year: '%H:%M:%S'
        }
      },
      series
    };
    this.initHChart(hrOptions);
  }
  ngAfterViewInit(): void {
    if (this.classId === '99999' && this.isDemoMode) {
      const series = [
        { name: 'Eve Beardall', data: [] },
        { name: 'Alexia', data: [] },
        { name: 'Florence', data: [] },
        { name: 'Katherine', data: [] },
        { name: 'Martina', data: [] },
        { name: 'Stephanie', data: [] }
      ];

      this.series1 = _.cloneDeep(series);
      this.series2 = _.cloneDeep(series);
      this.series3 = _.cloneDeep(series);
    }
    this.handleDemoinit(this.chartType);
  }
  handleVideoUrl(url: string) {
    let finalUrl = '';
    finalUrl = url;
    if (finalUrl.indexOf('?') > -1) {
      finalUrl += '&autoplay=1&mute=1';
    } else {
      finalUrl += '?autoplay=1&mute=1';
    }
    return finalUrl;
  }
  handleDemoColor(hr) {
    let colorIdx = 0;
    if (hr <= 114) {
      colorIdx = 0;
    } else if (hr <= 133) {
      colorIdx = 1;
    } else if (hr <= 152) {
      colorIdx = 2;
    } else if (hr <= 171) {
      colorIdx = 3;
    } else if (hr < 190) {
      colorIdx = 4;
    } else {
      colorIdx = 5;
    }
    return colorIdx;
  }
  display(msg) {
    let sum = 0;
    this.heartValues = [];
    if (typeof msg === 'string') {
      this.serverMessages = JSON.parse(
        msg.replace(/u'(?=[^:]+')/g, "'").replace(/'/g, '"')
      );
      const chartDatas = this.serverMessages.classMemberDataFieldValue;
      const fields = this.serverMessages.classMemberDataField;
      const heartIdx = fields.findIndex(_field => _field === '129');
      const snIdx = fields.findIndex(_field => _field === 'equipmentSN');
      const zoneIdx = fields.findIndex(_field => _field === '133');
      let speedIdx = '';
      let cadenceIdx = '';
      let calorieIdx = '';
      if (this.classType === '1' || this.classType === '5') {
        calorieIdx = fields.findIndex(_field => _field === '289');
      }
      if (this.classType === '2') {
        speedIdx = fields.findIndex(_field => _field === '113');
        cadenceIdx = fields.findIndex(_field => _field === '161');
      }
      if (this.userInfos.length === 0) {
        const equipSnDatas = chartDatas.map(_data => {
          return _data[snIdx];
        });
        this.handleSNInfo(equipSnDatas);
      } else {
        this.heartValues = chartDatas.map((_data, idx) => {
          const liveHr = +_data[heartIdx];
          const colorIdx = _data[zoneIdx];
          const cadence = +_data[cadenceIdx] || 0;
          const speed = +_data[speedIdx] || 0;
          const calorie = +_data[calorieIdx] || 0;
          const time = moment().unix() * 1000;
          if (this.chartType === 0) {
            this.chart.series[idx].addPoint([time, liveHr], true, false, 1000);
            sum += liveHr;
          } else if (this.chartType === 1) {
            this.chart.series[idx].addPoint([time, calorie], true, false, 1000);
            sum += calorie;
          } else {
            this.chart.series[idx].addPoint(
              [time, colorIdx],
              true,
              false,
              1000
            );
            sum += colorIdx;
          }
          this.series1[idx].data.push([time, +liveHr]);
          this.series2[idx].data.push([time, +calorie]);
          this.series3[idx].data.push([time, +colorIdx]);
          return {
            liveHr,
            cadence,
            speed,
            calorie,
            userName: this.userInfos[_data[snIdx]].userName,
            colorIdx,
            userIcon: this.userInfos[_data[snIdx]].userIcon,
            imgClassName: this.userInfos[_data[snIdx]].imgClassName
          };
        });
      }
      this.currentMemberNum = chartDatas.length;
    } else {
      if (msg.classStatus === '2') {
        clearInterval(this.socketTimer);
        this.socket$.unsubscribe();
        this.isLoading = false;
        if (!(this.classId === '99999' && this.isDemoMode)) {
          this.isClassEnd = true;
        }
      }
    }
    this.handleSortCard(this.sortType, this.isCardDesc);
    this.meanValue = Math.round(sum / this.currentMemberNum);
  }
  handleSNInfo(snDatas: any) {
    const body = { token: this.token, pairEquipmentSN: snDatas };
    this.coachService.fetchFitPairInfo(body).subscribe(res => {
      const datas = res.info.deviceInfo;
      const series = [];
      this.series1 = [];
      this.series2 = [];
      this.series3 = [];
      let userIcon = '';
      let userName = '';
      let pairEquipmentSN = '';
      const infos = snDatas.map(_snData => {
        const existIdx = datas.findIndex(
          _data => _data.pairEquipmentSN === _snData
        );
        if (existIdx > -1) {
          userName = datas[existIdx].userName;
          pairEquipmentSN = datas[existIdx].pairEquipmentSN;
        } else {
          userName = _snData.slice(_snData.length - 3, _snData.length);
          pairEquipmentSN = _snData;
        }
        series.push({ name: userName, data: [] });
        this.series1.push({ name: userName, data: [] });
        this.series2.push({ name: userName, data: [] });
        this.series3.push({ name: userName, data: [] });
        userIcon =
          datas[existIdx] && datas[existIdx].pairIcon.length > 0
            ? this.utils.buildBase64ImgString(datas[existIdx].pairIcon)
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
        chart: {
          height: 250
        },
        exporting: {
          enabled: false
        },
        rangeSelector: {
          inputEnabled: false,
          enabled: false
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: {
            millisecond: '%H:%M:%S.%L',
            second: '%H:%M:%S',
            minute: '%H:%M:%S',
            hour: '%H:%M:%S',
            day: '%H:%M:%S',
            week: '%H:%M:%S',
            month: '%H:%M:%S',
            year: '%H:%M:%S'
          }
        },
        series
      };
      this.initHChart(hrOptions);
      this.isLoading = false;
      this.userInfos = _.keyBy(infos, keyName =>
        keyName.pairEquipmentSN.trim()
      );
    });
  }
  getDemoData(type) {
    let coachLiveHr = 100;

    this.demoMaker = setInterval(() => {
      this.heartValues = this.demoData; // 利用demoData 紀錄照原本順序的最新狀態資料
      let sum = 0;
      this.heartValues = this.heartValues.map((_demoData, idx) => {
        if (idx === 0) {
          if (_demoData.liveHr >= 190) {
            _demoData.liveHr =
              _demoData.liveHr + (Math.floor(Math.random() * 5) - 1) - 7;
          } else if (_demoData.liveHr <= 80) {
            _demoData.liveHr =
              _demoData.liveHr + (Math.floor(Math.random() * 5) - 1) + 5;
          } else {
            _demoData.liveHr =
              _demoData.liveHr + (Math.floor(Math.random() * 5) - 1);
          }
          coachLiveHr = _demoData.liveHr;

          _demoData.calorie =
            _demoData.calorie + (Math.floor(Math.random() * 3) + 1);
        }
        if (idx === 1) {
          _demoData.liveHr =
            coachLiveHr +
            Math.round(1 * (Math.floor(Math.random() * 8.98) - 3.99));
          _demoData.calorie =
            _demoData.calorie + (Math.floor(Math.random() * 3) + 1);
        }
        if (idx === 2) {
          _demoData.liveHr =
            coachLiveHr +
            Math.round(2 * (Math.floor(Math.random() * 7.98) - 2.99));
          _demoData.calorie =
            _demoData.calorie + (Math.floor(Math.random() * 3) + 1);
        }
        if (idx === 3) {
          _demoData.liveHr =
            coachLiveHr +
            Math.round(5 * (Math.floor(Math.random() * 6.98) - 1.99));
          _demoData.calorie =
            _demoData.calorie + (Math.floor(Math.random() * 3) + 1);
        }
        if (idx === 4) {
          _demoData.liveHr =
            coachLiveHr +
            Math.round(6 * (Math.floor(Math.random() * 6.98) - 2.99));
          _demoData.calorie =
            _demoData.calorie + (Math.floor(Math.random() * 3) + 1);
        }
        if (idx === 5) {
          _demoData.liveHr =
            coachLiveHr +
            Math.round(3 * (Math.floor(Math.random() * 9.98) - 5.99));
          _demoData.calorie =
            _demoData.calorie + (Math.floor(Math.random() * 3) + 1);
        }
        _demoData.colorIdx = this.handleDemoColor(_demoData.liveHr);

        const time = moment().unix() * 1000;
        if (type === 0) {
          this.chart.series[idx].addPoint(
            [time, _demoData.liveHr],
            true,
            false,
            1000
          );
          sum += _demoData.liveHr;
        } else if (type === 1) {
          this.chart.series[idx].addPoint(
            [time, _demoData.calorie],
            true,
            false,
            1000
          );
          sum += _demoData.calorie;
        } else {
          this.chart.series[idx].addPoint(
            [time, _demoData.colorIdx],
            true,
            false,
            1000
          );
          sum += _demoData.colorIdx;
        }
        this.series1[idx].data.push([time, _demoData.liveHr]);
        this.series2[idx].data.push([time, _demoData.calorie]);
        this.series3[idx].data.push([time, _demoData.colorIdx]);

        return _demoData;
      });
      this.handleSortCard(this.sortType, this.isCardDesc);
      this.meanValue = Math.round(sum / this.currentMemberNum);
    }, 5000);
  }
  handleSortCard(sortType, status) {
    this.isCardDesc = status;
    this.sortType = sortType;
    if (!this.isCardDesc) {
      if (this.sortType === 0) {
        this.heartValues = this.heartValues.sort((a, b) => a.liveHr - b.liveHr);
      } else if (this.sortType === 1) {
        this.heartValues = this.heartValues.sort(
          (a, b) => a.calorie - b.calorie
        );
      } else {
        this.heartValues = this.heartValues.sort(
          (a, b) => a.colorIdx - b.colorIdx
        );
      }
    } else {
      if (this.sortType === 0) {
        this.heartValues = this.heartValues.sort((a, b) => b.liveHr - a.liveHr);
      } else if (this.sortType === 1) {
        this.heartValues = this.heartValues.sort(
          (a, b) => b.calorie - a.calorie
        );
      } else {
        this.heartValues = this.heartValues.sort(
          (a, b) => b.colorIdx - a.colorIdx
        );
      }
    }
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
    clearInterval(this.demoMaker);
  }
  removeSeries(type) {
    this.chartType = type;
    const seriesLength = this.chart.series.length;
    clearInterval(this.demoMaker);
    this.meanValue = 0;
    for (let i = seriesLength - 1; i > -1; i--) {
      this.chart.series[i].remove();
    }
    this.handleDemoinit(this.chartType);
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
    clearInterval(this.demoMaker);
  }
  handleLessonInfo(str) {
    this.totalLessonInfo = str.replace(/\r\n|\n/g, '').trim();
    if (this.totalLessonInfo.length > 118) {
      this.lessonInfo = this.totalLessonInfo.substring(0, 118);
      this.isLessonMoreDisplay = true;
    } else {
      this.lessonInfo = this.totalLessonInfo;
      this.isLessonMoreDisplay = false;
    }
  }
  handleCoachInfo(str) {
    this.totalCoachInfo = str.replace(/\r\n|\n/g, '').trim();
    if (this.totalCoachInfo.length > 118) {
      this.coachInfo = this.totalCoachInfo.substring(0, 118);
      this.isCoachMoreDisplay = true;
    } else {
      this.coachInfo = this.totalCoachInfo;
      this.isCoachMoreDisplay = false;
    }
  }
  handleExtendCoachInfo(type) {
    if (type === 1) {
      this.coachInfo = this.totalCoachInfo;
      this.isCoachMoreDisplay = false;
    } else {
      this.lessonInfo = this.totalLessonInfo;
      this.isLessonMoreDisplay = false;
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
      this.dispalyChartOptions[2] = false;
      this.dispalyMemberOptions[3] = false;
      this.displaySections[0] = true;
      this.displaySections[1] = true;
      this.displaySections[2] = true;
    }
  }
}
