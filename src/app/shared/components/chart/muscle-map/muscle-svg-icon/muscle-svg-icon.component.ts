import { Component, OnInit, OnChanges, Input } from '@angular/core';
import {
  ArmMuscle,
  PectoralsMuscle,
  ShoulderMuscle,
  BackMuscle,
  AbdominalMuscle,
  LegMuscle
} from '../../../../models/weight-train';
import { MuscleGroup } from '../../../../enum/weight-train';

@Component({
  selector: 'app-muscle-svg-icon',
  templateUrl: './muscle-svg-icon.component.html',
  styleUrls: ['./muscle-svg-icon.component.scss']
})
export class MuscleSvgIconComponent implements OnInit, OnChanges {

  @Input() muscleCode: any = [];
  @Input() muscleGroupId: string;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges () {
    if (this.muscleGroupId !== undefined) {
      this.getMuscleGroupPart(this.muscleGroupId);
    } else {
      this.muscleCode = this.muscleCode.map(_code => +_code);
    }

  }

  /**
   * 根據id取得肌群下的肌肉部位
   * @param id {string}-肌群id
   * @author kidin-1090415
   */
  getMuscleGroupPart (id: string) {
    switch (+id) {
      case MuscleGroup.armMuscle:  // 手臂肌群
        this.muscleCode = ArmMuscle;
        break;
      case MuscleGroup.pectoralsMuscle:  // 胸部肌群
        this.muscleCode = PectoralsMuscle;
        break;
      case MuscleGroup.shoulderMuscle:  // 肩部肌群
        this.muscleCode = ShoulderMuscle;
        break;
      case MuscleGroup.backMuscle:  // 背部肌群
        this.muscleCode = BackMuscle;
        break;
      case MuscleGroup.abdominalMuscle:  // 腹部肌群
        this.muscleCode = AbdominalMuscle;
        break;
      case MuscleGroup.legMuscle:  // 腿部肌群
        this.muscleCode = LegMuscle;
        break;
    }
  }

}
