import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { ActivityService } from '../../../services/activity.service';

@Component({
  selector: 'app-muscle-map',
  templateUrl: './muscle-map.component.html',
  styleUrls: ['./muscle-map.component.scss']
})
export class MuscleMapComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() userWeight = 70; // 預設體重70kg
  mediumGrade = '50%';  // 中等強度設定-kidin-1081122
  highIntensityLevel = '100%';  // 高等強度設定-kidin-1081122
  proficiencyCoefficient = 2;  // 根據使用者熟練度不同而有不同係數-kidin-1081122
  colorSets = [];
  selectMaxOneRepMax = [];
  baseUrl = window.location.href;

  constructor(private activityService: ActivityService) {}

  ngOnInit() {}

  ngOnChanges(): void {
    this.initMuscleMap();
    this.fixSvgUrls();
  }

  initMuscleMap() {
    // 先將顏色清除後再重新上色-kidin-1081128
    const allBodyPath = Array.from(document.querySelectorAll('.resetColor') as NodeListOf<HTMLElement>);
    allBodyPath.forEach(body => {
      body.style.fill = 'none';
    });

    this.colorSets = [];
    this.selectMaxOneRepMax = [];
    const datas = this.activityService.getAllData();

    switch (datas.proficiency) {
      case 'Novice' :
        this.mediumGrade = '25%';
        this.highIntensityLevel = '50%';
        this.proficiencyCoefficient = 4;
        break;
      case 'metacarpus' :
        this.mediumGrade = '50%';
        this.highIntensityLevel = '100%';
        this.proficiencyCoefficient = 2;
        break;
      default :
        this.mediumGrade = '100%';
        this.highIntensityLevel = '200%';
        this.proficiencyCoefficient = 1;
        break;
    }

    if (!datas.focusMusclePart) {
      const allVicePart = datas.infoDatas.useViceMuscle.filter(_data => {
        return +_data !== 0 && _data !== null;
      });

      for (let i = 0; i <= allVicePart.length; i++) {
        const colorVice = '#cacaca';  // 次要訓練部位顏色-kidin-1081125
        const transparencyVice = '0.5';  // 次要訓練部位色彩透明度-kidin-1081125
        // 根據次要重訓部位顯示顏色-kidin-1081122
        switch (allVicePart[i]) {
          case '16' :
            const bicepsInside = document.querySelectorAll('.bicepsInside') as NodeListOf<HTMLElement>;
            for (let k = 0; k < bicepsInside.length; k++) {
              bicepsInside[k].style.fill = colorVice;
              bicepsInside[k].style.opacity = transparencyVice;
            }
            break;
          case '32' :
            const triceps = document.querySelectorAll('.triceps') as NodeListOf<HTMLElement>;
            for (let k = 0; k < triceps.length; k++) {
              triceps[k].style.fill = colorVice;
              triceps[k].style.opacity = transparencyVice;
            }
            break;
          case '48' :
            const pectoralsMuscle = document.querySelectorAll('.pectoralsMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralsMuscle.length; k++) {
              pectoralsMuscle[k].style.fill = colorVice;
              pectoralsMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '49' :
            const pectoralisUpper = document.querySelectorAll('.pectoralisUpper') as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralisUpper.length; k++) {
              pectoralisUpper[k].style.fill = colorVice;
              pectoralisUpper[k].style.opacity = transparencyVice;
            }
            break;
          case '50' :
            const pectoralisLower = document.querySelectorAll('.pectoralisLower') as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralisLower.length; k++) {
              pectoralisLower[k].style.fill = colorVice;
              pectoralisLower[k].style.opacity = transparencyVice;
            }
            break;
          case '51' :
            const pectoralsInside = document.querySelectorAll('.pectoralsInside') as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralsInside.length; k++) {
              pectoralsInside[k].style.fill = colorVice;
              pectoralsInside[k].style.opacity = transparencyVice;
            }
            break;
          case '52' :
            const pectoralsOutside = document.querySelectorAll('.pectoralsOutside') as NodeListOf<HTMLElement>;
            for (let k = 0; k < pectoralsOutside.length; k++) {
              pectoralsOutside[k].style.fill = colorVice;
              pectoralsOutside[k].style.opacity = transparencyVice;
            }
            break;
          case '53' :
            const frontSerratus = document.querySelectorAll('.frontSerratus') as NodeListOf<HTMLElement>;
            for (let k = 0; k < frontSerratus.length; k++) {
              frontSerratus[k].style.fill = colorVice;
              frontSerratus[k].style.opacity = transparencyVice;
            }
            break;
          case '64' :
            const shoulderMuscle = document.querySelectorAll('.shoulderMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < shoulderMuscle.length; k++) {
              shoulderMuscle[k].style.fill = colorVice;
              shoulderMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '65' :
            const deltoidMuscle = document.querySelectorAll('.deltoidMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidMuscle.length; k++) {
              deltoidMuscle[k].style.fill = colorVice;
              deltoidMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '66' :
            const deltoidAnterior = document.querySelectorAll('.deltoidAnterior') as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidAnterior.length; k++) {
              deltoidAnterior[k].style.fill = colorVice;
              deltoidAnterior[k].style.opacity = transparencyVice;
            }
            break;
          case '67' :
            const deltoidLateral = document.querySelectorAll('.deltoidLateral') as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidLateral.length; k++) {
              deltoidLateral[k].style.fill = colorVice;
              deltoidLateral[k].style.opacity = transparencyVice;
            }
            break;
          case '68' :
            const deltoidPosterior = document.querySelectorAll('.deltoidPosterior') as NodeListOf<HTMLElement>;
            for (let k = 0; k < deltoidPosterior.length; k++) {
              deltoidPosterior[k].style.fill = colorVice;
              deltoidPosterior[k].style.opacity = transparencyVice;
            }
            break;
          case '69' :
            const trapezius = document.querySelectorAll('.trapezius') as NodeListOf<HTMLElement>;
            for (let k = 0; k < trapezius.length; k++) {
              trapezius[k].style.fill = colorVice;
              trapezius[k].style.opacity = transparencyVice;
            }
            break;
          case '80' :
            const backMuscle = document.querySelectorAll('.backMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < backMuscle.length; k++) {
              backMuscle[k].style.fill = colorVice;
              backMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '81' :
            const latissimusDorsi = document.querySelectorAll('.latissimusDorsi') as NodeListOf<HTMLElement>;
            for (let k = 0; k < latissimusDorsi.length; k++) {
              latissimusDorsi[k].style.fill = colorVice;
              latissimusDorsi[k].style.opacity = transparencyVice;
            }
            break;
          case '82' :
            const erectorSpinae = document.querySelectorAll('.erectorSpinae') as NodeListOf<HTMLElement>;
            for (let k = 0; k < erectorSpinae.length; k++) {
              erectorSpinae[k].style.fill = colorVice;
              erectorSpinae[k].style.opacity = transparencyVice;
            }
            break;
          case '96' :
            const abdominalMuscle = document.querySelectorAll('.abdominalMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < abdominalMuscle.length; k++) {
              abdominalMuscle[k].style.fill = colorVice;
              abdominalMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '97' :
            const rectusAbdominis = document.querySelectorAll('.rectusAbdominis') as NodeListOf<HTMLElement>;
            for (let k = 0; k < rectusAbdominis.length; k++) {
              rectusAbdominis[k].style.fill = colorVice;
              rectusAbdominis[k].style.opacity = transparencyVice;
            }
            break;
          case '98' :
            const rectusAbdominisUpper = document.querySelectorAll('.rectusAbdominisUpper') as NodeListOf<HTMLElement>;
            for (let k = 0; k < rectusAbdominisUpper.length; k++) {
              rectusAbdominisUpper[k].style.fill = colorVice;
              rectusAbdominisUpper[k].style.opacity = transparencyVice;
            }
            break;
          case '99' :
            const rectusAbdominisLower = document.querySelectorAll('.rectusAbdominisLower') as NodeListOf<HTMLElement>;
            for (let k = 0; k < rectusAbdominisLower.length; k++) {
              rectusAbdominisLower[k].style.fill = colorVice;
              rectusAbdominisLower[k].style.opacity = transparencyVice;
            }
            break;
          case '100' :
            const abdominisOblique = document.querySelectorAll('.abdominisOblique') as NodeListOf<HTMLElement>;
            for (let k = 0; k < abdominisOblique.length; k++) {
              abdominisOblique[k].style.fill = colorVice;
              abdominisOblique[k].style.opacity = transparencyVice;
            }
            break;
          case '112' :
            const legMuscle = document.querySelectorAll('.legMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < legMuscle.length; k++) {
              legMuscle[k].style.fill = colorVice;
              legMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '113' :
            const hipMuscle = document.querySelectorAll('.hipMuscle') as NodeListOf<HTMLElement>;
            for (let k = 0; k < hipMuscle.length; k++) {
              hipMuscle[k].style.fill = colorVice;
              hipMuscle[k].style.opacity = transparencyVice;
            }
            break;
          case '114' :
            const quadricepsFemoris = document.querySelectorAll('.quadricepsFemoris') as NodeListOf<HTMLElement>;
            for (let k = 0; k < quadricepsFemoris.length; k++) {
              quadricepsFemoris[k].style.fill = colorVice;
              quadricepsFemoris[k].style.opacity = transparencyVice;
            }
            break;
          case '115' :
            const hamstrings = document.querySelectorAll('.hamstrings') as NodeListOf<HTMLElement>;
            for (let k = 0; k < hamstrings.length; k++) {
              hamstrings[k].style.fill = colorVice;
              hamstrings[k].style.opacity = transparencyVice;
            }
            break;
          case '116' :
            const ankleFlexor = document.querySelectorAll('.ankleFlexor') as NodeListOf<HTMLElement>;
            for (let k = 0; k < ankleFlexor.length; k++) {
              ankleFlexor[k].style.fill = colorVice;
              ankleFlexor[k].style.opacity = transparencyVice;
            }
            break;
          case '117' :
            const gastrocnemius = document.querySelectorAll('.gastrocnemius') as NodeListOf<HTMLElement>;
            for (let k = 0; k < gastrocnemius.length; k++) {
              gastrocnemius[k].style.fill = colorVice;
              gastrocnemius[k].style.opacity = transparencyVice;
            }
            break;
          case '128' :
            const wristFlexor = document.querySelectorAll('.wristFlexor') as NodeListOf<HTMLElement>;
            for (let k = 0; k < wristFlexor.length; k++) {
              wristFlexor[k].style.fill = colorVice;
              wristFlexor[k].style.opacity = transparencyVice;
            }
            break;
          default :
            break;
        }
      }
    }

    // 根據主要重訓部位訓練程度顯示不同顏色-kidin-1081122
    const allMainPart = datas.infoDatas.weightTrainingInfo;
    for (let i = 0; i < allMainPart.length; i++) {
      const onePart = allMainPart[i];
      const trainingPart = onePart.muscle;

      // 計算該部位訓練程度-kidin-1081128
      let trainingLevel = 200 - ((onePart.max1RmWeightKg) / this.userWeight) * 100 * this.proficiencyCoefficient;
      if (trainingLevel < 0) {
        trainingLevel = 0;
      }
      const saturation = '100%';  // 主訓練部位色彩飽和度-kidin-1081125
      const Brightness = '70%';  // 主訓練部位色彩明亮度-kidin-1081125
      const transparency = 0.5;  // 主訓練部位色彩透明度-kidin-1081125
      this.sendMuscleListColor(trainingPart, trainingLevel, saturation, Brightness, transparency);
      if (datas.focusMusclePart && trainingPart !== datas.focusMusclePart) {
        continue;
      }
      switch (trainingPart) {
        case '16' :
          const bicepsInside = document.querySelectorAll('.bicepsInside') as NodeListOf<HTMLElement>;
          for (let k = 0; k < bicepsInside.length; k++) {
            bicepsInside[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '32' :
          const triceps = document.querySelectorAll('.triceps') as NodeListOf<HTMLElement>;
          for (let k = 0; k < triceps.length; k++) {
            triceps[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '48' :
          const pectoralsMuscle = document.querySelectorAll('.pectoralsMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralsMuscle.length; k++) {
            pectoralsMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '49' :
          const pectoralisUpper = document.querySelectorAll('.pectoralisUpper') as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralisUpper.length; k++) {
            pectoralisUpper[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '50' :
          const pectoralisLower = document.querySelectorAll('.pectoralisLower') as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralisLower.length; k++) {
            pectoralisLower[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '51' :
          const pectoralsInside = document.querySelectorAll('.pectoralsInside') as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralsInside.length; k++) {
            pectoralsInside[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '52' :
          const pectoralsOutside = document.querySelectorAll('.pectoralsOutside') as NodeListOf<HTMLElement>;
          for (let k = 0; k < pectoralsOutside.length; k++) {
            pectoralsOutside[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '53' :
          const frontSerratus = document.querySelectorAll('.frontSerratus') as NodeListOf<HTMLElement>;
          for (let k = 0; k < frontSerratus.length; k++) {
            frontSerratus[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '64' :
          const shoulderMuscle = document.querySelectorAll('.shoulderMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < shoulderMuscle.length; k++) {
            shoulderMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '65' :
          const deltoidMuscle = document.querySelectorAll('.deltoidMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidMuscle.length; k++) {
            deltoidMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '66' :
          const deltoidAnterior = document.querySelectorAll('.deltoidAnterior') as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidAnterior.length; k++) {
            deltoidAnterior[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '67' :
          const deltoidLateral = document.querySelectorAll('.deltoidLateral') as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidLateral.length; k++) {
            deltoidLateral[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '68' :
          const deltoidPosterior = document.querySelectorAll('.deltoidPosterior') as NodeListOf<HTMLElement>;
          for (let k = 0; k < deltoidPosterior.length; k++) {
            deltoidPosterior[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '69' :
          const trapezius = document.querySelectorAll('.trapezius') as NodeListOf<HTMLElement>;
          for (let k = 0; k < trapezius.length; k++) {
            trapezius[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '80' :
          const backMuscle = document.querySelectorAll('.backMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < backMuscle.length; k++) {
            backMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '81' :
          const latissimusDorsi = document.querySelectorAll('.latissimusDorsi') as NodeListOf<HTMLElement>;
          for (let k = 0; k < latissimusDorsi.length; k++) {
            latissimusDorsi[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '82' :
          const erectorSpinae = document.querySelectorAll('.erectorSpinae') as NodeListOf<HTMLElement>;
          for (let k = 0; k < erectorSpinae.length; k++) {
            erectorSpinae[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '96' :
          const abdominalMuscle = document.querySelectorAll('.abdominalMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < abdominalMuscle.length; k++) {
            abdominalMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '97' :
          const rectusAbdominis = document.querySelectorAll('.rectusAbdominis') as NodeListOf<HTMLElement>;
          for (let k = 0; k < rectusAbdominis.length; k++) {
            rectusAbdominis[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '98' :
          const rectusAbdominisUpper = document.querySelectorAll('.rectusAbdominisUpper') as NodeListOf<HTMLElement>;
          for (let k = 0; k < rectusAbdominisUpper.length; k++) {
            rectusAbdominisUpper[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '99' :
          const rectusAbdominisLower = document.querySelectorAll('.rectusAbdominisLower') as NodeListOf<HTMLElement>;
          for (let k = 0; k < rectusAbdominisLower.length; k++) {
            rectusAbdominisLower[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '100' :
          const abdominisOblique = document.querySelectorAll('.abdominisOblique') as NodeListOf<HTMLElement>;
          for (let k = 0; k < abdominisOblique.length; k++) {
            abdominisOblique[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '112' :
          const legMuscle = document.querySelectorAll('.legMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < legMuscle.length; k++) {
            legMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '113' :
          const hipMuscle = document.querySelectorAll('.hipMuscle') as NodeListOf<HTMLElement>;
          for (let k = 0; k < hipMuscle.length; k++) {
            hipMuscle[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '114' :
          const quadricepsFemoris = document.querySelectorAll('.quadricepsFemoris') as NodeListOf<HTMLElement>;
          for (let k = 0; k < quadricepsFemoris.length; k++) {
            quadricepsFemoris[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '115' :
          const hamstrings = document.querySelectorAll('.hamstrings') as NodeListOf<HTMLElement>;
          for (let k = 0; k < hamstrings.length; k++) {
            hamstrings[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '116' :
          const ankleFlexor = document.querySelectorAll('.ankleFlexor') as NodeListOf<HTMLElement>;
          for (let k = 0; k < ankleFlexor.length; k++) {
            ankleFlexor[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '117' :
          const gastrocnemius = document.querySelectorAll('.gastrocnemius') as NodeListOf<HTMLElement>;
          for (let k = 0; k < gastrocnemius.length; k++) {
            gastrocnemius[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        case '128' :
          const wristFlexor = document.querySelectorAll('.wristFlexor') as NodeListOf<HTMLElement>;
          for (let k = 0; k < wristFlexor.length; k++) {
            wristFlexor[k].style.fill = `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`;
          }
          break;
        default :
          break;
      }
    }
  }

  ngAfterViewInit() {}

  // 將篩選過後的資料存至service-kidin-1081129
  sendMuscleListColor(MuscleCode, level, saturation, brightness, transparency) {
    const muscleColorSets = {
      muscleCode: MuscleCode,
      muscleLevel: level,
      muscleColor: `hsla(${level}, ${saturation}, ${brightness}, ${transparency})`
    };
    this.colorSets.push(muscleColorSets);
    this.activityService.saveMuscleListColor(this.colorSets);
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
