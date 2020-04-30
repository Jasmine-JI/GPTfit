import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../../services/activity.service';

@Component({
  selector: 'app-muscle-train-list',
  templateUrl: './muscle-train-list.component.html',
  styleUrls: ['./muscle-train-list.component.scss']
})
export class MuscleTrainListComponent implements OnInit {

  musclePartState = '';  // 紀錄現在聚焦的肌肉部位-kidin-1081129
  focusSection: any;  // 紀錄現在聚焦的html區塊-kidin-1081129
  noRepeatData = [];  // 紀錄篩選過後的資料-kidin-1081129

  constructor(public activityService: ActivityService) {
  }

  trainList = this.activityService.getLapsData().weightTrainingInfo;

  ngOnInit() {
    this.initMuscleList();
  }

  initMuscleList() {
      this.noRepeatData = this.activityService.getMuscleListColor();
      if (this.musclePartState !== '') {
        this.assignColor(this.focusSection, this.musclePartState);
      }
  }

  // 點擊後更改背景顏色並重新繪製肌肉地圖-kidin-1091127
  handleMusclePart(code, e) {
    // 判斷是否點擊同個部位-kidin-1081129
    if (code !== this.musclePartState) {
      this.musclePartState = code;
      if (this.focusSection !== undefined) {
        this.focusSection.style = 'background-color: none;';
      }
      this.focusSection = e.currentTarget;
      this.assignColor(this.focusSection, code);
    } else {
      this.musclePartState = '';
      this.focusSection.style = 'background-color: none;';
    }
    this.activityService.saveMusclePart(this.musclePartState);
  }

  // 滑鼠滑入後更改背景顏色-kidin-1091127
  handleHoverBgColor(e) {
    this.assignColor(e.target, e.target.id);
  }

  // 滑鼠滑出後除了聚焦的部位外移除背景顏色-kidin-1091127
  handleBgColorRecovery(e) {
    if (e.target.id !== this.musclePartState) {
      e.target.style = 'background-color: none;';
    }
  }

  // 根據肌肉訓練程度更改背景顏色-kidin-1081129
  assignColor(target, code) {
    for (let i = 0; i < this.noRepeatData.length; i++) {
      if (this.noRepeatData[i].muscleCode === code) {
        target.style = `background-color: ${this.noRepeatData[i].muscleColor};`;
      }
    }
  }
}
