import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  ChangeDetectorRef,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { metacarpus } from '../../../../../core/models/const/weight-train.model';
import { UserService } from '../../../../../core/services';
import {
  ReportDateType,
  ReportCondition,
} from '../../../../../core/models/compo/report-condition.model';
import { mathRounding, getWeightTrainingLevelText } from '../../../../../core/utils';
import { DataUnitType } from '../../../../../core/enums/common';
import { MuscleCode } from '../../../../../core/enums/sports';
import { WeightSibsPipe } from '../../../../../core/pipes/weight-sibs.pipe';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-muscle-map-chart',
  templateUrl: './muscle-map-chart.component.html',
  styleUrls: ['./muscle-map-chart.component.scss'],
  standalone: true,
  imports: [NgIf, WeightSibsPipe],
})
export class MuscleMapChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();
  private mouseoverSubscription = new Subscription();

  @Input() data: any;
  @Input() reportCondition: ReportCondition;

  @ViewChild('sliderBar') sliderBar: ElementRef;
  @ViewChild('sliderRod') sliderRod: ElementRef;
  @ViewChild('sliderOverYet') sliderOverYet: ElementRef;

  /**
   * ui 用到的flag
   */
  uiFlag = {
    dateType: <ReportDateType>'base',
  };

  baseUrl = window.location.href;
  levelText: any = metacarpus;
  bodyWeight = 60;
  dataIndex = 0;
  userUnit: DataUnitType = DataUnitType.metric;

  constructor(
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.fixSvgUrls();
    this.checkColorHintBar();
  }

  ngOnChanges(e: SimpleChanges) {
    if (e.reportCondition) {
      this.uiFlag.dateType = 'base';
      this.dataIndex = 0;
    }

    if (this.data?.base) this.initSlide();
  }

  /**
   * 將肌肉地圖顏色初始化
   * @author kidin-1090406
   */
  clearColor() {
    // 先將顏色清除後再重新上色-kidin-1081128
    const allBodyPath = Array.from(
      document.querySelectorAll('.resetColor') as NodeListOf<HTMLElement>
    );
    allBodyPath.forEach((body) => {
      body.style.fill = 'none';
    });
  }

  /**
   * 根據使用者之體重與訓練程度設定，以及時間軸對肌肉地圖上色
   */
  initMuscleMap() {
    this.clearColor();
    const {
      uiFlag: { dateType },
      dataIndex,
      data,
    } = this;
    const rangeData = data ? data[dateType] : [];
    if (rangeData.length > 0) {
      const assignData = rangeData[dataIndex].max1RM;
      Object.entries(assignData).forEach((_data) => {
        this.assignMuscleMapColor(_data);
      });
    }
  }

  /**
   * 確認訓練程度顏色標示
   */
  checkColorHintBar() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((userProfile) => {
        const { weightTrainingStrengthLevel, bodyWeight, unit } = userProfile;
        this.bodyWeight = bodyWeight;
        this.userUnit = unit;
        this.levelText = getWeightTrainingLevelText(weightTrainingStrengthLevel);
      });
  }

  /**
   * 初始化滑條
   */
  initSlide() {
    setTimeout(() => {
      const sliderBarElement = this.sliderBar.nativeElement;
      const sliderOverYetElement = this.sliderOverYet.nativeElement;
      const { width } = sliderBarElement.getBoundingClientRect();
      const sliderRodElement = this.sliderRod.nativeElement;
      const dataLength = this.data[this.uiFlag.dateType].length;
      this.dataIndex = dataLength - 1;

      sliderOverYetElement.style.transform = `
        translateX(${width / 2}px)
        scaleX(${0})
      `;
      sliderRodElement.style.transform = `translateX(${width}px)`;
      this.initMuscleMap();
    });
  }

  /**
   * 開始滑動
   */
  startSlide() {
    this.listenMouseEvent();
  }

  /**
   * 監聽滑鼠移動事件
   */
  listenMouseEvent() {
    const targetElement = document.querySelector('.main__container');
    const mouseMoveEvent = fromEvent(targetElement, 'mousemove');
    const touchMoveEvent = fromEvent(targetElement, 'touchmove');
    const mouseUpEvent = fromEvent(document, 'mouseup');
    const touchCancelEvent = fromEvent(document, 'touchcancel');
    this.mouseoverSubscription = merge(mouseMoveEvent, touchMoveEvent)
      .pipe(takeUntil(mouseUpEvent), takeUntil(touchCancelEvent), takeUntil(this.ngUnsubscribe))
      .subscribe((e: any) => {
        this.dateSlide(e);
      });
  }

  /**
   * 取消監聽滑鼠移動事件
   */
  unSubscribeMouseEvent() {
    this.mouseoverSubscription.unsubscribe();
  }

  /**
   * 滑動滑條以變更日期範圍
   * @param e {MouseEvent}
   */
  dateSlide(e: any) {
    const moveX = e.x ?? e.touches[0].clientX;
    const sliderBarElement = this.sliderBar.nativeElement;
    const sliderOverYetElement = this.sliderOverYet.nativeElement;
    const { width, x: barX } = sliderBarElement.getBoundingClientRect();
    const sliderRodElement = this.sliderRod.nativeElement;
    let rodOffsetX = moveX - barX;
    if (rodOffsetX > width) {
      rodOffsetX = width;
    } else if (rodOffsetX < 0) {
      rodOffsetX = 0;
    }

    const slideScale = mathRounding(rodOffsetX / width, 3);
    const dataLength = this.data[this.uiFlag.dateType].length;
    this.dataIndex = Math.floor(dataLength * slideScale);
    if (this.dataIndex >= dataLength) this.dataIndex = dataLength - 1;

    sliderOverYetElement.style.transform = `
      translateX(${rodOffsetX / 2}px)
      scaleX(${1 - slideScale})
    `;
    sliderRodElement.style.transform = `translateX(${rodOffsetX}px)`;
    this.initMuscleMap();
  }

  /**
   * 依照數據將肌肉地圖填色
   * @param colorSetting {Array<any>}
   */
  assignMuscleMapColor(colorSetting: Array<any>) {
    const [muscleCode, color] = colorSetting;
    const targetClassName = this.getTargetClassName(muscleCode);
    const targetElement = document.querySelectorAll(targetClassName) as NodeListOf<HTMLElement>;
    targetElement.forEach((_element) => {
      _element.style.fill = color;
    });
  }

  /**
   * 根據肌肉代碼取得對應的class name
   * @param muscleCode {MuscleCode}-肌肉部位代碼
   */
  getTargetClassName(muscleCode: MuscleCode) {
    switch (+muscleCode) {
      case MuscleCode.bicepsInside:
        return '.bicepsInside';
      case MuscleCode.triceps:
        return '.triceps';
      case MuscleCode.pectoralsMuscle:
        return '.pectoralsMuscle';
      case MuscleCode.pectoralisUpper:
        return '.pectoralisUpper';
      case MuscleCode.pectoralisLower:
        return '.pectoralisLower';
      case MuscleCode.pectoralsInside:
        return '.pectoralsInside';
      case MuscleCode.pectoralsOutside:
        return '.pectoralsOutside';
      case MuscleCode.frontSerratus:
        return '.frontSerratus';
      case MuscleCode.shoulderMuscle:
        return '.shoulderMuscle';
      case MuscleCode.deltoidMuscle:
        return '.deltoidMuscle';
      case MuscleCode.deltoidAnterior:
        return '.deltoidAnterior';
      case MuscleCode.deltoidLateral:
        return '.deltoidLateral';
      case MuscleCode.deltoidPosterior:
        return '.deltoidPosterior';
      case MuscleCode.trapezius:
        return '.trapezius';
      case MuscleCode.backMuscle:
        return '.backMuscle';
      case MuscleCode.latissimusDorsi:
        return '.latissimusDorsi';
      case MuscleCode.erectorSpinae:
        return '.erectorSpinae';
      case MuscleCode.abdominalMuscle:
        return '.abdominalMuscle';
      case MuscleCode.rectusAbdominis:
        return '.rectusAbdominis';
      case MuscleCode.rectusAbdominisUpper:
        return '.rectusAbdominisUpper';
      case MuscleCode.rectusAbdominisLower:
        return '.rectusAbdominisLower';
      case MuscleCode.abdominisOblique:
        return '.abdominisOblique';
      case MuscleCode.legMuscle:
        return '.legMuscle';
      case MuscleCode.hipMuscle:
        return '.hipMuscle';
      case MuscleCode.quadricepsFemoris:
        return '.quadricepsFemoris';
      case MuscleCode.hamstrings:
        return '.hamstrings';
      case MuscleCode.ankleFlexor:
        return '.ankleFlexor';
      case MuscleCode.gastrocnemius:
        return '.gastrocnemius';
      case MuscleCode.wristFlexor:
        return '.wristFlexor';
    }
  }

  /**
   * 切換日期類別
   */
  switchDateType() {
    const { dateType } = this.uiFlag;
    this.uiFlag.dateType = dateType === 'base' ? 'compare' : 'base';
    this.initMuscleMap();
  }

  /**
   * 解決safari在使用linearGradient時，無法正常顯示的問題
   * @author kidin-1090428
   */
  fixSvgUrls() {
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
    this.mouseoverSubscription.unsubscribe();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
