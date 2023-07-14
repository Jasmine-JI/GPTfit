import { Component, OnInit, OnChanges, OnDestroy, Input } from '@angular/core';
import {
  adept,
  metacarpus,
  novice,
  muscleMapColorSetting,
} from '../../../../core/models/const/weight-train.model';
import { DataUnitType } from '../../../../core/enums/common';
import { MuscleCode, Proficiency } from '../../../../core/enums/sports';
import { UserLevel } from '../../../../core/models/common';
import { MuscleNamePipe } from '../../../../core/pipes/muscle-name.pipe';
import { WeightSibsPipe } from '../../../../core/pipes/weight-sibs.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleSvgIconComponent } from '../../chart/muscle-map/muscle-svg-icon/muscle-svg-icon.component';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-muscle-map-card',
  templateUrl: './muscle-map-card.component.html',
  styleUrls: ['./muscle-map-card.component.scss'],
  standalone: true,
  imports: [NgFor, MuscleSvgIconComponent, TranslateModule, WeightSibsPipe, MuscleNamePipe],
})
export class MuscleMapCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  mainPartData: Array<{
    max1RmWeightKg: number;
    muscle: string | number;
    totalReps: number;
    totalSets: number;
    totalWeightKg: number;
    color?: string;
  }>;
  @Input() vicePartList: Array<number | string>;
  @Input() level: UserLevel;
  @Input() userWeight = 70; // 預設體重70kg;
  @Input() userUnit = DataUnitType.metric;

  /**
   * ui 用到的各個flag
   */
  uiFlag = {};

  weightTraining = {
    focusPart: <MuscleCode>null, // 紀錄現在聚焦的肌肉部位
    focusSection: <HTMLElement>null, // 紀錄現在聚焦的html區塊
    colorBarInfo: <typeof adept | typeof metacarpus | typeof novice>novice, // 顏色棒所顯示的%數
  };

  baseUrl = window.location.href;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.initMuscleMap();
    this.fixSvgUrls();
  }

  /**
   * 初始化肌肉地圖
   * @author kidin-1100218
   */
  initMuscleMap() {
    this.clearColor();
    let proficiencyCoefficient: Proficiency;

    switch (this.level) {
      case 'novice':
        this.weightTraining.colorBarInfo = novice;
        proficiencyCoefficient = Proficiency.novice;
        break;
      case 'metacarpus':
        this.weightTraining.colorBarInfo = metacarpus;
        proficiencyCoefficient = Proficiency.metacarpus;
        break;
      default:
        this.weightTraining.colorBarInfo = adept;
        proficiencyCoefficient = Proficiency.adept;
        break;
    }

    if (!this.weightTraining.focusPart) {
      const allVicePart = this.vicePartList.filter((_data) => {
        return _data != 0 && _data !== null;
      });

      for (let i = 0, vicePartLen = allVicePart.length; i <= vicePartLen; i++) {
        const colorVice = '#cacaca', // 次要訓練部位顏色-kidin-1081125
          transparencyVice = '0.5'; // 次要訓練部位色彩透明度-kidin-1081125
        // 根據次要重訓部位顯示顏色-kidin-1081122
        switch (+allVicePart[i]) {
          case MuscleCode.bicepsInside: {
            const bicepsInside = document.querySelectorAll(
              '.bicepsInside'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < bicepsInside.length; k++) {
              bicepsInside[k].style.fill = colorVice;
              bicepsInside[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.triceps: {
            const triceps = document.querySelectorAll('.triceps') as NodeListOf<HTMLElement>;
            for (let k = 0; k < triceps.length; k++) {
              triceps[k].style.fill = colorVice;
              triceps[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.pectoralsMuscle: {
            const pectoralsMuscle = document.querySelectorAll(
              '.pectoralsMuscle'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralsMuscle.length; k++) {
              pectoralsMuscle[k].style.fill = colorVice;
              pectoralsMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.pectoralisUpper: {
            const pectoralisUpper = document.querySelectorAll(
              '.pectoralisUpper'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralisUpper.length; k++) {
              pectoralisUpper[k].style.fill = colorVice;
              pectoralisUpper[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.pectoralisLower: {
            const pectoralisLower = document.querySelectorAll(
              '.pectoralisLower'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralisLower.length; k++) {
              pectoralisLower[k].style.fill = colorVice;
              pectoralisLower[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.pectoralsInside: {
            const pectoralsInside = document.querySelectorAll(
              '.pectoralsInside'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralsInside.length; k++) {
              pectoralsInside[k].style.fill = colorVice;
              pectoralsInside[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.pectoralsOutside: {
            const pectoralsOutside = document.querySelectorAll(
              '.pectoralsOutside'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralsOutside.length; k++) {
              pectoralsOutside[k].style.fill = colorVice;
              pectoralsOutside[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.frontSerratus: {
            const frontSerratus = document.querySelectorAll(
              '.frontSerratus'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < frontSerratus.length; k++) {
              frontSerratus[k].style.fill = colorVice;
              frontSerratus[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.shoulderMuscle: {
            const shoulderMuscle = document.querySelectorAll(
              '.shoulderMuscle'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < shoulderMuscle.length; k++) {
              shoulderMuscle[k].style.fill = colorVice;
              shoulderMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.deltoidMuscle: {
            const deltoidMuscle = document.querySelectorAll(
              '.deltoidMuscle'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidMuscle.length; k++) {
              deltoidMuscle[k].style.fill = colorVice;
              deltoidMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.deltoidAnterior: {
            const deltoidAnterior = document.querySelectorAll(
              '.deltoidAnterior'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidAnterior.length; k++) {
              deltoidAnterior[k].style.fill = colorVice;
              deltoidAnterior[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.deltoidLateral: {
            const deltoidLateral = document.querySelectorAll(
              '.deltoidLateral'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidLateral.length; k++) {
              deltoidLateral[k].style.fill = colorVice;
              deltoidLateral[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.deltoidPosterior: {
            const deltoidPosterior = document.querySelectorAll(
              '.deltoidPosterior'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidPosterior.length; k++) {
              deltoidPosterior[k].style.fill = colorVice;
              deltoidPosterior[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.trapezius: {
            const trapezius = document.querySelectorAll('.trapezius') as NodeListOf<HTMLElement>;
            for (let k = 0; k < trapezius.length; k++) {
              trapezius[k].style.fill = colorVice;
              trapezius[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.backMuscle: {
            const backMuscle = document.querySelectorAll('.backMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < backMuscle.length; k++) {
              backMuscle[k].style.fill = colorVice;
              backMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.latissimusDorsi: {
            const latissimusDorsi = document.querySelectorAll(
              '.latissimusDorsi'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < latissimusDorsi.length; k++) {
              latissimusDorsi[k].style.fill = colorVice;
              latissimusDorsi[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.erectorSpinae: {
            const erectorSpinae = document.querySelectorAll(
              '.erectorSpinae'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < erectorSpinae.length; k++) {
              erectorSpinae[k].style.fill = colorVice;
              erectorSpinae[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.abdominalMuscle: {
            const abdominalMuscle = document.querySelectorAll(
              '.abdominalMuscle'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < abdominalMuscle.length; k++) {
              abdominalMuscle[k].style.fill = colorVice;
              abdominalMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.rectusAbdominis: {
            const rectusAbdominis = document.querySelectorAll(
              '.rectusAbdominis'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < rectusAbdominis.length; k++) {
              rectusAbdominis[k].style.fill = colorVice;
              rectusAbdominis[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.rectusAbdominisUpper: {
            const rectusAbdominisUpper = document.querySelectorAll(
              '.rectusAbdominisUpper'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < rectusAbdominisUpper.length; k++) {
              rectusAbdominisUpper[k].style.fill = colorVice;
              rectusAbdominisUpper[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.rectusAbdominisLower: {
            const rectusAbdominisLower = document.querySelectorAll(
              '.rectusAbdominisLower'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < rectusAbdominisLower.length; k++) {
              rectusAbdominisLower[k].style.fill = colorVice;
              rectusAbdominisLower[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.abdominisOblique: {
            const abdominisOblique = document.querySelectorAll(
              '.abdominisOblique'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < abdominisOblique.length; k++) {
              abdominisOblique[k].style.fill = colorVice;
              abdominisOblique[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.legMuscle: {
            const legMuscle = document.querySelectorAll('.legMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < legMuscle.length; k++) {
              legMuscle[k].style.fill = colorVice;
              legMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.hipMuscle: {
            const hipMuscle = document.querySelectorAll('.hipMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < hipMuscle.length; k++) {
              hipMuscle[k].style.fill = colorVice;
              hipMuscle[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.quadricepsFemoris: {
            const quadricepsFemoris = document.querySelectorAll(
              '.quadricepsFemoris'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < quadricepsFemoris.length; k++) {
              quadricepsFemoris[k].style.fill = colorVice;
              quadricepsFemoris[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.hamstrings: {
            const hamstrings = document.querySelectorAll('.hamstrings') as NodeListOf<HTMLElement>;
            for (let k = 0; k < hamstrings.length; k++) {
              hamstrings[k].style.fill = colorVice;
              hamstrings[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.ankleFlexor: {
            const ankleFlexor = document.querySelectorAll(
              '.ankleFlexor'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < ankleFlexor.length; k++) {
              ankleFlexor[k].style.fill = colorVice;
              ankleFlexor[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.gastrocnemius: {
            const gastrocnemius = document.querySelectorAll(
              '.gastrocnemius'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < gastrocnemius.length; k++) {
              gastrocnemius[k].style.fill = colorVice;
              gastrocnemius[k].style.opacity = transparencyVice;
            }
            break;
          }
          case MuscleCode.wristFlexor: {
            const wristFlexor = document.querySelectorAll(
              '.wristFlexor'
            ) as NodeListOf<HTMLElement>;
            for (let k = 0; k < wristFlexor.length; k++) {
              wristFlexor[k].style.fill = colorVice;
              wristFlexor[k].style.opacity = transparencyVice;
            }
            break;
          }
          default:
            break;
        }
      }
    }

    // 根據主要重訓部位訓練程度顯示不同顏色-kidin-1081122
    const allMainPart = this.mainPartData;
    for (let i = 0, mainPartLen = allMainPart.length; i < mainPartLen; i++) {
      const onePart = allMainPart[i],
        trainingPart = +onePart.muscle;

      // 計算該部位訓練程度-kidin-1081128
      let trainingLevel = +(
        200 -
        (onePart.max1RmWeightKg / this.userWeight) * 100 * proficiencyCoefficient
      ).toFixed(1);
      if (trainingLevel < 0) {
        trainingLevel = 0;
      }

      const { saturation, brightness, transparency } = muscleMapColorSetting,
        color = `hsla(${trainingLevel}, ${saturation}, ${brightness}, ${transparency})`;
      Object.assign(this.mainPartData[i], { color });
      if (this.weightTraining.focusPart && trainingPart != this.weightTraining.focusPart) {
        continue;
      }

      switch (trainingPart) {
        case MuscleCode.bicepsInside: {
          const bicepsInside = document.querySelectorAll(
            '.bicepsInside'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < bicepsInside.length; k++) {
            bicepsInside[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.triceps: {
          const triceps = document.querySelectorAll('.triceps') as NodeListOf<HTMLElement>;
          for (let k = 0; k < triceps.length; k++) {
            triceps[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.pectoralsMuscle: {
          const pectoralsMuscle = document.querySelectorAll(
            '.pectoralsMuscle'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralsMuscle.length; k++) {
            pectoralsMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.pectoralisUpper: {
          const pectoralisUpper = document.querySelectorAll(
            '.pectoralisUpper'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralisUpper.length; k++) {
            pectoralisUpper[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.pectoralisLower: {
          const pectoralisLower = document.querySelectorAll(
            '.pectoralisLower'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralisLower.length; k++) {
            pectoralisLower[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.pectoralsInside: {
          const pectoralsInside = document.querySelectorAll(
            '.pectoralsInside'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralsInside.length; k++) {
            pectoralsInside[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.pectoralsOutside: {
          const pectoralsOutside = document.querySelectorAll(
            '.pectoralsOutside'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralsOutside.length; k++) {
            pectoralsOutside[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.frontSerratus: {
          const frontSerratus = document.querySelectorAll(
            '.frontSerratus'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < frontSerratus.length; k++) {
            frontSerratus[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.shoulderMuscle: {
          const shoulderMuscle = document.querySelectorAll(
            '.shoulderMuscle'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < shoulderMuscle.length; k++) {
            shoulderMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.deltoidMuscle: {
          const deltoidMuscle = document.querySelectorAll(
            '.deltoidMuscle'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidMuscle.length; k++) {
            deltoidMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.deltoidAnterior: {
          const deltoidAnterior = document.querySelectorAll(
            '.deltoidAnterior'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidAnterior.length; k++) {
            deltoidAnterior[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.deltoidLateral: {
          const deltoidLateral = document.querySelectorAll(
            '.deltoidLateral'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidLateral.length; k++) {
            deltoidLateral[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.deltoidPosterior: {
          const deltoidPosterior = document.querySelectorAll(
            '.deltoidPosterior'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidPosterior.length; k++) {
            deltoidPosterior[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.trapezius: {
          const trapezius = document.querySelectorAll('.trapezius') as NodeListOf<HTMLElement>;
          for (let k = 0; k < trapezius.length; k++) {
            trapezius[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.backMuscle: {
          const backMuscle = document.querySelectorAll('.backMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < backMuscle.length; k++) {
            backMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.latissimusDorsi: {
          const latissimusDorsi = document.querySelectorAll(
            '.latissimusDorsi'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < latissimusDorsi.length; k++) {
            latissimusDorsi[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.erectorSpinae: {
          const erectorSpinae = document.querySelectorAll(
            '.erectorSpinae'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < erectorSpinae.length; k++) {
            erectorSpinae[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.abdominalMuscle: {
          const abdominalMuscle = document.querySelectorAll(
            '.abdominalMuscle'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < abdominalMuscle.length; k++) {
            abdominalMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.rectusAbdominis: {
          const rectusAbdominis = document.querySelectorAll(
            '.rectusAbdominis'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < rectusAbdominis.length; k++) {
            rectusAbdominis[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.rectusAbdominisUpper: {
          const rectusAbdominisUpper = document.querySelectorAll(
            '.rectusAbdominisUpper'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < rectusAbdominisUpper.length; k++) {
            rectusAbdominisUpper[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.rectusAbdominisLower: {
          const rectusAbdominisLower = document.querySelectorAll(
            '.rectusAbdominisLower'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < rectusAbdominisLower.length; k++) {
            rectusAbdominisLower[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.abdominisOblique: {
          const abdominisOblique = document.querySelectorAll(
            '.abdominisOblique'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < abdominisOblique.length; k++) {
            abdominisOblique[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.legMuscle: {
          const legMuscle = document.querySelectorAll('.legMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < legMuscle.length; k++) {
            legMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.hipMuscle: {
          const hipMuscle = document.querySelectorAll('.hipMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < hipMuscle.length; k++) {
            hipMuscle[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.quadricepsFemoris: {
          const quadricepsFemoris = document.querySelectorAll(
            '.quadricepsFemoris'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < quadricepsFemoris.length; k++) {
            quadricepsFemoris[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.hamstrings: {
          const hamstrings = document.querySelectorAll('.hamstrings') as NodeListOf<HTMLElement>;
          for (let k = 0; k < hamstrings.length; k++) {
            hamstrings[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.ankleFlexor: {
          const ankleFlexor = document.querySelectorAll('.ankleFlexor') as NodeListOf<HTMLElement>;
          for (let k = 0; k < ankleFlexor.length; k++) {
            ankleFlexor[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.gastrocnemius: {
          const gastrocnemius = document.querySelectorAll(
            '.gastrocnemius'
          ) as NodeListOf<HTMLElement>;
          for (let k = 0; k < gastrocnemius.length; k++) {
            gastrocnemius[k].style.fill = color;
          }
          break;
        }
        case MuscleCode.wristFlexor: {
          const wristFlexor = document.querySelectorAll('.wristFlexor') as NodeListOf<HTMLElement>;
          for (let k = 0; k < wristFlexor.length; k++) {
            wristFlexor[k].style.fill = color;
          }
          break;
        }
      }
    }

    this.initMuscleList();
  }

  /**
   * 將肌肉地圖的顏色清除
   * @author kidin-1100218
   */
  clearColor() {
    const allBodyPath = Array.from(
      document.querySelectorAll('.reset__color') as NodeListOf<HTMLElement>
    );
    allBodyPath.forEach((body) => {
      body.style.fill = 'none';
    });
  }

  /**
   * 解決safari在使用linearGradient時，無法正常顯示的問題
   * @author kidin-1090428
   */
  fixSvgUrls() {
    const svgArr = document.querySelectorAll('#linearGradientBar'),
      element = svgArr[0],
      maskId = element.getAttribute('fill').replace('url(', '').replace(')', '');
    if (!maskId.includes('http')) element.setAttribute('fill', `url(${this.baseUrl + maskId})`);
  }

  /**
   * 初始化肌肉訓練清單
   * @author kidin-1100218
   */
  initMuscleList() {
    if (this.weightTraining.focusPart) {
      this.assignColor(this.weightTraining.focusSection, this.weightTraining.focusPart);
    }
  }

  /**
   * 點擊後更改背景顏色並重新繪製肌肉地圖
   * @param code {MuscleCode}-肌肉編號
   * @param e {MouseEvent}
   * @author kidin-1100218
   */
  handleMusclePart(code: MuscleCode, e: MouseEvent) {
    this.clearColor();
    // 判斷是否點擊同個部位
    if (code !== this.weightTraining.focusPart) {
      this.weightTraining.focusPart = code;
      // 清除上一個聚焦的部位顏色
      if (this.weightTraining.focusSection) {
        (this.weightTraining.focusSection as any).style = 'background-color: none;';
      }

      this.weightTraining.focusSection = (e as any).currentTarget;
      this.assignColor(this.weightTraining.focusSection, code);
    } else {
      this.weightTraining.focusPart = null;
      // 清除上一個聚焦的部位顏色
      (this.weightTraining.focusSection as any).style = 'background-color: none;';
    }

    this.initMuscleMap();
  }

  /**
   * 滑鼠滑入後更改背景顏色
   * @param e {MouseEvent}
   * @author kidin-1091127
   */
  handleHoverBgColor(e: MouseEvent) {
    this.assignColor((e as any).target, +(e as any).target.id as MuscleCode);
  }

  /**
   * 滑鼠滑出後除了聚焦的部位外移除背景顏色
   * @param e {MouseEvent}
   * @author kidin-1091127
   */
  handleBgColorRecovery(e: MouseEvent) {
    if ((e as any).target.id != this.weightTraining.focusPart) {
      (e as any).target.style = 'background-color: none;';
    }
  }

  /**
   * 根據肌肉訓練程度更改背景顏色
   * @param target {HTMLElement}
   * @param code {MuscleCode}
   * @author kidin-1081129
   */
  assignColor(target: HTMLElement, code: MuscleCode) {
    for (let i = 0, mainPartLen = this.mainPartData.length; i < mainPartLen; i++) {
      if (this.mainPartData[i].muscle == code) {
        (target as any).style = `background-color: ${this.mainPartData[i].color};`;
      }
    }
  }

  ngOnDestroy(): void {}
}
