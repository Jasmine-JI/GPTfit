import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SportType } from '../../../../core/enums/sports';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HrZoneRange } from '../../../../core/models/compo/chart-data.model';
import { mi } from '../../../../core/models/const/bs-constant.model';
import { DataUnitType } from '../../../../core/enums/common';
import {
  setLocalStorageObject,
  getLocalStorageObject,
  deepCopy,
  simplify,
} from '../../../../core/utils';
import { SportPaceSibsPipe } from '../../../../core/pipes';

type QuadrantDataOpt = 'hr' | 'speed' | 'pace' | 'cadence' | 'power';
type Axis = 'xAxis' | 'yAxis';
type Quadrant = 'quadrantI' | 'quadrantII' | 'quadrantIII' | 'quadrantIV';
type ChartOpt = {
  xAxis: {
    type: QuadrantDataOpt;
    origin: number;
  };
  yAxis: {
    type: QuadrantDataOpt;
    origin: number;
  };
  meaning: {
    quadrantI: string;
    quadrantII: string;
    quadrantIII: string;
    quadrantIV: string;
  };
  customMeaning: boolean;
  assignUser: Array<number>;
};

@Component({
  selector: 'app-quadrant-chart',
  templateUrl: './quadrant-chart.component.html',
  styleUrls: ['./quadrant-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuadrantChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() userPoint: Array<any>;
  @Input() userInfo: Array<any>;
  @Input() sportType: SportType;
  @Input() sysAccessRight: number;
  @Input() unit: DataUnitType;
  @Input() hrRange: HrZoneRange;

  /**
   * ui會用到的各種flag
   */
  uiFlag = {
    showChartOpt: false,
    showDataSelector: null,
    showUserList: false,
    optTempChange: false,
    focusInput: false,
  };

  /**
   * 象限顏色
   */
  color = {
    quadrantI: '#ea5757',
    quadrantII: '#cfef4b',
    quadrantIII: '#6bebf9',
    quadrantIV: '#72e8b0',
  };

  /**
   * 圖表設定
   */
  chartOpt = <ChartOpt>{
    xAxis: {
      type: null,
      origin: null,
    },
    yAxis: {
      type: null,
      origin: null,
    },
    meaning: {
      quadrantI: '',
      quadrantII: '',
      quadrantIII: '',
      quadrantIV: '',
    },
    customMeaning: false,
    assignUser: null,
  };

  /**
   * 使用者變更中的設定
   */
  tempOpt = <ChartOpt>{
    xAxis: {
      type: null,
      origin: null,
    },
    yAxis: {
      type: null,
      origin: null,
    },
    meaning: {
      quadrantI: '',
      quadrantII: '',
      quadrantIII: '',
      quadrantIV: '',
    },
    customMeaning: false,
    assignUser: null,
  };

  /**
   * 圖表預設的設定
   */
  defaultOpt = <ChartOpt>{
    xAxis: {
      type: null,
      origin: null,
    },
    yAxis: {
      type: null,
      origin: null,
    },
    meaning: {
      quadrantI: '',
      quadrantII: '',
      quadrantIII: '',
      quadrantIV: '',
    },
    customMeaning: false,
    assignUser: null,
  };

  /**
   * 設定框軸線源點設定欄位的顯示
   */
  axisInputValue = {
    xAxis: <string | number>null,
    yAxis: <string | number>null,
  };

  /**
   * 圖表
   */
  chart = {
    line: {
      xAxis: {
        x: null,
        y: null,
      },
      yAxis: {
        x: null,
        y: null,
      },
    },
    x: {
      max: null,
      min: null,
    },
    y: {
      max: null,
      min: null,
    },
    label: {
      xAxis: {
        x: null,
        y: null,
      },
      yAxis: {
        x: null,
        y: null,
      },
      size: 16,
    },
    pointNum: {
      quadrantI: 0,
      quadrantII: 0,
      quadrantIII: 0,
      quadrantIV: 0,
      total: 0,
    },
    chartPoint: [],
    displayPoint: [],
    chartSvgWidth: 450,
    chartSvgHeight: 300,
  };

  clickEvent: Subscription;
  check = 0;

  constructor(
    private translate: TranslateService,
    private sportPaceSibsPipe: SportPaceSibsPipe,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.uiFlag.showUserList = this.userPoint.length <= 1;
    this.initChart();
  }

  /**
   * 待多國語系載入完畢後再產生圖表
   * @author kidin-1100228
   */
  initChart() {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.initData();
        this.setDefaultOpt();
        this.setUserOpt();
        this.createChart(this.userPoint);
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * 將圖表數據初始化
   * @author kidin-1100128
   */
  initData() {
    this.chart = {
      line: {
        xAxis: {
          x: null,
          y: null,
        },
        yAxis: {
          x: null,
          y: null,
        },
      },
      x: {
        max: null,
        min: null,
      },
      y: {
        max: null,
        min: null,
      },
      label: {
        xAxis: {
          x: null,
          y: null,
        },
        yAxis: {
          x: null,
          y: null,
        },
        size: 16,
      },
      pointNum: {
        quadrantI: 0,
        quadrantII: 0,
        quadrantIII: 0,
        quadrantIV: 0,
        total: 0,
      },
      chartPoint: [],
      displayPoint: [],
      chartSvgWidth: 450,
      chartSvgHeight: 300,
    };
  }

  /**
   * 根據運動類別給予預設值
   * @author kidin 1100128
   */
  setDefaultOpt() {
    switch (this.sportType) {
      case SportType.run:
        this.defaultOpt = {
          xAxis: {
            type: 'pace',
            origin: 10,
          },
          yAxis: {
            type: 'hr',
            origin: this.hrRange.z4 as number,
          },
          meaning: {
            quadrantI: `${this.translate.instant(
              'universal_activityData_sprint'
            )}/${this.translate.instant('universal_activityData_highLoad')}`,
            quadrantII: `${this.translate.instant(
              'universal_activityData_uphill'
            )}/${this.translate.instant('universal_activityData_ineffective')}`,
            quadrantIII: `${this.translate.instant('universal_activityData_resumeTraining')}`,
            quadrantIV: `${this.translate.instant(
              'universal_activityData_downhill'
            )}/${this.translate.instant('universal_activityData_highEfficiency')}`,
          },
          customMeaning: false,
          assignUser: null,
        };

        break;
      case SportType.cycle:
        this.defaultOpt = {
          xAxis: {
            type: 'speed',
            origin: 30,
          },
          yAxis: {
            type: 'cadence',
            origin: 100,
          },
          meaning: {
            quadrantI: `${this.translate.instant(
              'universal_activityData_sprint'
            )}/${this.translate.instant('universal_activityData_accelerate')}`,
            quadrantII: `${this.translate.instant('universal_activityData_lightGearRatio')}`,
            quadrantIII: `${this.translate.instant(
              'universal_activityData_uphill'
            )}/${this.translate.instant('universal_activityData_ineffective')}`,
            quadrantIV: `${this.translate.instant(
              'universal_activityData_glide'
            )}/${this.translate.instant('universal_activityData_gearRatio')}`,
          },
          customMeaning: false,
          assignUser: null,
        };
        break;
      case SportType.swim:
        this.defaultOpt = {
          xAxis: {
            type: 'pace',
            origin: 4.5,
          },
          yAxis: {
            type: 'cadence',
            origin: 30,
          },
          meaning: {
            quadrantI: `${this.translate.instant(
              'universal_activityData_sprint'
            )}/${this.translate.instant('universal_activityData_accelerate')}`,
            quadrantII: `${this.translate.instant(
              'universal_activityData_retrograde'
            )}/${this.translate.instant('universal_activityData_ineffective')}`,
            quadrantIII: `${this.translate.instant('universal_activityData_leisureActivities')}`,
            quadrantIV: `${this.translate.instant(
              'universal_activityData_forward'
            )}/${this.translate.instant('universal_activityData_highEfficiency')}`,
          },
          customMeaning: false,
          assignUser: null,
        };

        break;
      case SportType.row:
        this.defaultOpt = {
          xAxis: {
            type: 'pace',
            origin: 15,
          },
          yAxis: {
            type: 'cadence',
            origin: 40,
          },
          meaning: {
            quadrantI: `${this.translate.instant(
              'universal_activityData_sprint'
            )}/${this.translate.instant('universal_activityData_accelerate')}`,
            quadrantII: `${this.translate.instant(
              'universal_activityData_retrograde'
            )}/${this.translate.instant('universal_activityData_ineffective')}`,
            quadrantIII: `${this.translate.instant('universal_activityData_leisureActivities')}`,
            quadrantIV: `${this.translate.instant(
              'universal_activityData_forward'
            )}/${this.translate.instant('universal_activityData_highEfficiency')}`,
          },
          customMeaning: false,
          assignUser: null,
        };
        break;
    }
  }

  /**
   * 處理設定框軸線源點設定欄位的顯示
   * @param axis {Axis}-軸線
   * @param ref {QuadrantDataOpt}-軸線類別
   * @param refValue {number}-軸線源點
   * @param sportType {SportType}-運動類別
   * @param unit {DataUnitType}-使用者使用的單位
   * @author kidin-1100202
   */
  handleAxisInput(
    axis: Axis,
    refType: QuadrantDataOpt,
    refValue: number,
    sportType: SportType,
    unit: DataUnitType
  ) {
    switch (refType) {
      case 'pace':
        this.axisInputValue[axis] = this.sportPaceSibsPipe.transform(refValue, {
          sportType,
          userUnit: unit,
          showUnit: false,
        });
        break;
      case 'speed':
        this.axisInputValue[axis] = unit === 0 ? refValue : +(refValue / mi).toFixed(1);
        break;
      default:
        this.axisInputValue[axis] = refValue;
        break;
    }
  }

  /**
   * 由localstorage取得使用者的象限圖設定，若取不到則給予預設
   * @author kidin-1100128
   */
  setUserOpt() {
    const storageOpt = getLocalStorageObject(`quadrantOpt__${this.sportType}`);
    this.chartOpt = storageOpt ? JSON.parse(storageOpt) : deepCopy(this.defaultOpt);
    if (!this.chartOpt.customMeaning) {
      // 若使用者無更改過象限意義，則依多國語系使用預設值
      this.chartOpt.meaning = deepCopy(this.defaultOpt.meaning);
    }

    this.handleAxisInput(
      'xAxis',
      this.chartOpt['xAxis'].type,
      this.chartOpt['xAxis'].origin,
      this.sportType,
      this.unit
    );

    this.handleAxisInput(
      'yAxis',
      this.chartOpt['yAxis'].type,
      this.chartOpt['yAxis'].origin,
      this.sportType,
      this.unit
    );
  }

  /**
   * 計算指定類別的數據象限佔比並產生圖表
   * @param points {Array<any>}-api回傳的數據
   * @author kidin-1100128
   */
  createChart(points: Array<any>) {
    const {
      xAxis: { origin: xOrigin, type: xAxisType },
      yAxis: { origin: yOrigin, type: yAxisType },
    } = this.chartOpt;
    points.forEach((_points) => {
      const xPointArr = _points[this.handleDataKey(xAxisType, this.sportType)];
      const yPointArr = _points[this.handleDataKey(yAxisType, this.sportType)];
      this.chart.chartPoint.push(
        xPointArr.map((_xPoint, idx) => {
          const _yPoint = yPointArr[idx];
          const {
            x: { max: xMax, min: xMin },
            y: { max: yMax, min: yMin },
          } = this.chart;
          // 取得象限圖表邊界
          this.chart.x.min = xMin === null || xMin > _xPoint ? _xPoint : xMin;
          this.chart.x.max = xMax === null || xMax < _xPoint ? _xPoint : xMax;
          this.chart.y.min = yMin === null || yMin > _yPoint ? _yPoint : yMin;
          this.chart.y.max = yMax === null || yMax < _yPoint ? _yPoint : yMax;

          // 取得各象限所佔比例
          this.chart.pointNum.total++;
          let pointColor: string;
          if (_xPoint > xOrigin && _yPoint > yOrigin) {
            this.chart.pointNum.quadrantI++;
            pointColor = this.color.quadrantI;
          } else if (_xPoint <= xOrigin && _yPoint > yOrigin) {
            this.chart.pointNum.quadrantII++;
            pointColor = this.color.quadrantII;
          } else if (_xPoint <= xOrigin && _yPoint <= yOrigin) {
            this.chart.pointNum.quadrantIII++;
            pointColor = this.color.quadrantIII;
          } else {
            this.chart.pointNum.quadrantIV++;
            pointColor = this.color.quadrantIV;
          }

          return {
            x: _xPoint,
            y: _yPoint,
            color: pointColor,
          };
        })
      );
    });

    const {
      x: { max: xMax, min: xMin },
      y: { max: yMax, min: yMin },
    } = this.chart;
    // 如數據皆在源點某側，則邊界取源點*1.2或源點*0.8
    this.chart.x.min = xMin > xOrigin ? xOrigin : xMin;
    this.chart.x.max = xMax < xOrigin ? xOrigin : xMax;
    this.chart.y.min = yMin > yOrigin ? yOrigin : yMin;
    this.chart.y.max = yMax < yOrigin ? yOrigin : yMax;

    // 補上padding
    const xPadding = (this.chart.x.max - this.chart.x.min) * 0.2;
    const yPadding = (this.chart.y.max - this.chart.y.min) * 0.2;
    this.chart.x.min = this.chart.x.min - xPadding;
    this.chart.x.max = this.chart.x.max + xPadding;
    this.chart.y.min = this.chart.y.min - yPadding;
    this.chart.y.max = this.chart.y.max + yPadding;

    const {
      x: { max: xNewMax, min: xNewMin },
      y: { max: yNweMax, min: yNewMin },
      chartSvgWidth,
      chartSvgHeight,
    } = this.chart;
    // 取得圖表軸線位置
    const yRange = yNweMax - yNewMin;
    const xRange = xNewMax - xNewMin;
    const xAxisYPosition = yRange
        ? +(((yNweMax - yOrigin) / yRange) * chartSvgHeight).toFixed(0)
        : 0,
      yAxisXPosition = xRange ? +(((xOrigin - xNewMin) / xRange) * chartSvgWidth).toFixed(0) : 0;
    this.chart.line = {
      xAxis: {
        x: [0, chartSvgWidth],
        y: xAxisYPosition,
      },
      yAxis: {
        x: yAxisXPosition,
        y: [0, chartSvgHeight],
      },
    };

    // 取得x、y軸數值標示位置
    const xLabelYPosition = yRange
        ? +(((yNweMax - (yNewMin - yPadding)) / yRange) * chartSvgHeight).toFixed(0)
        : 0,
      yLabelXPosition = xRange
        ? +(((xNewMin - xPadding - xNewMin) / xRange) * chartSvgWidth).toFixed(0)
        : 0;
    this.chart.label = {
      xAxis: {
        x: [0, chartSvgWidth / 2, chartSvgWidth],
        y: xLabelYPosition,
      },
      yAxis: {
        x: yLabelXPosition,
        y: [chartSvgHeight, chartSvgHeight / 2, 0],
      },
      size: 16,
    };

    // 計算該點在svg的位置
    this.chart.chartPoint.forEach((_points) => {
      _points.forEach((_point) => {
        this.chart.displayPoint.push({
          x: xRange ? Math.round(((_point.x - xNewMin) / xRange) * chartSvgWidth) : 0,
          y: yRange ? Math.round(((yNweMax - _point.y) / yRange) * chartSvgHeight) : 0,
          color: _point.color,
        });
      });
    });

    // 降噪
    this.chart.displayPoint = simplify(
      this.chart.displayPoint,
      this.getCoefficient(this.chart.displayPoint.length)
    );

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取得降噪係數
   * @param length {number}-數據長度
   * @author kidin-1100204
   */
  getCoefficient(length: number): number {
    let coefficient = 1;
    if (length > 10000) {
      coefficient = 12;
    } else if (length > 8000) {
      coefficient = 10;
    } else if (length > 6000) {
      coefficient = 8;
    } else if (length > 4000) {
      coefficient = 6;
    } else if (length > 2000) {
      coefficient = 4;
    } else if (length > 1000) {
      coefficient = 2;
    }

    return coefficient;
  }

  /**
   * 根據資料類別和運動類別回應api對應的key
   * @param dataType {QuadrantDataOpt}-資料類別
   * @param sportType {SportType}-運動類別
   * @author kidin-1100120
   */
  handleDataKey(dataType: QuadrantDataOpt, sportType: SportType): string {
    switch (dataType) {
      case 'hr':
        return 'heartRateBpm';
      case 'speed':
      case 'pace':
        return 'speed';
      case 'cadence':
        switch (sportType) {
          case SportType.run:
            return 'runCadence';
          case SportType.cycle:
            return 'cycleCadence';
          case SportType.swim:
            return 'swimCadence';
          case SportType.row:
            return 'rowingCadence';
        }
        break;
      case 'power':
        return sportType === 2 ? 'cycleWatt' : 'rowingWatt';
    }
  }

  /**
   * 顯示圖表設定選項
   * @param e {MouseEvent}
   * @author kidin-1100128
   */
  handleShowOptMenu(e: MouseEvent) {
    e.stopPropagation();
    if (!this.uiFlag.showChartOpt) {
      this.uiFlag.showChartOpt = true;
      this.tempOpt = deepCopy(this.chartOpt);
      this.subscribeClick();
    } else {
      this.uiFlag.showChartOpt = false;
      this.uiFlag.showDataSelector = false;
      this.ngUnsubscribeClick();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 訂閱點擊事件
   * @author kidin-1100128
   */
  subscribeClick() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      // 無聚焦再關閉設定框
      if (!this.uiFlag.focusInput) {
        this.uiFlag.showChartOpt = false;
        this.uiFlag.showDataSelector = null;
        this.restoreOrigin();
        this.ngUnsubscribeClick();
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 取消訂閱點擊事件
   * @author kidin-1100128
   */
  ngUnsubscribeClick() {
    this.clickEvent.unsubscribe();
  }

  /**
   * 輸入框聚焦
   * @param e {FocusEvent}
   * @author kidin-1100202
   */
  handleFocus(e: FocusEvent) {
    e.stopPropagation();
    this.uiFlag.focusInput = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 輸入框離焦
   * @param e {FocusEvent}
   * @author kidin-1100202
   */
  handleFocusout(e: FocusEvent) {
    this.uiFlag.focusInput = false;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 顯示或隱藏軸線資料類型選擇器
   * @param axis {Axis}-軸線
   * @author kidin-1100201
   */
  showAxisType(axis: Axis) {
    this.uiFlag.showDataSelector = this.uiFlag.showDataSelector === axis ? null : axis;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 切換軸線據類型，並變更origin為該類型預設值（變更類型則預設象限意義可能不適用，故清空）
   * @param type {QuadrantDataOpt}-數據類型
   * @author kidin-1100201
   */
  changeAxisType(type: QuadrantDataOpt) {
    const axis = this.uiFlag.showDataSelector;
    this.tempOpt[axis].type = type;
    this.tempOpt[axis].origin = this.changeAxisOrigin(type, this.sportType);
    this.handleAxisInput(
      axis,
      this.tempOpt[axis].type,
      this.tempOpt[axis].origin,
      this.sportType,
      this.unit
    );
    this.uiFlag.optTempChange = true;
    this.uiFlag.showDataSelector = null;

    // 若無變更過象限意義，則將象限意義清除
    if (!this.tempOpt.customMeaning) {
      this.tempOpt.meaning = {
        quadrantI: '',
        quadrantII: '',
        quadrantIII: '',
        quadrantIV: '',
      };

      this.tempOpt.customMeaning = true;
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 依軸線類型變更預設值
   * @param axisType {QuadrantDataOpt}-象限圖可設定的類型
   * @param sportType {SportType}-運動類型
   * @author kidin-1100202
   */
  changeAxisOrigin(axisType: QuadrantDataOpt, sportType: SportType) {
    switch (axisType) {
      case 'hr':
        return this.hrRange.z4;
      case 'speed':
        return 30;
      case 'pace':
        return this.getDefaultPace(sportType);
      case 'cadence':
        switch (sportType) {
          case SportType.run:
            return 180;
          case SportType.cycle:
            return 100;
          case SportType.swim:
            return 30;
          case SportType.row:
            return 40;
        }
        break;
      case 'power':
        return sportType === 2 ? 350 : 400;
    }
  }

  /**
   * 根據運動類別取得預設配速
   * @param type {SportType}
   * @author kidin-1100202
   */
  getDefaultPace(type: SportType) {
    switch (type) {
      case SportType.run:
        return 10;
      case SportType.swim:
        return 4.5;
      case SportType.row:
        return 15;
    }
  }

  /**
   * 編輯軸線源點
   * @param axis {Axis}-軸線
   * @param e {Event}
   * @author kidin-1100202
   */
  editAxisOrigin(axis: Axis, e: Event) {
    const editValue = (e as any).target.value;
    let finalValue: number;
    if (this.tempOpt[axis].type === 'pace') {
      const paceReg = /(^([0-5]?\d)'[0-5]\d")|(60'00")/;
      if (paceReg.test(editValue)) {
        const totalSecond = +editValue.split(`'`)[0] * 60 + +editValue.split(`'`)[1].split(`"`)[0];
        switch (this.sportType) {
          case SportType.run:
            finalValue =
              this.unit === 1
                ? +((3600 / totalSecond) * mi).toFixed(2)
                : +(3600 / totalSecond).toFixed(2);
            break;
          case SportType.swim:
            finalValue = +(3600 / (totalSecond * 10)).toFixed(2);
            break;
          case SportType.row:
            finalValue = +(3600 / (totalSecond * 2)).toFixed(2);
            break;
        }
      } else {
        finalValue = this.getDefaultPace(this.sportType);
      }
    } else {
      const numReg = /^[0-9]+$/;
      if (!numReg.test(editValue)) {
        finalValue = this.changeAxisOrigin(this.tempOpt[axis].type, this.sportType) as number;
      } else {
        finalValue =
          this.tempOpt[axis].type === 'speed' && this.unit === 1 ? +editValue * mi : +editValue;
      }
    }

    this.tempOpt[axis].origin = finalValue;
    this.handleAxisInput(
      axis,
      this.tempOpt[axis].type,
      this.tempOpt[axis].origin,
      this.sportType,
      this.unit
    );

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 編輯象限意義
   * @param quadrant {Quadrant}-象限
   * @param e {Event}
   * @author kidin-1100202
   */
  editQuadrantMeaning(quadrant: Quadrant, e: Event) {
    this.tempOpt.customMeaning = true;
    this.tempOpt.meaning[quadrant] = (e as any).target.value;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 關閉圖表設定選單重新繪製圖表
   * @author kidin-1100202
   */
  redrawChart() {
    this.uiFlag.showChartOpt = false;
    this.uiFlag.optTempChange = false;
    this.ngUnsubscribeClick();
    this.initData();
    this.createChart(this.userPoint);
  }

  /**
   * 象限圖設定恢復預設值並重繪圖表
   * @author kidin-1100202
   */
  restoreDefaultOpt() {
    this.chartOpt = deepCopy(this.defaultOpt);
    this.restoreOrigin();
    this.redrawChart();
    setLocalStorageObject(`quadrantOpt__${this.sportType}`, JSON.stringify(this.chartOpt));
  }

  /**
   * 將源點恢復成修改前的狀態
   * @author kidin-1100202
   */
  restoreOrigin() {
    this.handleAxisInput(
      'xAxis',
      this.chartOpt['xAxis'].type,
      this.chartOpt['xAxis'].origin,
      this.sportType,
      this.unit
    );

    this.handleAxisInput(
      'yAxis',
      this.chartOpt['yAxis'].type,
      this.chartOpt['yAxis'].origin,
      this.sportType,
      this.unit
    );
  }

  /**
   * 儲存象限圖設定並重繪圖表
   * @author kidin-1100202
   */
  saveChartOpt() {
    this.chartOpt = deepCopy(this.tempOpt);
    this.redrawChart();
    setLocalStorageObject(`quadrantOpt__${this.sportType}`, JSON.stringify(this.chartOpt));
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
