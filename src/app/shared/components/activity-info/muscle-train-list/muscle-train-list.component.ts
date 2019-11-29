import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../../services/activity.service';

@Component({
  selector: 'app-muscle-train-list',
  templateUrl: './muscle-train-list.component.html',
  styleUrls: ['./muscle-train-list.component.scss']
})
export class MuscleTrainListComponent implements OnInit {
  lapsDatas = [];
  musclePartState = '';  // 紀錄現在聚焦的肌肉部位-kidin-1081129
  focusSection: any;  // 紀錄現在聚焦的html區塊-kidin-1081129
  noRepeatData = [];  // 紀錄篩選過後的資料-kidin-1081129

  constructor(public activityService: ActivityService) {
  }

  originLapDatas = this.activityService.getLapsData();

  ngOnInit() {
    this.compileDatas(this.originLapDatas);
      this.initMuscleList();
  }

  // 將資料編輯過以供html讀取-kidin-1081129
  compileDatas(datas) {
    const middleDatas = datas.filter(data => data.dispName !== '');
    const mainTrainingPartList = [];
    // 先篩出此次重訓主要訓練的所有肌肉部位-kidin-20191126
    for (let i = 0; i < middleDatas.length; i++) {
      const mainTrainPart = middleDatas[i].setWorkOutMuscleMain;
      const listLength = mainTrainingPartList.length;
      for (let j = 0; j < mainTrainPart.length; j++) {
        if (mainTrainPart[j] !== '0' && mainTrainPart[j] !== mainTrainingPartList[listLength - 1 ]) {
          mainTrainingPartList.push(mainTrainPart[j]);
        }
      }
    }
    // 再根據該肌肉部位分別將重量、組數、次數相加，並取得此次訓練中該肌肉部位的最大1RM-kidin-20191126
    for (let k = 0; k < mainTrainingPartList.length; k++) {
      let totalWeight = 0,
          totalReps = 0,
          totalSets = 0,
          OneRepMax = 0;
      for (let l = 0; l < middleDatas.length; l++) {
        const mainTrainingPart = middleDatas[l].setWorkOutMuscleMain;
        for (let m = 0; m < mainTrainingPart.length; m++) {
          if ( mainTrainingPart[m] === mainTrainingPartList[k]) {
            totalWeight = totalWeight + middleDatas[l].setTotalWeightKg;
            totalReps = totalReps + middleDatas[l].setTotalReps;
            totalSets++;
            if (middleDatas[l].setOneRepMax > OneRepMax) {
              OneRepMax = middleDatas[l].setOneRepMax;
            }
          }
        }
      }
      const muscleDatas = {
        muscleCode: mainTrainingPartList[k],
        totalWeight: totalWeight,
        totalReps: totalReps,
        totalSets: totalSets,
        OneRepMax: OneRepMax
      };
      this.lapsDatas.push(muscleDatas);
    }
  }
  initMuscleList() {
    if (this.focusSection === undefined) {
      this.noRepeatData = this.activityService.getMuscleListColor();
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
