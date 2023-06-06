import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  SportTimePipe,
  SportPaceSibsPipe,
  SpeedPaceUnitPipe,
  SpeedSibsPipe,
  WeightSibsPipe,
  DistanceSibsPipe,
  TimeRangeStringPipe,
  SwimPosturePipe,
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
  ],
  templateUrl: './lap-info-table.component.html',
  styleUrls: ['./lap-info-table.component.scss'],
  providers: [TimeRangeStringPipe, WeightSibsPipe],
})
export class LapInfoTableComponent implements OnChanges {
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
   * 是否為比較模式
   */
  @Input() isCompareMode = false;

  /**
   * 比較運動檔案分段資訊
   */
  @Input() compareActivityLap: Array<any>;

  /**
   * 另一個檔案(基準檔案)分段長度
   */
  @Input() oppsiteLapLength: number;

  /**
   * 深拷貝分段資訊
   */
  lapData: Array<any> = [];

  /**
   * 用來快速取得指定數據於陣列中的序列位置
   */
  dataIndex: { [key: string]: number } = {};

  /**
   * 兩筆檔案中，最小的分段長度
   */
  minLength = 0;

  readonly SportType = SportType;

  readonly DataUnitType = DataUnitType;

  constructor(
    private userService: UserService,
    private timeRangeStringPipe: TimeRangeStringPipe,
    private weightSibsPipe: WeightSibsPipe
  ) {}

  /**
   * 取得使用者使用單位
   */
  get userUnit() {
    return this.userService.getUser().unit;
  }

  /**
   * 是否顯示分段名稱
   */
  get showName() {
    return this.includeSportsType([SportType.weightTrain, SportType.aerobic]);
  }

  /**
   * 是否顯示分段距離
   */
  get showDistance() {
    return this.includeSportsType([SportType.run, SportType.cycle, SportType.row, SportType.ball]);
  }

  /**
   * 是否顯示重訓相關分段資訊
   */
  get showWeightTrainData() {
    return this.includeSportsType([SportType.weightTrain]);
  }

  /**
   * 是否顯示分段距離
   */
  get showSwimPosture() {
    return this.includeSportsType([SportType.swim]);
  }

  /**
   * 是否顯示分段配速
   */
  get showPace() {
    return this.includeSportsType([SportType.run, SportType.swim, SportType.row]);
  }

  /**
   * 顯示分段速度
   */
  get showSpeed() {
    return this.includeSportsType([SportType.cycle, SportType.ball]);
  }

  /**
   * 建立數據索引和取得相差數據
   */
  ngOnChanges(e: SimpleChanges): void {
    const { activityLap, isCompareMode } = e;
    if (activityLap) this.handleLapData();
    if (isCompareMode) this.handleComparison();
  }

  /**
   * 深拷貝分段數據及取得所需的數據索引
   */
  handleLapData() {
    const { activityLap } = this;
    this.lapData = deepCopy(activityLap);
    this.dataIndex = this.getDataIndex(activityLap);
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
   * 處理比較模式所需資料
   * 1. 對齊兩邊數據長度
   * 2. 取得比較數據
   */
  handleComparison() {
    const { lapData, oppsiteLapLength } = this;
    const activityLapLength = lapData.length;
    if (activityLapLength < oppsiteLapLength) {
      this.lapData = this.lapData.concat(new Array(oppsiteLapLength - activityLapLength).fill([]));
      this.minLength = activityLapLength;
    } else {
      this.minLength = oppsiteLapLength;
    }
  }

  /**
   * 包含或排除部份運動類別
   * @param typeList 欲包含的運動類別
   */
  includeSportsType(typeList: Array<SportType>) {
    return typeList.includes(this.sportsType);
  }

  /**
   * 取得分段時間格式數據與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getTimeRangeContext(lapIndex: number) {
    const { dataIndex, lapData, compareActivityLap, isCompareMode, minLength } = this;
    const totalSecondIndex = dataIndex['lapTotalSecond'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const totalSecond = currentLap[totalSecondIndex] ? +currentLap[totalSecondIndex] : 0;
    const compareTotalSecond = currentCompareLap ? +currentCompareLap[totalSecondIndex] : null;
    const pipeArgs = { showZeroHour: false, hideSecond: false };
    let result: ValueContext = {
      value: this.timeRangeStringPipe.transform(totalSecond, pipeArgs),
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareTotalSecond ?? false)) {
      const diffSecond = totalSecond - compareTotalSecond;
      result = {
        ...result,
        diffValue: this.timeRangeStringPipe.transform(diffSecond, pipeArgs),
        isPositiveDiff: diffSecond >= 0,
      };
    }

    return result;
  }

  /**
   * 取得分段平均心率數據與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getAvgHrContext(lapIndex: number) {
    const { dataIndex, lapData, compareActivityLap, isCompareMode, minLength } = this;
    const avgHrIndex = dataIndex['lapAvgHeartRateBpm'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const avgHr = currentLap[avgHrIndex] ? currentLap[avgHrIndex] : 0;
    const compareAvgHr = currentCompareLap ? currentCompareLap[avgHrIndex] : null;
    let result: ValueContext = {
      value: avgHr,
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareAvgHr ?? false)) {
      const diffValue = avgHr - compareAvgHr;
      result = {
        ...result,
        diffValue,
        isPositiveDiff: diffValue >= 0,
      };
    }

    return result;
  }

  /**
   * 根據使用者使用公英制及距離是否過千，取得對應距離數據以及與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getDistanceContext(lapIndex: number) {
    const { dataIndex, lapData, userUnit, compareActivityLap, isCompareMode, minLength } = this;
    const distanceIndex = dataIndex['lapTotalDistanceMeters'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const distance = currentLap[distanceIndex] ? currentLap[distanceIndex] : 0;
    const compareDistance = currentCompareLap ? currentCompareLap[distanceIndex] : null;
    const isOverThousand = (value: number) => value >= 1000;
    const showByThousand = isOverThousand(distance) || isOverThousand(compareDistance);
    const { value, unit } = transformDistance(distance, userUnit, showByThousand);
    let result: ValueContext = {
      value,
      unit,
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareDistance ?? false)) {
      const diffDistance = distance - compareDistance;
      const diffValue = transformDistance(diffDistance, userUnit, showByThousand).value;
      result = {
        ...result,
        diffValue,
        isPositiveDiff: diffValue >= 0,
      };
    }

    return result;
  }

  /**
   * 根據使用者使用公英制，取得對應速度數據以及與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getSpeedContext(lapIndex: number) {
    const {
      dataIndex,
      lapData,
      userUnit,
      compareActivityLap,
      isCompareMode,
      sportsType,
      minLength,
    } = this;
    const avgSpeedIndex = dataIndex['lapAvgSpeed'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const avgSpeed = currentLap[avgSpeedIndex] ? currentLap[avgSpeedIndex] : 0;
    const compareAvgSpeed = currentCompareLap ? currentCompareLap[avgSpeedIndex] : null;
    const unit = getPaceUnit(sportsType, userUnit);
    let result: ValueContext = {
      value: speedToPaceSecond(avgSpeed, sportsType, userUnit),
      unit,
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareAvgSpeed ?? false)) {
      const diffAvgSpeed = avgSpeed - compareAvgSpeed;
      const diffValue = speedToPaceSecond(diffAvgSpeed, sportsType, userUnit);
      result = {
        ...result,
        diffValue,
        isPositiveDiff: diffValue >= 0,
      };
    }

    return result;
  }

  /**
   * 根據使用者使用公英制，取得對應配速數據以及與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getPaceContext(lapIndex: number) {
    const {
      dataIndex,
      lapData,
      userUnit,
      compareActivityLap,
      isCompareMode,
      sportsType,
      minLength,
    } = this;
    const avgSpeedIndex = dataIndex['lapAvgSpeed'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const avgPaceSecond = speedToPaceSecond(
      currentLap ? currentLap[avgSpeedIndex] : 0,
      sportsType,
      userUnit
    );
    const compareAvgSpeed = currentCompareLap ? currentCompareLap[avgSpeedIndex] : null;
    const unit = getPaceUnit(sportsType, userUnit);
    let result: ValueContext = {
      value: paceSecondTimeFormat(avgPaceSecond),
      unit,
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareAvgSpeed ?? false)) {
      const comparePaceSecond = speedToPaceSecond(compareAvgSpeed, sportsType, userUnit);
      const diffSecond = avgPaceSecond - comparePaceSecond;
      result = {
        ...result,
        diffValue: paceSecondTimeFormat(diffSecond),
        isPositiveDiff: diffSecond >= 0,
      };
    }

    return result;
  }

  /**
   * 根據使用者使用公英制，取得對應 1RM 數據以及與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getOneMaxRepContext(lapIndex: number) {
    const { dataIndex, lapData, userUnit, compareActivityLap, isCompareMode, minLength } = this;
    const oneRepMaxIndex = dataIndex['setOneRepMax'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const pipeArgs = { unitType: userUnit, showUnit: false };
    const oneRepMax = currentLap[oneRepMaxIndex] ? currentLap[oneRepMaxIndex] : 0;
    const compareOneRepMax = currentCompareLap ? currentCompareLap[oneRepMaxIndex] : null;
    let result: ValueContext = {
      value: this.weightSibsPipe.transform(oneRepMax, pipeArgs),
      unit: userUnit === DataUnitType.metric ? 'kg' : 'lb',
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareOneRepMax ?? false)) {
      const diffOneRepMax = oneRepMax - compareOneRepMax;
      const diffValue = this.weightSibsPipe.transform(diffOneRepMax, pipeArgs);
      result = {
        ...result,
        diffValue,
        isPositiveDiff: diffOneRepMax >= 0,
      };
    }

    return result;
  }

  /**
   * 根據使用者使用公英制，取得對應動作節奏數據以及與比較檔案的差值
   * @param lapIndex 分段索引
   */
  getWeightTrainCadenceContext(lapIndex: number) {
    const { dataIndex, lapData, compareActivityLap, isCompareMode, minLength } = this;
    const cadenceIndex = dataIndex['setMoveRepetitionsAvgCadence'];
    const currentLap = lapData[lapIndex];
    const currentCompareLap = compareActivityLap ? compareActivityLap[lapIndex] : null;
    const cadence = currentLap[cadenceIndex] ? currentLap[cadenceIndex] : 0;
    const compareCadence = currentCompareLap ? currentCompareLap[cadenceIndex] : null;
    let result: ValueContext = {
      value: cadence,
      unit: 'spm',
      displayDiff: lapIndex < minLength,
    };

    if (isCompareMode && (compareCadence ?? false)) {
      const diffCadence = mathRounding(cadence - compareCadence, 1);
      result = {
        ...result,
        diffValue: diffCadence,
        isPositiveDiff: diffCadence >= 0,
      };
    }

    return result;
  }

  /**
   * 處理同步捲動分段列表
   * @param e 捲動事件
   */
  handleSynchronizeScroll(e: Event) {
    if (!this.isCompareMode) return false;
    const { scrollTop } = e.target as any;
    const scrollElementList = document.querySelectorAll('.table__content');
    const targetIndex = this.isBaseFile ? 1 : 0;
    scrollElementList[targetIndex].scroll({ top: scrollTop });
  }
}
