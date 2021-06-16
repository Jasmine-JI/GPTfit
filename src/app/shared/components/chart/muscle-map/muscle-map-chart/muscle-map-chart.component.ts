import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  MuscleGroup,
  MuscleCode,
  ArmMuscle,
  PectoralsMuscle,
  ShoulderMuscle,
  BackMuscle,
  AbdominalMuscle,
  LegMuscle,
  asept,
  metacarpus,
  novice,
  Proficiency,
  ProficiencyCoefficient
} from '../../../../models/weight-train';
import { UtilsService } from '../../../../services/utils.service';

@Component({
  selector: 'app-muscle-map-chart',
  templateUrl: './muscle-map-chart.component.html',
  styleUrls: ['./muscle-map-chart.component.scss']
})
export class MuscleMapChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();
  @Input() description: string;
  @Input() data: any;
  @Input() proficiencyCoefficient: ProficiencyCoefficient; // 訓練等級係數
  @Input() page: string;
  @Input() userWeight: number;
  @Output() clickData = new EventEmitter;

  showAllTrainColor = false;
  baseUrl = window.location.href;
  level: any = metacarpus;

  /**
   * 各肌群數據
   */
  muscleGroupList = [
    {
      id: MuscleGroup.armMuscle,
      icon: 'icon-svg_web-icon_p3_028-hand_muscle',
      name: '',
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},  // 訓練肌群數據for圖表
      trainList: {}  // 訓練部位清單數據for圖表
    },
    {
      id: MuscleGroup.pectoralsMuscle,
      icon: 'icon-svg_web-icon_p3_033-chest_muscles',
      name: '',
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: MuscleGroup.shoulderMuscle,
      icon: 'icon-svg_web-icon_p3_032-shoulder_muscles',
      name: '',
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: MuscleGroup.backMuscle,
      icon: 'icon-svg_web-icon_p3_031-back_muscles',
      name: '',
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: MuscleGroup.abdominalMuscle,
      icon: 'icon-svg_web-icon_p3_030-abdominal_muscles',
      name: '',
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: MuscleGroup.legMuscle,
      icon: 'icon-svg_web-icon_p3_029-foot_muscles',
      name: '',
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    }
  ];

  constructor(
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
    private utils: UtilsService
  ) {}

  ngOnInit () {
    this.fixSvgUrls();
  }

  ngOnChanges (e) {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      if (e.proficiencyCoefficient && e.proficiencyCoefficient.firstChange === true) {
        if (this.page === 'report') {
          this.getMuscleName();
          this.arrangeData(this.data);
        }
      } else {
        this.reAssignColor();
      }

      this.level = this.getLevel(this.proficiencyCoefficient);
      setTimeout(() => {
        this.assignMuscleMapColor(this.muscleGroupList);
      }, 0);

      // 確認是否為預覽列印頁面-kidin-1090205
      if (location.search.indexOf('ipm=s') > -1) {
        this.checkChartStatus(location.search);
      } else {

        for (let i = 0, len = this.muscleGroupList.length; i < len; i++) {

          if (this.muscleGroupList[i].sets !== 0) {
            this.muscleGroupList[i].isFocus = true; // 預設全部聚焦（無資料除外）
          }

        }

      }

      this.sortMuscleGroup();
      this.emitData('init');
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 待多國語系載入完成之後再進行翻譯
   * @author kidin-1100610
   */
  getMuscleName() {
    this.muscleGroupList[0].name = this.translate.instant('universal_muscleName_armMuscles');
    this.muscleGroupList[1].name = this.translate.instant('universal_muscleName_pectoralsMuscle');
    this.muscleGroupList[2].name = this.translate.instant('universal_muscleName_shoulderMuscle');
    this.muscleGroupList[3].name = this.translate.instant('universal_muscleName_backMuscle');
    this.muscleGroupList[4].name = this.translate.instant('universal_muscleName_abdominalMuscle');
    this.muscleGroupList[5].name = this.translate.instant('universal_muscleName_legMuscle');
  }

  /**
   * 根據query string取得使用者圖表點擊資訊
   * @param query {string}-url query string
   * @author kidin-1090415
   */
  checkChartStatus (query: string) {
    const queryString = query.replace('?', '').split('&');
    queryString.forEach(_query => {
      const [key, value] = _query.split('=');
      if (key === 'selectMuscle') {
        const list = value.split('_');
        list.forEach(_list => {
          if (_list.includes('m')) {
            const mIdx = +_list.replace('m', '');
            this.muscleGroupList[mIdx].isFocus = true;
            this.muscleGroupList[mIdx].isFold = false;
          } else {
            const gIdx = +_list.replace('g', '');
            this.muscleGroupList[gIdx].isFocus = true;
          }

        });

      }

    });

  }

  /**
   * 根據係數取得訓練級別
   * @param coefficient {ProficiencyCoefficient}-訓練等級係數
   * @author kidin-1100610
   */
  getLevel(coefficient: ProficiencyCoefficient) {
    switch (coefficient) {
      case Proficiency.novice:
        return novice;
      case Proficiency.metacarpus:
        return metacarpus;
      case Proficiency.asept:
        return asept;
    }

  }

  /**
   * 將數據依照肌群和部位分開
   * @param oldData {Array<any>}
   * @author kidin-1090406
   */
  arrangeData (oldData: Array<any>) {
    const middleData = {
      'armMuscles': {},
      'pectoralsMuscle': {},
      'shoulderMuscle': {},
      'backMuscle': {},
      'abdominalMuscle': {},
      'legMuscle': {}
    };

    for (let i = 0, len = oldData.length; i < len; i++) {

      for (let j = 0, leng = oldData[i].part.length; j < leng; j++) {
        const part = oldData[i].part[j],
              muscleCode = +part.muscle;
        if (PectoralsMuscle.includes(muscleCode)) {

          if (middleData.pectoralsMuscle[part.muscle]) {
            middleData.pectoralsMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.pectoralsMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (ShoulderMuscle.includes(muscleCode)) {

          if (middleData.shoulderMuscle[part.muscle]) {
            middleData.shoulderMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.shoulderMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (BackMuscle.includes(muscleCode)) {

          if (middleData.backMuscle[part.muscle]) {
            middleData.backMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.backMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (AbdominalMuscle.includes(muscleCode)) {

          if (middleData.abdominalMuscle[part.muscle]) {
            middleData.abdominalMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.abdominalMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (LegMuscle.includes(muscleCode)) {

          if (middleData.legMuscle[part.muscle]) {
            middleData.legMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.legMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (ArmMuscle.includes(muscleCode)) {

          if (middleData.armMuscles[part.muscle]) {
            middleData.armMuscles[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.armMuscles[part.muscle] = [[part, oldData[i].startDate]];
          }

        }

      }

    }

    this.sortData(middleData);
  }

  /**
   * 將每個肌肉部位數據依照日期做排序，並取得每個肌群相關數據
   * @param middleData {any}
   * @author kidin-1090406
   */
  sortData (middleData: any) {
    let idx = 0;
    for (const group in middleData) {

      if (middleData.hasOwnProperty(group)) {
        let groupOneRepMax = 0,
            sets = 0;
        for (const key in middleData[group]) {

          if (middleData[group].hasOwnProperty(key)) {
            const partData = {
              oneRepMax: 0,
              displayColor: '',
              oneRepMaxChartData: [],
              oneRepWeightChartData: [],
              date: []
            };

            for (let i = 0, len = middleData[group][key].length; i < len; i++) {
              const musclePartData = middleData[group][key][i][0];
              sets += musclePartData.totalSets;
              partData.oneRepMaxChartData.push(musclePartData.max1RmWeightKg);
              partData.oneRepWeightChartData.push(
                (musclePartData.totalWeightKg / musclePartData.totalReps) || 0,
              );
              partData.date.push(middleData[group][key][i][1]);

              // 取得該部位最大1RM
              if (musclePartData.max1RmWeightKg > partData.oneRepMax) {
                partData.oneRepMax = musclePartData.max1RmWeightKg;
              }

              // 取得該肌群最大1RM
              if (musclePartData.max1RmWeightKg > groupOneRepMax) {
                groupOneRepMax = musclePartData.max1RmWeightKg;
              }

            }

            partData.displayColor = this.assignPartColor(partData.oneRepMax);
            this.muscleGroupList[idx].trainList[key] = partData;
          }

        }

        this.muscleGroupList[idx].oneRepMax = groupOneRepMax;
        this.muscleGroupList[idx].sets = sets;
        idx++;

      }

    }

    this.calGroupData(this.muscleGroupList);
  }

  /**
   * 計算各肌群數據
   * @param muscleGroup {Array<any>}
   * @author kidin-1090413
   */
  calGroupData (muscleGroup: Array<any>) {
    for (let i = 0, len = muscleGroup.length; i < len; i++) {
      const resultData = {
        oneRepMaxChartData: [],
        oneRepWeightChartData: [],
        date: []
      };

      for (const code in muscleGroup[i].trainList) {

        if (muscleGroup[i].trainList.hasOwnProperty(code)) {
          const muscleData = muscleGroup[i].trainList[code];
          resultData.oneRepMaxChartData = resultData.oneRepMaxChartData.concat(muscleData.oneRepMaxChartData);
          resultData.oneRepWeightChartData = resultData.oneRepWeightChartData.concat(muscleData.oneRepWeightChartData);
          resultData.date = resultData.date.concat(muscleData.date);
        }

      }

      this.muscleGroupList[i].muscleGroupData = this.sortMuscleGroupData(resultData);
    }

  }

  /**
   * 將同一肌群的數據依日期排列
   * @param disorderData {any}
   * @author kidin-1090413
   */
  sortMuscleGroupData (disorderData: any) {
    let swapped = true;
    for (let i = 0, len = disorderData.date.length; i < len && swapped; i++) {
      swapped = false;
      for (let j = 0, leng = disorderData.date.length; j < leng - 1 - i; j++) {

        if (disorderData.date[j] > disorderData.date[j + 1]) {
          swapped = true;
          [disorderData.date[j], disorderData.date[j + 1]] = [disorderData.date[j + 1], disorderData.date[j]];
          [disorderData.oneRepMaxChartData[j], disorderData.oneRepMaxChartData[j + 1]]
           = [disorderData.oneRepMaxChartData[j + 1], disorderData.oneRepMaxChartData[j]];
          [disorderData.oneRepWeightChartData[j], disorderData.oneRepWeightChartData[j + 1]]
           = [disorderData.oneRepWeightChartData[j + 1], disorderData.oneRepWeightChartData[j]];
        }

      }

    }

    return this.mergeRepeatData(disorderData);
  }

  /**
   * 將重複日期的資料做合併
   * @param repeatData {any}
   * @author kidin-1090413
   */
  mergeRepeatData (repeatData: any) {
    const noRepeatData = {
      oneRepMaxChartData: [],
      oneRepWeightChartData: [],
      date: []
    };

    let oneRepMaxChartData = 0,
        oneRepWeightChartData = 0,
        sameDataCount = 0;
    for (let i = 0, len = repeatData.date.length; i < len; i++) {

      if (i === 0 || repeatData.date[i] === repeatData.date[i - 1]) {

        oneRepWeightChartData += repeatData.oneRepWeightChartData[i];
        sameDataCount++;
        if (repeatData.oneRepMaxChartData[i] > oneRepMaxChartData) {
          oneRepMaxChartData = repeatData.oneRepMaxChartData[i];
        }

        if (i === repeatData.date.length - 1) {
          noRepeatData.oneRepMaxChartData.push(oneRepMaxChartData);
          noRepeatData.oneRepWeightChartData.push(oneRepWeightChartData / sameDataCount);
          noRepeatData.date.push(repeatData.date[i]);
        }

      } else if (repeatData.date[i] !== repeatData.date[i - 1]) {
        noRepeatData.oneRepMaxChartData.push(oneRepMaxChartData);
        noRepeatData.oneRepWeightChartData.push(oneRepWeightChartData / sameDataCount);
        noRepeatData.date.push(repeatData.date[i - 1]);
        if (i === repeatData.date.length - 1) {
          noRepeatData.oneRepMaxChartData.push(repeatData.oneRepMaxChartData[i]);
          noRepeatData.oneRepWeightChartData.push(repeatData.oneRepWeightChartData[i]);
          noRepeatData.date.push(repeatData.date[i]);
        } else {
          oneRepMaxChartData = repeatData.oneRepMaxChartData[i],
          oneRepWeightChartData = repeatData.oneRepWeightChartData[i],
          sameDataCount = 1;
        }

      }

    }

    return noRepeatData;
  }

  /**
   * 根據訓練程度顯示不同顏色
   * @param OneRepMax {number}-最大1RM
   * @author kidin-1090406
   */
  assignPartColor (OneRepMax: number) {
    const saturation = '100%',  // 主訓練部位色彩飽和度
          Brightness = '70%',  // 主訓練部位色彩明亮度
          transparency = 0.5;  // 主訓練部位色彩透明度
    // 計算該部位訓練程度-kidin-1090406
    let trainingLevel = 200 - ((OneRepMax) / this.userWeight) * 100 * this.proficiencyCoefficient;
    if (trainingLevel < 0) {
      trainingLevel = 0;
    }

    return `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
  }

  /**
   * 點擊肌肉地圖切換顯示
   * @author kidin-1090409
   */
  handleShowColor () {
    if (this.showAllTrainColor === false) {
      this.showAllTrainColor = true;
    } else {
      this.showAllTrainColor = false;
    }

    for (let i = 0, len = this.muscleGroupList.length; i < len; i++) {

      if (this.muscleGroupList[i].sets !== 0) {
        this.muscleGroupList[i].isFocus = this.showAllTrainColor;
      }

    }

    this.emitData('click');
    this.assignMuscleMapColor(this.muscleGroupList);
  }

  /**
   * 點擊肌群後更改聚焦狀態，並重新繪製肌肉地圖
   * @param e {MouseEvent}
   * @author kidin-1090406
   */
  handleMusclePart (e: MouseEvent) {
    this.showAllTrainColor = false;
    // 判斷是否點擊已聚焦部位-kidin-1090406
    for (let i = 0, len = this.muscleGroupList.length; i < len; i++) {
      const targetId = +(e as any).currentTarget.id
      if (targetId === this.muscleGroupList[i].id) {

        if (this.muscleGroupList[i].isFocus === true) {
          this.muscleGroupList[i].isFocus = false;
        } else {
          this.muscleGroupList[i].isFocus = true;
        }

        break;
      }

    }

    this.emitData('click');
    this.assignMuscleMapColor(this.muscleGroupList);
  }

  /**
   * 依據使用者所選的訓練程度重新指派顏色
   * @author kidin-1090406
   */
  reAssignColor () {
    for (let i = 0, len = this.muscleGroupList.length; i < len; i++) {

      for (const key in this.muscleGroupList[i].trainList) {

        if (this.muscleGroupList[i].trainList.hasOwnProperty(key)) {
          const data = this.muscleGroupList[i].trainList[key];
          data.displayColor = this.assignPartColor(data.oneRepMax);

        }

      }

    }

    this.assignMuscleMapColor(this.muscleGroupList);
  }

  /**
   * 將聚焦的數據找出後傳給父組件
   * @param act {any}
   * @author kidin-1090406
   */
  emitData (act: any) {
    this.clickData.emit([this.muscleGroupList, act]);
  }

  /**
   * 將肌肉地圖顏色初始化
   * @author kidin-1090406
   */
  initChart () {
    // 先將顏色清除後再重新上色-kidin-1081128
    const allBodyPath = Array.from(document.querySelectorAll('.resetColor') as NodeListOf<HTMLElement>);
    allBodyPath.forEach(body => {
      body.style.fill = 'none';
    });
  }

  /**
   * 依照數據將肌肉地圖填色
   * @param list {Array<any>)}
   * @author kidin-1090406
   */
  assignMuscleMapColor (list: Array<any>) {
    this.initChart();
    for (let i = 0, len = list.length; i < len; i++) {

      if (list[i].isFocus === true) {

        for (const key in list[i].trainList) {

          if (list[i].trainList.hasOwnProperty(key)) {
            const color = list[i].trainList[key].displayColor;
            switch (+key) {
              case MuscleCode.bicepsInside:
                const bicepsInside = document.querySelectorAll('.bicepsInside') as NodeListOf<HTMLElement>;
                for (let k = 0; k < bicepsInside.length; k++) {
                  bicepsInside[k].style.fill = color;
                }
                break;
              case MuscleCode.triceps:
                const triceps = document.querySelectorAll('.triceps') as NodeListOf<HTMLElement>;
                for (let k = 0; k < triceps.length; k++) {
                  triceps[k].style.fill = color;
                }
                break;
              case MuscleCode.pectoralsMuscle:
                const pectoralsMuscle = document.querySelectorAll('.pectoralsMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralsMuscle.length; k++) {
                  pectoralsMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.pectoralisUpper:
                const pectoralisUpper = document.querySelectorAll('.pectoralisUpper') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralisUpper.length; k++) {
                  pectoralisUpper[k].style.fill = color;
                }
                break;
              case MuscleCode.pectoralisLower:
                const pectoralisLower = document.querySelectorAll('.pectoralisLower') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralisLower.length; k++) {
                  pectoralisLower[k].style.fill = color;
                }
                break;
              case MuscleCode.pectoralsInside:
                const pectoralsInside = document.querySelectorAll('.pectoralsInside') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralsInside.length; k++) {
                  pectoralsInside[k].style.fill = color;
                }
                break;
              case MuscleCode.pectoralsOutside:
                const pectoralsOutside = document.querySelectorAll('.pectoralsOutside') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralsOutside.length; k++) {
                  pectoralsOutside[k].style.fill = color;
                }
                break;
              case MuscleCode.frontSerratus:
                const frontSerratus = document.querySelectorAll('.frontSerratus') as NodeListOf<HTMLElement>;
                for (let k = 0; k < frontSerratus.length; k++) {
                  frontSerratus[k].style.fill = color;
                }
                break;
              case MuscleCode.shoulderMuscle:
                const shoulderMuscle = document.querySelectorAll('.shoulderMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < shoulderMuscle.length; k++) {
                  shoulderMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.deltoidMuscle:
                const deltoidMuscle = document.querySelectorAll('.deltoidMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidMuscle.length; k++) {
                  deltoidMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.deltoidAnterior:
                const deltoidAnterior = document.querySelectorAll('.deltoidAnterior') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidAnterior.length; k++) {
                  deltoidAnterior[k].style.fill = color;
                }
                break;
              case MuscleCode.deltoidLateral:
                const deltoidLateral = document.querySelectorAll('.deltoidLateral') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidLateral.length; k++) {
                  deltoidLateral[k].style.fill = color;
                }
                break;
              case MuscleCode.deltoidPosterior:
                const deltoidPosterior = document.querySelectorAll('.deltoidPosterior') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidPosterior.length; k++) {
                  deltoidPosterior[k].style.fill = color;
                }
                break;
              case MuscleCode.trapezius:
                const trapezius = document.querySelectorAll('.trapezius') as NodeListOf<HTMLElement>;
                for (let k = 0; k < trapezius.length; k++) {
                  trapezius[k].style.fill = color;
                }
                break;
              case MuscleCode.backMuscle:
                const backMuscle = document.querySelectorAll('.backMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < backMuscle.length; k++) {
                  backMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.latissimusDorsi:
                const latissimusDorsi = document.querySelectorAll('.latissimusDorsi') as NodeListOf<HTMLElement>;
                for (let k = 0; k < latissimusDorsi.length; k++) {
                  latissimusDorsi[k].style.fill = color;
                }
                break;
              case MuscleCode.erectorSpinae:
                const erectorSpinae = document.querySelectorAll('.erectorSpinae') as NodeListOf<HTMLElement>;
                for (let k = 0; k < erectorSpinae.length; k++) {
                  erectorSpinae[k].style.fill = color;
                }
                break;
              case MuscleCode.abdominalMuscle:
                const abdominalMuscle = document.querySelectorAll('.abdominalMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < abdominalMuscle.length; k++) {
                  abdominalMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.rectusAbdominis:
                const rectusAbdominis = document.querySelectorAll('.rectusAbdominis') as NodeListOf<HTMLElement>;
                for (let k = 0; k < rectusAbdominis.length; k++) {
                  rectusAbdominis[k].style.fill = color;
                }
                break;
              case MuscleCode.rectusAbdominisUpper:
                const rectusAbdominisUpper = document.querySelectorAll('.rectusAbdominisUpper') as NodeListOf<HTMLElement>;
                for (let k = 0; k < rectusAbdominisUpper.length; k++) {
                  rectusAbdominisUpper[k].style.fill = color;
                }
                break;
              case MuscleCode.rectusAbdominisLower:
                const rectusAbdominisLower = document.querySelectorAll('.rectusAbdominisLower') as NodeListOf<HTMLElement>;
                for (let k = 0; k < rectusAbdominisLower.length; k++) {
                  rectusAbdominisLower[k].style.fill = color;
                }
                break;
              case MuscleCode.abdominisOblique:
                const abdominisOblique = document.querySelectorAll('.abdominisOblique') as NodeListOf<HTMLElement>;
                for (let k = 0; k < abdominisOblique.length; k++) {
                  abdominisOblique[k].style.fill = color;
                }
                break;
              case MuscleCode.legMuscle:
                const legMuscle = document.querySelectorAll('.legMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < legMuscle.length; k++) {
                  legMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.hipMuscle:
                const hipMuscle = document.querySelectorAll('.hipMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < hipMuscle.length; k++) {
                  hipMuscle[k].style.fill = color;
                }
                break;
              case MuscleCode.quadricepsFemoris:
                const quadricepsFemoris = document.querySelectorAll('.quadricepsFemoris') as NodeListOf<HTMLElement>;
                for (let k = 0; k < quadricepsFemoris.length; k++) {
                  quadricepsFemoris[k].style.fill = color;
                }
                break;
              case MuscleCode.hamstrings:
                const hamstrings = document.querySelectorAll('.hamstrings') as NodeListOf<HTMLElement>;
                for (let k = 0; k < hamstrings.length; k++) {
                  hamstrings[k].style.fill = color;
                }
                break;
              case MuscleCode.ankleFlexor:
                const ankleFlexor = document.querySelectorAll('.ankleFlexor') as NodeListOf<HTMLElement>;
                for (let k = 0; k < ankleFlexor.length; k++) {
                  ankleFlexor[k].style.fill = color;
                }
                break;
              case MuscleCode.gastrocnemius:
                const gastrocnemius = document.querySelectorAll('.gastrocnemius') as NodeListOf<HTMLElement>;
                for (let k = 0; k < gastrocnemius.length; k++) {
                  gastrocnemius[k].style.fill = color;
                }
                break;
              case MuscleCode.wristFlexor:
                const wristFlexor = document.querySelectorAll('.wristFlexor') as NodeListOf<HTMLElement>;
                for (let k = 0; k < wristFlexor.length; k++) {
                  wristFlexor[k].style.fill = color;
                }
                break;
              default :
                break;
            }
          }

        }

      }

    }

  }

  /**
   * 將沒有資料的肌群，其顯示位置往後擺
   * @author kidin-1090415
   */
  sortMuscleGroup () {
    let swapped = true;
    for (let i = 0; i < this.muscleGroupList.length && swapped; i++) {
      swapped = false;
      for (let j = 0; j < this.muscleGroupList.length - 1 - i; j++) {

        if (this.muscleGroupList[j].sets === 0) {
          swapped = true;
          [this.muscleGroupList[j], this.muscleGroupList[j + 1]] = [this.muscleGroupList[j + 1], this.muscleGroupList[j]];
        }

      }

    }

  }

  /**
   * 解決safari在使用linearGradient時，無法正常顯示的問題
   * @author kidin-1090428
   */
  fixSvgUrls () {
    const svgArr = document.querySelectorAll('#linearGradientBar');
    for (let i = 0, len = svgArr.length; i < len; i++) {
      const element = svgArr[i],
            maskId = element.getAttribute('fill').replace('url(', '').replace(')', '');
      element.setAttribute('fill', `url(${this.baseUrl + maskId})`);
    }

  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1100610
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
