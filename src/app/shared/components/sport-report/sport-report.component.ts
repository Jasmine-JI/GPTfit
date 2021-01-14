import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import * as _Highcharts from 'highcharts';
import { ReportService } from '../../services/report.service';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-sport-report',
  templateUrl: './sport-report.component.html',
  styleUrls: ['./sport-report.component.scss']
})
export class SportReportComponent implements OnInit, OnDestroy {

  @Output() showPrivacyUi = new EventEmitter();

  isPreviewMode = false;

  constructor(
    private reportService: ReportService
  ) {}

  ngOnInit() {
    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
  }

  // 將隱私權pass給父組件-kidin-1090205
  emitPrivacy (e) {
    this.showPrivacyUi.emit(e);
  }

  ngOnDestroy () {}

}
