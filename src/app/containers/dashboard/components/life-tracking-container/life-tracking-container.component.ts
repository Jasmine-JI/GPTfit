import {
  Component,
  OnInit,
  Renderer2,
  ViewEncapsulation
} from '@angular/core';
import { LifeTrackingService } from '../../services/life-tracking.service';
import { UtilsService } from '@shared/services/utils.service';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { Router } from '@angular/router';
import { MatDatepickerInputEvent } from '@angular/material';
import { HashIdService } from '@shared/services/hash-id.service';
import * as moment from 'moment';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as _ from 'lodash';

const highcharts: any = _.cloneDeep(_Highcharts); // 不檢查highchart型態
let Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-life-tracking-container',
  templateUrl: './life-tracking-container.component.html',
  styleUrls: [
    './life-tracking-container.component.scss',
    '../../../../shared/components/activity-info/activity-info.component.css'
  ],
  encapsulation: ViewEncapsulation.None
})
export class LifeTrackingContainerComponent implements OnInit {
  lifeTrackingData: any;
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
    thick: false
  };
  isShowNoRight = false;
  isLoading = false;
  progressRef: NgProgressRef;
  isFileIDNotExist = false;


  filterStartTime = moment().format('YYYY-MM-DDT00:00:00.000+08:00');
  filterEndTime = moment().format('YYYY-MM-DDT23:59:59.000+08:00');

  isShowChart = true;
  chartTargets: any;
  constructor(
    private lifeTrackingService: LifeTrackingService,
    private utils: UtilsService,
    private ngProgress: NgProgress,
    private hashIdService: HashIdService,
    private router: Router,
    private renderer: Renderer2
  ) {
  }

  ngOnInit() {
    this.progressRef = this.ngProgress.ref();
    this.fetchTrackingDayDetail();
  }
  fetchTrackingDayDetail() {
    const body = {
      token: this.utils.getToken(),
      filterStartTime: this.filterStartTime,
      filterEndTime: this.filterEndTime
    };
    this.progressRef.start();
    this.isLoading = true;
    this.lifeTrackingService.getTrackingDayDetail(body).subscribe(res => {
      if (res.resultCode === 402) {
        this.isShowNoRight = true;
        this.isLoading = false;
        this.progressRef.complete();
        return;
      }
      if (res.resultCode === 401 || res.resultCode === 400) {
        this.isFileIDNotExist = true;
        return this.router.navigateByUrl('/404');
      }
      this.progressRef.complete();
      this.isLoading = false;
      this.lifeTrackingData = res;

    });
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
      _option[
        chartTargets[idx]
      ].xAxis.events.setExtremes = this.syncExtremes.bind(
        this,
        idx,
        finalDatas
      );
      this.charts[idx] = chart(
        this[chartTargets[idx]].nativeElement,
        _option[chartTargets[idx]]
      );
    });
    this.isInitialChartDone = true;

    // this.renderer.listen(this.container.nativeElement, 'mousemove', e =>
    //   this.handleSynchronizedPoint(e, finalDatas)
    // );
    // this.renderer.listen(this.container.nativeElement, 'touchmove', e =>
    //   this.handleSynchronizedPoint(e, finalDatas)
    // );
    // this.renderer.listen(this.container.nativeElement, 'touchstart', e =>
    //   this.handleSynchronizedPoint(e, finalDatas)
    // );
  }
  syncExtremes(num, finalDatas, e) {
    // 調整縮放會同步
    const thisChart = this.charts[num];
    if (e.trigger !== 'syncExtremes') {
      Highcharts.each(Highcharts.charts, function(_chart, idx) {
        if (_chart !== thisChart && _chart && finalDatas[idx].isSyncExtremes) {
          if (_chart.xAxis[0].setExtremes) {
            _chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
              trigger: 'syncExtremes'
            });
          }
        }
      });
    }
  }
  handleDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    this.filterStartTime = moment($event.value).format(
      'YYYY-MM-DDTHH:mm:00.000+08:00'
    );
    this.filterEndTime = moment($event.value).format(
      'YYYY-MM-DDT23:59:00.000+08:00'
    );
  }
}
