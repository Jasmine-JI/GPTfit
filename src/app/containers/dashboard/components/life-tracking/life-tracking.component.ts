import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { LifeTrackingService } from '../../services/life-tracking.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { Router } from '@angular/router';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import dayjs, { Dayjs } from 'dayjs';
import { chart, charts, each } from 'highcharts';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-life-tracking',
  templateUrl: './life-tracking.component.html',
  styleUrls: ['./life-tracking.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LifeTrackingComponent implements OnInit, OnDestroy {
  _options = {
    min: 8,
    max: 100,
    ease: 'linear',
    speed: 200,
    trickleSpeed: 400,
    meteor: true,
    spinner: true,
    spinnerPosition: 'right',
    direction: 'ltr+',
    color: '#108bcd',
    thick: false,
  };
  isShowNoRight = false;
  isLoading = false;
  progressRef: NgProgressRef;
  isFileIDNotExist = false;
  fileInfo: any;
  userLink = {
    userName: '',
    userId: null,
  };
  infoDate: string;
  syncDate: string;
  editDate: string;
  lifeTrackingDayLayer: any;
  lifeTrackingPoints: any;
  finalDatas: any;
  charts = [];
  isInitialChartDone = false;

  @ViewChild('container', { static: false })
  container: ElementRef;
  @ViewChild('activityChartTarget', { static: false })
  activityChartTarget: ElementRef;
  @ViewChild('airPressureChartTarget', { static: false })
  airPressureChartTarget: ElementRef;
  @ViewChild('elevChartTarget', { static: false })
  elevChartTarget: ElementRef;
  @ViewChild('heartRateChartTarget', { static: false })
  heartRateChartTarget: ElementRef;
  @ViewChild('stressChartTarget', { static: false })
  stressChartTarget: ElementRef;
  @ViewChild('tempChartTarget', { static: false })
  tempChartTarget: ElementRef;
  @ViewChild('totalActivityCaloriesChartTarget', { static: false })
  totalActivityCaloriesChartTarget: ElementRef;
  @ViewChild('totalDistanceMetersChartTarget', { static: false })
  totalDistanceMetersChartTarget: ElementRef;
  @ViewChild('totalElevGainChartTarget', { static: false })
  totalElevGainChartTarget: ElementRef;
  @ViewChild('totalElevLossChartTarget', { static: false })
  totalElevLossChartTarget: ElementRef;
  @ViewChild('totalLifeCaloriesChartTarget', { static: false })
  totalLifeCaloriesChartTarget: ElementRef;
  @ViewChild('totalStepChartTarget', { static: false })
  totalStepChartTarget: ElementRef;
  @ViewChild('wearingStatusChartTarget', { static: false })
  wearingStatusChartTarget: ElementRef;
  @ViewChild('walkElevGainChartTarget', { static: false })
  walkElevGainChartTarget: ElementRef;
  @ViewChild('walkElevLossChartTarget', { static: false })
  walkElevLossChartTarget: ElementRef;
  @ViewChild('localPressureChartTarget', { static: false })
  localPressureChartTarget: ElementRef;

  isactivityChartTargetDisplay = false;
  isairPressureChartTargetDisplay = false;
  iselevChartTargetDisplay = false;
  isheartRateChartTargetDisplay = false;
  isstressChartTargetDisplay = false;
  istempChartTargetDisplay = false;
  istotalActivityCaloriesChartTargetDisplay = false;
  istotalDistanceMetersChartTargetDisplay = false;
  istotalElevGainChartTargetDisplay = false;
  istotalElevLossChartTargetDisplay = false;
  istotalLifeCaloriesChartTargetDisplay = false;
  istotalStepChartTargetDisplay = false;
  iswearingStatusChartTargetDisplay = false;
  iswalkElevGainChartTargetDisplay = false;
  iswalkElevLossChartTargetDisplay = false;
  islocalPressureChartTargetDisplay = false;

  filterStartTime = dayjs().format('YYYY-MM-DDT00:00:00.000+08:00');
  filterEndTime = dayjs().format('YYYY-MM-DDT00:00:00.000+08:00');
  /**
   * 此搜尋時間在轉換為GMT之後，搜尋到的生活追蹤資料會變成兩天
   */
  //filterEndTime = dayjs().format('YYYY-MM-DDT23:59:59.000+08:00');

  isShowChart = true;
  chartTargets: any;
  targetUserId = '';
  targetUserName = '';
  constructor(
    private lifeTrackingService: LifeTrackingService,
    private utils: UtilsService,
    private ngProgress: NgProgress,
    private hashIdService: HashIdService,
    private router: Router,
    private renderer: Renderer2,
    public dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.progressRef = this.ngProgress.ref();
    this.fetchTrackingDayDetail();
  }

  openSelectorWin(e) {
    const adminLists = [];
    e.preventDefault();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `人員選擇`,
        adminLists,
        type: 1,
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: true,
      },
    });
  }

  handleConfirm(type, _lists) {
    const userIds = _lists.map((_list) => _list.userId);
    const userNames = _lists.map((_list) => _list.userName);

    this.targetUserId = userIds[0].toString();
    this.targetUserName = userNames[0];
  }

  removeLabel(idx) {
    this.targetUserId = '';
    this.targetUserName = '';
  }

  fetchTrackingDayDetail() {
    const body = {
      token: this.authService.token,
      targetUserId: (this.targetUserId && this.targetUserId.toString()) || '',
      filterStartTime: this.filterStartTime,
      filterEndTime: this.filterEndTime,
    };

    this.progressRef.start();
    this.lifeTrackingService.getTrackingDayDetail(body).subscribe((res) => {
      if (res.resultCode === 401 || res.resultCode === 402) {
        this.isShowNoRight = true;
        this.isLoading = false;
        this.progressRef.complete();
        return;
      } else if (res.resultCode === 400) {
        this.isFileIDNotExist = true;
        return this.router.navigateByUrl('/404');
      }

      this.fileInfo = res['trackingData'][0]['fileInfo'];
      this.lifeTrackingDayLayer = res['trackingData'][0]['lifeTrackingDayLayer'];
      if (!this.utils.isObjectEmpty(this.fileInfo)) {
        if (this.fileInfo.author.indexOf('?') > -1) {
          // 防止後續author會帶更多參數，先不寫死
          this.userLink.userName = this.fileInfo.author.split('?')[0];
          this.userLink.userId = this.fileInfo.author.split('?')[1].split('=')[1].replace(')', '');
        }

        this.syncDate = dayjs(this.fileInfo.syncDate).format('YYYY-MM-DD HH:mm:SS');
        this.editDate = dayjs(this.fileInfo.syncDate).format('YYYY-MM-DD HH:mm:SS');
        this.infoDate = this.handleDate(this.fileInfo.creationDate);
      }

      this.lifeTrackingPoints = res['trackingData'][0]['lifeTrackingPointLayer'];
      if (this.lifeTrackingPoints && this.lifeTrackingPoints.length > 0) {
        this.isShowChart = true;
        this.initHchart();
      } else {
        this.isShowChart = false;
      }

      this.progressRef.complete();
      this.isLoading = false;
    });
  }

  goToProfile() {
    this.router.navigateByUrl(
      `/user-profile/${this.hashIdService.handleUserIdEncode(this.userLink.userId)}`
    );
  }

  handleDate(dateStr) {
    const arr = dateStr.split('T');
    const dateArr = arr[0].split('');
    let time = '';
    if (arr[1].indexOf('.') > -1) {
      time = arr[1].split('.')[0];
    } else {
      time = arr[1].split('+')[0];
    }
    const date =
      dateArr[0] +
      dateArr[1] +
      dateArr[2] +
      dateArr[3] +
      '/' +
      dateArr[5] +
      dateArr[6] +
      '/' +
      dateArr[8] +
      dateArr[9] +
      ' @ ' +
      time;
    return date;
  }

  handleSynchronizedPoint(e, finalDatas) {
    // Do something with 'event'
    for (let i = 0; i < charts.length; i = i + 1) {
      const _chart: any = charts[i];
      if (_chart !== undefined) {
        if (charts.length !== finalDatas.length) {
          if (finalDatas[i - (charts.length - finalDatas.length)].isSyncExtremes) {
            const event = _chart.pointer.normalize(e); // Find coordinates within the chart
            const point = _chart.series[0].searchPoint(event, true); // Get the hovered point
            if (point && point.index) {
              point.highlight(e);
            }
          }
        } else {
          if (finalDatas[i].isSyncExtremes) {
            const event = _chart.pointer.normalize(e); // Find coordinates within the chart
            const point = _chart.series[0].searchPoint(event, true); // Get the hovered point
            if (point && point.index) {
              point.highlight(e);
            }
          }
        }
      }
    }
  }

  initHchart() {
    const { finalDatas, chartTargets } = this.lifeTrackingService.handlePoints(
      this.lifeTrackingPoints,
      86400 / +this.lifeTrackingDayLayer.totalPoint
    );

    this.chartTargets = chartTargets;
    this.finalDatas = finalDatas;

    this.finalDatas.forEach((_option, idx) => {
      this[`is${chartTargets[idx]}Display`] = true;
      _option[chartTargets[idx]].xAxis.events.setExtremes = this.syncExtremes.bind(
        this,
        idx,
        finalDatas
      );
      this.charts[idx] = chart(this[chartTargets[idx]].nativeElement, _option[chartTargets[idx]]);
    });
    this.isInitialChartDone = true;

    this.renderer.listen(this.container.nativeElement, 'mousemove', (e) =>
      this.handleSynchronizedPoint(e, finalDatas)
    );

    this.renderer.listen(this.container.nativeElement, 'touchmove', (e) =>
      this.handleSynchronizedPoint(e, finalDatas)
    );

    this.renderer.listen(this.container.nativeElement, 'touchstart', (e) =>
      this.handleSynchronizedPoint(e, finalDatas)
    );
  }

  syncExtremes(num, finalDatas, e) {
    // 調整縮放會同步
    const thisChart = this.charts[num];
    if (e.trigger !== 'syncExtremes') {
      each(charts, function (_chart, idx) {
        if (charts.length !== finalDatas.length) {
          if (
            _chart !== thisChart &&
            _chart &&
            finalDatas[idx - (charts.length - finalDatas.length)].isSyncExtremes
          ) {
            if (_chart.xAxis[0].setExtremes) {
              _chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
                trigger: 'syncExtremes',
              });
            }
          }
        } else {
          if (_chart !== thisChart && _chart && finalDatas[idx].isSyncExtremes) {
            if (_chart.xAxis[0].setExtremes) {
              _chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
                trigger: 'syncExtremes',
              });
            }
          }
        }
      });
    }
  }

  handleDateChange($event: MatDatepickerInputEvent<Dayjs>) {
    this.filterStartTime = dayjs($event.value).format('YYYY-MM-DDTHH:mm:00.000+08:00');
    this.filterEndTime = dayjs($event.value).format('YYYY-MM-DDT00:00:00.000+08:00');
  }

  ngOnDestroy() {
    if (!this.isShowNoRight && !this.isFileIDNotExist) {
      charts.forEach((_highChart, idx) => {
        if (_highChart !== undefined) {
          _highChart.destroy();
        }
      });
    }
  }
}
