import { Component, OnInit, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'app-muscle-svg-icon',
  templateUrl: './muscle-svg-icon.component.html',
  styleUrls: ['./muscle-svg-icon.component.scss']
})
export class MuscleSvgIconComponent implements OnInit, OnChanges {

  @Input() muscleCode: Array<string>;
  @Input() muscleGroupId: Array<string>;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges () {
    if (this.muscleGroupId) {
      this.getMuscleGroupPart(this.muscleGroupId);
    }
  }

  // 根據id取得肌群下的肌肉部位-kidin-1090415
  getMuscleGroupPart (id) {
    switch (+id) {
      case 1:  // 手臂肌群
        this.muscleCode = ['16', '32', '128'];
        break;
      case 2:  // 胸部肌群
        this.muscleCode = ['48', '49', '50', '51', '52', '53'];
        break;
      case 3:  // 肩部肌群
        this.muscleCode = ['64', '65', '66', '67', '68', '69'];
        break;
      case 4:  // 背部肌群
        this.muscleCode = ['80', '81', '82'];
        break;
      case 5:  // 腹部肌群
        this.muscleCode = ['96', '97', '98', '99', '100'];
        break;
      case 6:  // 腿部肌群
        this.muscleCode = ['112', '113', '114', '115', '116', '117'];
        break;
    }
  }

}
