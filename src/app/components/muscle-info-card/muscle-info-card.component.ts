import { Component, OnChanges, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { WeightTrainingInfo } from '../../core/models/api/api-common';
import { MuscleCode, MuscleGroup, SportType } from '../../core/enums/sports';
import {
  MusclePartIconPipe,
  MuscleGroupIconPipe,
  MuscleNamePipe,
  MuscleGroupNamePipe,
  WeightSibsPipe,
  DataTypeUnitPipe,
} from '../../core/pipes';
import { UserService } from '../../core/services';

@Component({
  selector: 'app-muscle-info-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MusclePartIconPipe,
    MuscleGroupIconPipe,
    MuscleNamePipe,
    MuscleGroupNamePipe,
    WeightSibsPipe,
    DataTypeUnitPipe,
  ],
  templateUrl: './muscle-info-card.component.html',
  styleUrls: ['./muscle-info-card.component.scss'],
})
export class MuscleInfoCardComponent implements OnChanges {
  /**
   * 肌肉部位或肌群數據
   */
  @Input() muscleData: Array<WeightTrainingInfo>;

  /**
   * 比較肌肉部位或肌群數據
   */
  @Input() compareMuscleGroup: Array<WeightTrainingInfo>;

  /**
   * 是否為比較模式（比較模式顯示肌群數據，非比較模式顯示肌肉部位數據）
   */
  @Input() isCompareMode = false;

  /**
   * 聚焦肌肉部位或肌群
   */
  @Input() focusId: MuscleCode | MuscleGroup | null = null;

  /**
   * 傳送聚焦肌肉部位
   */
  @Output() focusMusclePart = new EventEmitter();

  /**
   * 傳送聚焦肌群
   */
  @Output() focusMuscleGroup = new EventEmitter();

  /**
   * 基準與比較的數據差
   */
  diffData?: Array<WeightTrainingInfo>;

  readonly SportType = SportType;

  constructor(private userService: UserService) {}

  /**
   * 取得使用者使用公或英制
   */
  get userUnit() {
    return this.userService.getUser().unit;
  }

  ngOnChanges(e: SimpleChanges) {
    this.focusId = null;
    const { compareMuscleGroup, focusId } = e;
    if (compareMuscleGroup) this.diffData = this.countDiff();
    if (focusId) this.focusId = focusId.currentValue;
  }

  /**
   * 聚焦肌肉部位或肌群
   * @param id 肌肉部位或肌群代碼
   */
  focusMuscle(id: MuscleCode | MuscleGroup) {
    const { focusId: prevId, compareMuscleGroup, focusMusclePart, focusMuscleGroup } = this;
    const emitter = compareMuscleGroup ? focusMuscleGroup : focusMusclePart;
    this.focusId = prevId === id ? null : id;
    emitter.emit(id);
  }

  /**
   * 計算數據差異
   */
  countDiff() {
    const { isCompareMode, muscleData, compareMuscleGroup } = this;
    if (!isCompareMode || !compareMuscleGroup) return undefined;
    return muscleData.map((_data, _index) => {
      const _compareData = compareMuscleGroup[_index];
      const { muscleGroup, max1RmWeightKg, totalReps, totalSets, totalWeightKg } = _data;
      return {
        muscle: null,
        muscleGroup,
        max1RmWeightKg: max1RmWeightKg - _compareData.max1RmWeightKg,
        totalReps: totalReps - _compareData.totalReps,
        totalSets: totalSets - _compareData.totalSets,
        totalWeightKg: totalWeightKg - _compareData.totalWeightKg,
      };
    });
  }
}
