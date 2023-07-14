import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import {
  SportTimePipe,
  SportPaceSibsPipe,
  SpeedPaceUnitPipe,
  SpeedSibsPipe,
  WeightSibsPipe,
  DistanceSibsPipe,
  TimeRangeStringPipe,
  SwimPosturePipe,
  DataTypeUnitPipe,
} from '../../../../../core/pipes';
import { SportType } from '../../../../../core/enums/sports';
import { DataUnitType } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import {
  mathRounding,
  transformDistance,
  speedToPaceSecond,
  paceSecondTimeFormat,
  getPaceUnit,
  deepCopy,
} from '../../../../../core/utils';
import { mi } from '../../../../../core/models/const';

/**
 * 分段中單一欄位數據所需資訊
 */
interface ValueContext {
  value: number | string;
  unit?: string;
  diffValue?: number | string;
  isPositiveDiff?: boolean;
  displayDiff?: boolean; // 用來對齊基準與比較分段列表
}

@Component({
  selector: 'app-lap-info-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SportTimePipe,
    SportPaceSibsPipe,
    SpeedPaceUnitPipe,
    SpeedSibsPipe,
    DistanceSibsPipe,
    SwimPosturePipe,
    DataTypeUnitPipe,
    TimeRangeStringPipe,
    WeightSibsPipe,
  ],
  templateUrl: './lap-info-table.component.html',
  styleUrls: ['./lap-info-table.component.scss'],
})
export class LapInfoTableComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * 用來解除rxjs訂閱
   */
  private _ngUnsubscribe = new Subject();

  private _clickEventSubscription = new Subscription();

  /**
   * 是否為基準檔案
   */
  @Input() isBaseFile = true;

  /**
   * 檔案運動類型
   */
  @Input() sportsType: SportType;

  /**
   * 基準運動檔案分段資訊
   */
  @Input() activityLap: Array<any> = [];

  /**
   * 另一個運動檔案分段資訊
   */
  @Input() compareActivityLap: Array<any>;

  /**
   * 基準檔案篩去休息的分段資訊
   */
  lapData: Array<any> = [];

  /**
   * 比較檔案篩去休息的分段資訊
   */
  compareLapData?: Array<any>;

  /**
   * 基準各分段間差值或與比較檔案各分段之差值
   */
  diffLapData?: Map<string, Array<number>>;

  /**
   * 用來快速取得指定數據於陣列中的序列位置
   */
  dataIndex: { [key: string]: number } = {};

  /**
   * 瀏覽器寬度
   */
  screenSize = window.innerWidth;

  /**
   * 顯示欄位
   */
  displayColumn: Array<string> = [];

  /**
   * 顯示欄位選單與否
   */
  displayColumnMenu: number | null = null;

  readonly SportType = SportType;
  readonly DataUnitType = DataUnitType;

  constructor(private userService: UserService) {}

  /**
   * 取得使用者使用單位
   */
  get userUnit() {
    return this.userService.getUser().unit;
  }
  /**
   * 取得用來判斷顯示的單位參數
   */
  get unitContext() {
    const { sportsType, userUnit } = this;
    return { sportsType, unitType: userUnit };
  }

  /**
   * 取得是否顯示為速度類型
   */
  get isPaceType() {
    return this.includeSportsType([SportType.run, SportType.swim, SportType.row]);
  }

  /**
   * 跑步有效數值鍵名
   */
  private getEffectKey() {
    const keyList = {
      [SportType.run]: [
        'lapTotalSecond',
        'lapAvgHeartRateBpm',
        'lapAvgSpeed',
        'lapTotalDistanceMeters',
        'lapRunAvgCadence',
        'lapElevGain',
        'lapElevLoss',
      ],
      [SportType.cycle]: [
        'lapTotalSecond',
        'lapAvgHeartRateBpm',
        'lapAvgSpeed',
        'lapTotalDistanceMeters',
        'lapCycleAvgWatt',
        'lapCycleAvgCadence',
        'lapElevGain',
        'lapElevLoss',
      ],
      [SportType.weightTrain]: [
        'lapTotalSecond',
        'setTotalReps',
        'setOneRepMax',
        'setTotalWeightKg',
        'setAvgWeightKg',
        'lapAvgHeartRateBpm',
        'setMoveRepetitionsAvgCadence',
      ],
      [SportType.swim]: [
        'lapTotalSecond',
        'lapAvgHeartRateBpm',
        'lapAvgSpeed',
        'lapTotalDistanceMeters',
        'lapSwimAvgCadence',
        'lapTotalStrokes',
        'lapSwolf',
      ],
      [SportType.aerobic]: ['lapTotalSecond', 'lapAvgHeartRateBpm'],
      [SportType.row]: [
        'lapTotalSecond',
        'lapAvgHeartRateBpm',
        'lapAvgSpeed',
        'lapTotalDistanceMeters',
        'lapRowingAvgWatt',
        'lapRowingAvgCadence',
      ],
      [SportType.ball]: [
        'lapTotalSecond',
        'lapAvgHeartRateBpm',
        'lapAvgSpeed',
        'lapTotalDistanceMeters',
        'totalSwingCount',
      ],
    };

    return keyList[this.sportsType] ?? keyList[SportType.aerobic];
  }

  ngOnInit(): void {
    this.subscribeResizeEvent();
  }

  /**
   * 建立數據索引和取得相差數據
   */
  ngOnChanges(e: SimpleChanges): void {
    const { activityLap, compareActivityLap } = e;
    if (this.sportsType) this.getDefaultDisplayColumn();
    if (activityLap) this.handleLapData();
    if (compareActivityLap) this.handleCompareLapData();
  }

  /**
   * 訂閱螢幕寬度變更事件
   */
  subscribeResizeEvent() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(100), takeUntil(this._ngUnsubscribe))
      .subscribe(() => {
        this.screenSize = window.innerWidth;
        this.changeColumnNumber();
      });
  }

  /**
   * 根據頁面寬度變更現在的欄位數目
   */
  changeColumnNumber() {
    const columnNumber = this.getColumnNumber();
    const currentLength = this.displayColumn.length;
    if (currentLength < columnNumber) {
      const set = new Set(this.displayColumn);
      this.getEffectKey().forEach((_key) => {
        set.add(_key);
      });

      this.displayColumn = Array.from(set);
    } else if (currentLength > columnNumber) {
      this.displayColumn = this.displayColumn.slice(0, columnNumber);
    }
  }

  /**
   * 取得現在頁面寬度可顯示的欄位數
   */
  getColumnNumber() {
    const columWidth = 80;
    const lapColumnWidth = 60;
    const minPadding = 20;
    const { screenSize } = this;
    return Math.floor((screenSize - minPadding - lapColumnWidth) / columWidth);
  }

  /**
   * 根據頁面寬度和運動類別，設定預設顯示欄位
   */
  getDefaultDisplayColumn() {
    const columnNumber = this.getColumnNumber();
    this.displayColumn = this.getEffectKey().slice(0, columnNumber);
  }

  /**
   * 處理基礎分段數據及取得所需的數據索引
   */
  handleLapData() {
    const { activityLap } = this;
    this.dataIndex = this.getDataIndex(activityLap);
    this.lapData = this.filterRestLap(activityLap);
  }

  /**
   * 篩去休息分段
   * @param lap 運動檔案分段
   */
  filterRestLap(lap: Array<any>) {
    const typeIndex = (lap[0] as Array<string>).findIndex((_key) => _key === 'type');
    return lap.filter((_lap, _index) => {
      if (_index === 0) return true; // 保留鍵名陣列
      return +_lap[typeIndex] !== 1;
    });
  }

  /**
   * 取得所需的數據索引
   * @param lap 分段資訊
   */
  getDataIndex(lap: Array<any>) {
    let result = {};
    lap[0].forEach((_key, _index) => {
      result = { ...result, [_key]: _index };
    });

    return result;
  }

  /**
   * 處理比較分段數據
   */
  handleCompareLapData() {
    const { compareActivityLap } = this;
    if (!compareActivityLap) {
      this.handleLapData(); // 將基準分段還原原長度
      this.compareLapData = undefined;
      this.diffLapData = this.countLapDiff(this.lapData);
    } else {
      this.compareLapData = this.filterRestLap(compareActivityLap);
      this.handleComparison();
    }
  }

  /**
   * 處理比較模式所需資料
   * 1. 對齊兩邊數據長度
   * 2. 取得比較數據
   */
  handleComparison() {
    this.compareLapData = this.filterRestLap(this.compareActivityLap);
    const { lapData, compareLapData } = this;
    const baseLapLength = lapData.length;
    const compareLapLength = compareLapData.length;
    const diffLength = Math.abs(compareLapLength - baseLapLength);
    const fillArr = new Array(diffLength).fill([]);
    if (baseLapLength < compareLapLength) {
      this.lapData = this.lapData.concat(fillArr);
    } else {
      this.compareLapData = this.compareLapData.concat(fillArr);
    }

    this.diffLapData = this.countCompareDiff(this.lapData, this.compareLapData);
  }

  /**
   * 計算基準分段間的差值
   * @param baseLap 基準檔案分段數據
   */
  countLapDiff(baseLap: Array<any>) {
    const effectKey = this.getEffectKey();
    const result: Map<string, Array<number>> = new Map(effectKey.map((_key) => [_key, []]));
    const { dataIndex } = this;
    baseLap.forEach((_baseLap, _index) => {
      if (_index <= 1) return;
      effectKey.forEach((_key) => {
        const _valIndex = dataIndex[_key];
        const _baseVal = _baseLap ? _baseLap[_valIndex] ?? 0 : 0;
        const _prevLap = baseLap[_index - 1];
        const _prevVal = _prevLap[_valIndex] ?? 0;
        const diffValue = mathRounding(_baseVal - _prevVal, 2);
        result.get(_key)?.push(diffValue); // 不用重set(call by reference)
      });
    });

    return result;
  }

  /**
   * 計算基準分段與比較分段的差值
   * @param baseLap 基準檔案分段數據
   * @param compareLap 比較檔案分段數據
   */
  countCompareDiff(baseLap: Array<any>, compareLap: Array<any>) {
    const effectKey = this.getEffectKey();
    const result: Map<string, Array<number>> = new Map(effectKey.map((_key) => [_key, []]));
    const { dataIndex } = this;
    baseLap.forEach((_baseLap, _index) => {
      if (_index === 0) return;
      effectKey.forEach((_key) => {
        const _valIndex = dataIndex[_key];
        const _baseVal = _baseLap ? _baseLap[_valIndex] ?? 0 : 0;
        const _compareLap = compareLap[_index];
        const _compareVal = _compareLap ? _compareLap[_valIndex] ?? 0 : 0;
        const diffValue = mathRounding(_baseVal - _compareVal, 2);
        result.get('_key')?.push(diffValue); // 不用重set(call by reference)
      });
    });

    return result;
  }

  /**
   * 包含或排除部份運動類別
   * @param typeList 欲包含的運動類別
   */
  includeSportsType(typeList: Array<SportType>) {
    return typeList.includes(this.sportsType);
  }

  /**
   * 顯示數據類別選單
   * @param e 點擊事件
   * @param index 點擊的欄位類別目前索引位置
   */
  openColumnMenu(e: MouseEvent, index: number) {
    e.stopPropagation();
    const { displayColumnMenu } = this;
    if (index === displayColumnMenu) {
      this.closeColumnMenu();
    } else {
      this.displayColumnMenu = index;
      if (displayColumnMenu === null) this.subscribeClickEvent();
    }
  }

  /**
   * 關閉數據類別選單
   */
  closeColumnMenu() {
    this.displayColumnMenu = null;
    if (this._clickEventSubscription) this._clickEventSubscription.unsubscribe();
  }

  /**
   * 訂閱點擊事件，點擊他處則關閉選單
   */
  subscribeClickEvent() {
    const clickEvent = fromEvent(window, 'click');
    clickEvent.pipe(takeUntil(this._ngUnsubscribe)).subscribe(() => {
      this.closeColumnMenu();
    });
  }

  /**
   * 變更欄位類別
   * @param e 點擊事件
   * @param index 欄位索引
   * @param type 欄位類別
   */
  changeColumnType(e: MouseEvent, index: number, type: string) {
    e.stopPropagation();
    this.closeColumnMenu();
    const { displayColumn } = this;
    const prevIndex = displayColumn.findIndex((_col) => _col === type);
    if (index === prevIndex) return false;
    if (prevIndex > -1) {
      // 兩個欄位交換位置
      [displayColumn[prevIndex], displayColumn[index]] = [
        displayColumn[index],
        displayColumn[prevIndex],
      ];
    } else {
      displayColumn[index] = type;
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this._ngUnsubscribe.next(null);
    this._ngUnsubscribe.complete();
  }
}
