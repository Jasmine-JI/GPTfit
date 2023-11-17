import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// 這邊無法使用index統一引入  https://github.com/ng-packagr/ng-packagr/issues/1173
import { AnalysisOptionComponent } from '../analysis-option/analysis-option.component';
import { SmallHrzoneChartComponent } from '../small-hrzone-chart/small-hrzone-chart.component';
import { TipDialogComponent } from '../tip-dialog/tip-dialog.component';
import { ProfessionalChartAnalysisOption } from '../../containers/professional/classes/professional-chart-analysis-option';
import { PersonalChartAnalysisOption } from '../../containers/personal/classes';
import { DataUnitType } from '../../core/enums/common';
import { SportType } from '../../core/enums/sports';
import {
  SpeedPaceUnitPipe,
  TimeFormatPipe,
  SportTimePipe,
  DistanceSibsPipe,
  SportPaceSibsPipe,
  WeightSibsPipe,
} from '../../core/pipes';
import { AnalysisSportsColumn } from '../../core/enums/sports/report-analysis.enum';
import { MatIconModule } from '@angular/material/icon';
import { DataDescription } from '../../core/models/compo';

@Component({
  selector: 'app-sports-data-table',
  templateUrl: './sports-data-table.component.html',
  styleUrls: ['./sports-data-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    AnalysisOptionComponent,
    SpeedPaceUnitPipe,
    TimeFormatPipe,
    SportTimePipe,
    DistanceSibsPipe,
    SportPaceSibsPipe,
    WeightSibsPipe,
    MatIconModule,
    SmallHrzoneChartComponent,
    TipDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportsDataTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tableTitleKey = '';
  @Input() isCompareMode = false;
  @Input() tableData: Array<any>;
  @Input() baseReportRange: Array<number>;
  @Input() compareReportRange: Array<number>;
  @Input() chartAnalysisOption: ProfessionalChartAnalysisOption | PersonalChartAnalysisOption;
  @Input() userUnit: DataUnitType = DataUnitType.metric;
  @Input() sportType: SportType = 99;
  @Input() description: Array<DataDescription>;

  private ngUnsubscribe = new Subject();
  private resizeEventSubscription = new Subscription();
  private pluralEventSubscription = new Subscription();

  readonly DataUnitType = DataUnitType;
  readonly SportType = SportType;
  readonly AnalysisSportsColumn = AnalysisSportsColumn;

  showFilterList = false;
  columnHeader: Map<string, boolean> = new Map();
  seeMore = false;
  sortType = 'dateRange';
  isAscending = true;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscribeResizeEvent();
  }

  ngOnChanges(e: SimpleChanges) {
    const { tableData } = e;
    if (tableData) this.createHeaderList(tableData.currentValue);
  }

  /**
   * 訂閱頁面大小變更事件
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeEventSubscription = resizeEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      const screenWidth = window.innerWidth;
      this.chartAnalysisOption.checkOverLimit(screenWidth);
      this.chartAnalysisOption.fillItem();
      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 取消訂閱頁面變更大小事件
   */
  unsubscribeResizeEvent() {
    if (this.resizeEventSubscription) this.resizeEventSubscription.unsubscribe();
  }

  /**
   * 建立表格標頭清單
   * @param tableData {any}-表格數據
   */
  createHeaderList(tableData: any) {
    for (const _key in tableData) {
      this.columnHeader.set(_key, false);
    }
  }

  /**
   * 顯示欄位篩選表單
   * @param e {MouseEvent}
   */
  showAnalysisOption(e: MouseEvent) {
    e.stopPropagation();
    const { showFilterList } = this;
    if (showFilterList) {
      this.unsubscribePluralEvent();
    } else {
      this.showFilterList = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 訂閱點擊與滾動事件
   */
  subscribePluralEvent() {
    const scrollElement = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(document, 'click');
    this.pluralEventSubscription = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.unsubscribePluralEvent();
      });
  }

  /**
   * 解除rxjs點擊與捲動的訂閱
   */
  unsubscribePluralEvent() {
    this.showFilterList = false;
    this.changeDetectorRef.markForCheck();
    if (this.pluralEventSubscription) this.pluralEventSubscription.unsubscribe();
  }

  /**
   * 看更多
   */
  seeMoreTable() {
    this.seeMore = true;
  }

  /**
   * 變更排序
   */
  changeSort(columnType: string) {
    const { sortType } = this;
    if (columnType === sortType) {
      this.isAscending = !this.isAscending;
    } else {
      this.sortType = columnType;
    }
  }

  /**
   * 群組分析之群組篩選與欄位設定變更，依設定顯示項目
   * @param e {ProfessionalChartAnalysisOption | PersonalChartAnalysisOption}-群組篩選與欄位設定
   * @author kidin-1110331
   */
  optionChange(e: ProfessionalChartAnalysisOption | PersonalChartAnalysisOption) {
    this.chartAnalysisOption = e;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 將基準數據與比較數據比對是否進步
   * @param index {string}-數據索引
   * @param key {string}-欲比較的數據
   */
  checkProgressive(index: string, key: string) {
    const [base, compare] = this.tableData[index];
    // console.log('checkProgressive', this.tableData[index]);

    if (this.isCompareMode && compare) {
      const baseData = base[key] ?? 0;
      const compareData = compare[key];
      return baseData - compareData;
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.unsubscribePluralEvent();
    this.unsubscribeResizeEvent();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
