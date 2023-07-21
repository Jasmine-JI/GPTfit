import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services';
import { WeightSibsPipe } from '../../core/pipes';
import { WeightTrainingInfo } from '../../core/models/api/api-common';
import { MuscleCode, MuscleGroup, WeightTrainingLevel } from '../../core/enums/sports';

@Component({
  selector: 'app-muscle-map',
  standalone: true,
  imports: [CommonModule, WeightSibsPipe],
  templateUrl: './muscle-map.component.html',
  styleUrls: ['./muscle-map.component.scss'],
})
export class MuscleMapComponent implements OnChanges {
  /**
   * 肌肉部位/肌群 概要數據
   */
  @Input() data: Array<WeightTrainingInfo>;

  /**
   * 訓練副肌群清單
   */
  @Input() useViceMuscle: Array<MuscleCode>;

  /**
   * 使用者體重
   */
  @Input() bodyWeight = 60;

  /**
   * 使用者重訓程度
   */
  @Input() trainingLevel = WeightTrainingLevel.metacarpus;

  /**
   * 是否為比較數據
   */
  @Input() isCompareData = false;

  /**
   * 顏色標註
   */
  levelText = {
    middle: 50,
    top: 100,
  };

  constructor(private userService: UserService) {}

  /**
   * 取得使用者使用公或英制
   */
  get userUnit() {
    return this.userService.getUser().unit;
  }

  /**
   * 取得使用者使用公或英制
   */
  get unit() {
    return this.userService.getUser().unit;
  }

  ngOnChanges(e: SimpleChanges) {
    const { data, trainingLevel } = e;
    if (trainingLevel) this.handleLevelText();
    if (data) this.setColor();
  }

  /**
   * 根據使用者重訓程度
   */
  handleLevelText() {
    const { trainingLevel } = this;
    this.levelText = {
      middle: trainingLevel / 2,
      top: trainingLevel,
    };
  }

  /**
   * 根據訓練程度與肌肉部位填充顏色
   */
  setColor() {
    // 使用setTimeout確保tempalte svg 的 id 已經帶入參數
    setTimeout(() => {
      this.clearColor();
      const { useViceMuscle, data } = this;
      // 因api規格因素無法知道哪個重訓動作訓練哪些副部位，易使使用者混淆，故副部位先不填色
      // if (useViceMuscle) this.fillViceMuscleColor(useViceMuscle);
      this.fillMainMuscleColor(data);
    });
  }

  /**
   * 將所有已區塊清除顏色
   */
  clearColor() {
    const id = `#${this.isCompareData ? 'compare' : 'base'}`;
    const targetElement = document.querySelectorAll(`${id} .resetColor`) as NodeListOf<HTMLElement>;
    targetElement.forEach((_element) => {
      _element.style.fill = 'none';
    });
  }

  /**
   * 針對次要訓練肌肉部位填充淺灰色
   * @param list 副肌肉部位清單
   */
  fillViceMuscleColor(list: Array<MuscleCode>) {
    list.forEach((_muscle) => {
      const className = this.getTargetClassName(_muscle);
      if (className) this.fillColor(className, 'rgba(200, 200, 200, 1)');
    });
  }

  /**
   * 針對主要訓練肌肉部位填充指定顏色
   * @param data
   */
  fillMainMuscleColor(data: Array<WeightTrainingInfo>) {
    data.forEach((_data) => {
      const { muscle, color } = _data;
      const className = this.getTargetClassName(muscle as MuscleCode);
      if (className) this.fillColor(className, color as string);
    });
  }

  /**
   * 根據肌肉代碼取得對應的class name
   * @param muscleCode 肌肉部位代碼
   */
  getTargetClassName(muscleCode: MuscleCode) {
    switch (+muscleCode) {
      case MuscleCode.bicepsInside:
        return 'bicepsInside';
      case MuscleCode.triceps:
        return 'triceps';
      case MuscleCode.pectoralsMuscle:
        return 'pectoralsMuscle';
      case MuscleCode.pectoralisUpper:
        return 'pectoralisUpper';
      case MuscleCode.pectoralisLower:
        return 'pectoralisLower';
      case MuscleCode.pectoralsInside:
        return 'pectoralsInside';
      case MuscleCode.pectoralsOutside:
        return 'pectoralsOutside';
      case MuscleCode.frontSerratus:
        return 'frontSerratus';
      case MuscleCode.shoulderMuscle:
        return 'shoulderMuscle';
      case MuscleCode.deltoidMuscle:
        return 'deltoidMuscle';
      case MuscleCode.deltoidAnterior:
        return 'deltoidAnterior';
      case MuscleCode.deltoidLateral:
        return 'deltoidLateral';
      case MuscleCode.deltoidPosterior:
        return 'deltoidPosterior';
      case MuscleCode.trapezius:
        return 'trapezius';
      case MuscleCode.backMuscle:
        return 'backMuscle';
      case MuscleCode.latissimusDorsi:
        return 'latissimusDorsi';
      case MuscleCode.erectorSpinae:
        return 'erectorSpinae';
      case MuscleCode.abdominalMuscle:
        return 'abdominalMuscle';
      case MuscleCode.rectusAbdominis:
        return 'rectusAbdominis';
      case MuscleCode.rectusAbdominisUpper:
        return 'rectusAbdominisUpper';
      case MuscleCode.rectusAbdominisLower:
        return 'rectusAbdominisLower';
      case MuscleCode.abdominisOblique:
        return 'abdominisOblique';
      case MuscleCode.legMuscle:
        return 'legMuscle';
      case MuscleCode.hipMuscle:
        return 'hipMuscle';
      case MuscleCode.quadricepsFemoris:
        return 'quadricepsFemoris';
      case MuscleCode.hamstrings:
        return 'hamstrings';
      case MuscleCode.ankleFlexor:
        return 'ankleFlexor';
      case MuscleCode.gastrocnemius:
        return 'gastrocnemius';
      case MuscleCode.wristFlexor:
        return 'wristFlexor';
      default:
        return '';
    }
  }

  /**
   * 針對svg對應肌肉部位填充顏色
   * @param className svg 中的 class name
   * @param color 填充顏色
   */
  fillColor(className: string, color: string) {
    const id = `#${this.isCompareData ? 'compare' : 'base'}`;
    const targetElement = document.querySelectorAll(
      `${id} .${className}`
    ) as NodeListOf<HTMLElement>;
    targetElement.forEach((_element) => {
      _element.style.fill = color;
    });
  }
}
