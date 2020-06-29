import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-muscle-map-chart',
  templateUrl: './muscle-map-chart.component.html',
  styleUrls: ['./muscle-map-chart.component.scss']
})
export class MuscleMapChartComponent implements OnInit, OnChanges {

  @Input() description: string;
  @Input() data: any;
  @Input() timeStamp: Array<number>;
  @Input() proficiencyCoefficient: number; // 訓練等級係數
  @Input() level: Array<string>;
  @Input() page: string;
  @Input() userWeight: number;

  @Output() clickData = new EventEmitter;

  showAllTrainColor = false;
  baseUrl = window.location.href;

  muscleGroupList = [
    {
      id: 1,
      icon: 'icon-svg_web-icon_p3_028-hand_muscle',
      name: this.translate.instant('universal_muscleName_armMuscles'),
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},  // 訓練肌群數據for圖表
      trainList: {}  // 訓練部位清單數據for圖表
    },
    {
      id: 2,
      icon: 'icon-svg_web-icon_p3_033-chest_muscles',
      name: this.translate.instant('universal_muscleName_pectoralsMuscle'),
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: 3,
      icon: 'icon-svg_web-icon_p3_032-shoulder_muscles',
      name: this.translate.instant('universal_muscleName_shoulderMuscle'),
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: 4,
      icon: 'icon-svg_web-icon_p3_031-back_muscles',
      name: this.translate.instant('universal_muscleName_backMuscle'),
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: 5,
      icon: 'icon-svg_web-icon_p3_030-abdominal_muscles',
      name: this.translate.instant('universal_muscleName_abdominalMuscle'),
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    },
    {
      id: 6,
      icon: 'icon-svg_web-icon_p3_029-foot_muscles',
      name: this.translate.instant('universal_muscleName_legMuscle'),
      isFocus: false,
      isFold: true,
      oneRepMax: 0,
      sets: 0,
      muscleGroupData: {},
      trainList: {}
    }
  ];

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit () {
    this.fixSvgUrls();
  }

  ngOnChanges (e) {

    if (e.proficiencyCoefficient && e.proficiencyCoefficient.firstChange === true) {
      if (this.page === 'report') {
        this.arrangeData(this.data);
      }
    } else {
      this.reAssignColor();
    }

    setTimeout(() => {
      this.assignMuscleMapColor(this.muscleGroupList);
    }, 0);

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.checkChartStatus(location.search);
    } else {

      for (let i = 0; i < this.muscleGroupList.length; i++) {

        if (this.muscleGroupList[i].sets !== 0) {
          this.muscleGroupList[i].isFocus = true; // 預設全部聚焦（無資料除外）
        }

      }

    }

    this.sortMuscleGroup();
    this.emitData('init');
  }

  // 根據query string取得使用者圖表點擊資訊-kidin-1090415
  checkChartStatus (query) {
    const queryString = query.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {

      if (queryString[i].indexOf('selectMuscle=') > -1) {

        const printList = queryString[i].replace('selectMuscle=', '');

        for (let j = 0; j < printList.length; j += 2) {

          if (printList[j] === 'm') {
            this.muscleGroupList[+printList[j + 1] - 1].isFocus = true;
            this.muscleGroupList[+printList[j + 1] - 1].isFold = false;
          } else {
            this.muscleGroupList[+printList[j + 1] - 1].isFocus = true;
          }

        }

      }

    }

  }

  // 將數據依照肌群和部位分開-kidin-1090406
  arrangeData (oldData) {
    const middleData = {
      'armMuscles': {},
      'pectoralsMuscle': {},
      'shoulderMuscle': {},
      'backMuscle': {},
      'abdominalMuscle': {},
      'legMuscle': {}
    };

    for (let i = 0; i < oldData.length; i++) {

      for (let j = 0; j < oldData[i].part.length; j++) {
        const part = oldData[i].part[j];

        if (+part.muscle >= 48 && +part.muscle <= 53) {

          if (middleData.pectoralsMuscle[part.muscle]) {
            middleData.pectoralsMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.pectoralsMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (+part.muscle >= 64 && +part.muscle <= 69) {

          if (middleData.shoulderMuscle[part.muscle]) {
            middleData.shoulderMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.shoulderMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (+part.muscle >= 80 && +part.muscle <= 82) {

          if (middleData.backMuscle[part.muscle]) {
            middleData.backMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.backMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (+part.muscle >= 96 && +part.muscle <= 100) {

          if (middleData.abdominalMuscle[part.muscle]) {
            middleData.abdominalMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.abdominalMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else if (+part.muscle >= 112 && +part.muscle <= 117) {

          if (middleData.legMuscle[part.muscle]) {
            middleData.legMuscle[part.muscle].push([part, oldData[i].startDate]);
          } else {
            middleData.legMuscle[part.muscle] = [[part, oldData[i].startDate]];
          }

        } else {

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

  // 將每個肌肉部位數據依照日期做排序，並取得每個肌群相關數據-kidin-1090406
  sortData (middleData) {

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

            for (let i = 0; i < middleData[group][key].length; i++) {

              const musclePartData = middleData[group][key][i][0];

              sets += musclePartData.totalSets;

              partData.oneRepMaxChartData.push(musclePartData.max1RmWeightKg);
              partData.oneRepWeightChartData.push(
                musclePartData.totalWeightKg / musclePartData.totalReps,
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

  // 計算各肌群數據-kidin-1090413
  calGroupData (muscleGroup) {

    for (let i = 0; i < muscleGroup.length; i++) {

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

  // 將同一肌群的數據依日期排列-kidin-1090413
  sortMuscleGroupData (disorderData) {

    let swapped = true;
    for (let i = 0; i < disorderData.date.length && swapped; i++) {
      swapped = false;

      for (let j = 0; j < disorderData.date.length - 1 - i; j++) {

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

  // 將重複日期的資料做合併-kidin-1090413
  mergeRepeatData (repeatData) {
    const noRepeatData = {
      oneRepMaxChartData: [],
      oneRepWeightChartData: [],
      date: []
    };

    let oneRepMaxChartData = 0,
        oneRepWeightChartData = 0,
        sameDataCount = 0;
    for (let i = 0; i < repeatData.date.length; i++) {

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

  // 根據訓練程度顯示不同顏色-kidin-1090406
  assignPartColor (OneRepMax) {
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

  // 點擊肌肉地圖切換顯示-kidin-1090409
  handleShowColor () {

    if (this.showAllTrainColor === false) {
      this.showAllTrainColor = true;
    } else {
      this.showAllTrainColor = false;
    }

    for (let i = 0; i < this.muscleGroupList.length; i++) {

      if (this.muscleGroupList[i].sets !== 0) {
        this.muscleGroupList[i].isFocus = this.showAllTrainColor;
      }

    }

    this.emitData('click');
    this.assignMuscleMapColor(this.muscleGroupList);
  }

  // 點擊肌群後更改聚焦狀態，並重新繪製肌肉地圖-kidin-1090406
  handleMusclePart (e) {
    this.showAllTrainColor = false;

    // 判斷是否點擊已聚焦部位-kidin-1090406
    for (let i = 0; i < this.muscleGroupList.length; i++) {

      if (+e.currentTarget.id === this.muscleGroupList[i].id) {

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

  // 依據使用者所選的訓練程度重新指派顏色-kidin-1090406
  reAssignColor () {

    for (let i = 0; i < this.muscleGroupList.length; i++) {

      for (const key in this.muscleGroupList[i].trainList) {

        if (this.muscleGroupList[i].trainList.hasOwnProperty(key)) {

          const data = this.muscleGroupList[i].trainList[key];
          data.displayColor = this.assignPartColor(data.oneRepMax);

        }

      }

    }

    this.assignMuscleMapColor(this.muscleGroupList);
  }

  // 將聚焦的數據找出後傳給父組件-kidin-1090406
  emitData (act) {
    this.clickData.emit([this.muscleGroupList, act]);
  }

  // 將肌肉地圖顏色初始化-kidin-1090406
  initChart () {
    // 先將顏色清除後再重新上色-kidin-1081128
    const allBodyPath = Array.from(document.querySelectorAll('.resetColor') as NodeListOf<HTMLElement>);
    allBodyPath.forEach(body => {
      body.style.fill = 'none';
    });
  }

  // 依照數據將肌肉地圖填色-kidin-1090406
  assignMuscleMapColor (list) {
    this.initChart();

    for (let i = 0; i < list.length; i++) {

      if (list[i].isFocus === true) {

        for (const key in list[i].trainList) {

          if (list[i].trainList.hasOwnProperty(key)) {

            const color = list[i].trainList[key].displayColor;
            switch (key) {
              case '16' :
                const bicepsInside = document.querySelectorAll('.bicepsInside') as NodeListOf<HTMLElement>;
                for (let k = 0; k < bicepsInside.length; k++) {
                  bicepsInside[k].style.fill = color;
                }
                break;
              case '32' :
                const triceps = document.querySelectorAll('.triceps') as NodeListOf<HTMLElement>;
                for (let k = 0; k < triceps.length; k++) {
                  triceps[k].style.fill = color;
                }
                break;
              case '48' :
                const pectoralsMuscle = document.querySelectorAll('.pectoralsMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralsMuscle.length; k++) {
                  pectoralsMuscle[k].style.fill = color;
                }
                break;
              case '49' :
                const pectoralisUpper = document.querySelectorAll('.pectoralisUpper') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralisUpper.length; k++) {
                  pectoralisUpper[k].style.fill = color;
                }
                break;
              case '50' :
                const pectoralisLower = document.querySelectorAll('.pectoralisLower') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralisLower.length; k++) {
                  pectoralisLower[k].style.fill = color;
                }
                break;
              case '51' :
                const pectoralsInside = document.querySelectorAll('.pectoralsInside') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralsInside.length; k++) {
                  pectoralsInside[k].style.fill = color;
                }
                break;
              case '52' :
                const pectoralsOutside = document.querySelectorAll('.pectoralsOutside') as NodeListOf<HTMLElement>;
                for (let k = 0; k < pectoralsOutside.length; k++) {
                  pectoralsOutside[k].style.fill = color;
                }
                break;
              case '53' :
                const frontSerratus = document.querySelectorAll('.frontSerratus') as NodeListOf<HTMLElement>;
                for (let k = 0; k < frontSerratus.length; k++) {
                  frontSerratus[k].style.fill = color;
                }
                break;
              case '64' :
                const shoulderMuscle = document.querySelectorAll('.shoulderMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < shoulderMuscle.length; k++) {
                  shoulderMuscle[k].style.fill = color;
                }
                break;
              case '65' :
                const deltoidMuscle = document.querySelectorAll('.deltoidMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidMuscle.length; k++) {
                  deltoidMuscle[k].style.fill = color;
                }
                break;
              case '66' :
                const deltoidAnterior = document.querySelectorAll('.deltoidAnterior') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidAnterior.length; k++) {
                  deltoidAnterior[k].style.fill = color;
                }
                break;
              case '67' :
                const deltoidLateral = document.querySelectorAll('.deltoidLateral') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidLateral.length; k++) {
                  deltoidLateral[k].style.fill = color;
                }
                break;
              case '68' :
                const deltoidPosterior = document.querySelectorAll('.deltoidPosterior') as NodeListOf<HTMLElement>;
                for (let k = 0; k < deltoidPosterior.length; k++) {
                  deltoidPosterior[k].style.fill = color;
                }
                break;
              case '69' :
                const trapezius = document.querySelectorAll('.trapezius') as NodeListOf<HTMLElement>;
                for (let k = 0; k < trapezius.length; k++) {
                  trapezius[k].style.fill = color;
                }
                break;
              case '80' :
                const backMuscle = document.querySelectorAll('.backMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < backMuscle.length; k++) {
                  backMuscle[k].style.fill = color;
                }
                break;
              case '81' :
                const latissimusDorsi = document.querySelectorAll('.latissimusDorsi') as NodeListOf<HTMLElement>;
                for (let k = 0; k < latissimusDorsi.length; k++) {
                  latissimusDorsi[k].style.fill = color;
                }
                break;
              case '82' :
                const erectorSpinae = document.querySelectorAll('.erectorSpinae') as NodeListOf<HTMLElement>;
                for (let k = 0; k < erectorSpinae.length; k++) {
                  erectorSpinae[k].style.fill = color;
                }
                break;
              case '96' :
                const abdominalMuscle = document.querySelectorAll('.abdominalMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < abdominalMuscle.length; k++) {
                  abdominalMuscle[k].style.fill = color;
                }
                break;
              case '97' :
                const rectusAbdominis = document.querySelectorAll('.rectusAbdominis') as NodeListOf<HTMLElement>;
                for (let k = 0; k < rectusAbdominis.length; k++) {
                  rectusAbdominis[k].style.fill = color;
                }
                break;
              case '98' :
                const rectusAbdominisUpper = document.querySelectorAll('.rectusAbdominisUpper') as NodeListOf<HTMLElement>;
                for (let k = 0; k < rectusAbdominisUpper.length; k++) {
                  rectusAbdominisUpper[k].style.fill = color;
                }
                break;
              case '99' :
                const rectusAbdominisLower = document.querySelectorAll('.rectusAbdominisLower') as NodeListOf<HTMLElement>;
                for (let k = 0; k < rectusAbdominisLower.length; k++) {
                  rectusAbdominisLower[k].style.fill = color;
                }
                break;
              case '100' :
                const abdominisOblique = document.querySelectorAll('.abdominisOblique') as NodeListOf<HTMLElement>;
                for (let k = 0; k < abdominisOblique.length; k++) {
                  abdominisOblique[k].style.fill = color;
                }
                break;
              case '112' :
                const legMuscle = document.querySelectorAll('.legMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < legMuscle.length; k++) {
                  legMuscle[k].style.fill = color;
                }
                break;
              case '113' :
                const hipMuscle = document.querySelectorAll('.hipMuscle') as NodeListOf<HTMLElement>;
                for (let k = 0; k < hipMuscle.length; k++) {
                  hipMuscle[k].style.fill = color;
                }
                break;
              case '114' :
                const quadricepsFemoris = document.querySelectorAll('.quadricepsFemoris') as NodeListOf<HTMLElement>;
                for (let k = 0; k < quadricepsFemoris.length; k++) {
                  quadricepsFemoris[k].style.fill = color;
                }
                break;
              case '115' :
                const hamstrings = document.querySelectorAll('.hamstrings') as NodeListOf<HTMLElement>;
                for (let k = 0; k < hamstrings.length; k++) {
                  hamstrings[k].style.fill = color;
                }
                break;
              case '116' :
                const ankleFlexor = document.querySelectorAll('.ankleFlexor') as NodeListOf<HTMLElement>;
                for (let k = 0; k < ankleFlexor.length; k++) {
                  ankleFlexor[k].style.fill = color;
                }
                break;
              case '117' :
                const gastrocnemius = document.querySelectorAll('.gastrocnemius') as NodeListOf<HTMLElement>;
                for (let k = 0; k < gastrocnemius.length; k++) {
                  gastrocnemius[k].style.fill = color;
                }
                break;
              case '128' :
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

  // 將沒有資料的肌群，其顯示位置往後擺-kidin-1090415
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

  // 解決safari在使用linearGradient時，無法正常顯示的問題-kidin-1090428
  fixSvgUrls () {
    const svgArr = document.querySelectorAll('#linearGradientBar');

    for (let i = 0; i < svgArr.length; i++) {
      const element = svgArr[i],
            maskId = element.getAttribute('fill').replace('url(', '').replace(')', '');
      element.setAttribute('fill', `url(${this.baseUrl + maskId})`);
    }

  }

}
