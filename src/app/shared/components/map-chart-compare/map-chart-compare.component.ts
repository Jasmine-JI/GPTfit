import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HintDialogService } from '../../../core/services';
import { SportType } from '../../../core/enums/sports';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { DataTypeTranslatePipe } from '../../../core/pipes/data-type-translate.pipe';
import { TrinomialChartComponent } from '../chart/trinomial-chart/trinomial-chart.component';
import { LeafletMapComponent } from '../../../components/leaflet-map/leaflet-map.component';
import { GoogleMapComponent } from '../../../components/google-map/google-map.component';
import { NgIf } from '@angular/common';
import { MapSource } from '../../../core/enums/compo';

declare let google: any;

type MapKind = 'normal' | 'heat';
type CompareDataOpt =
  | 'hr'
  | 'speed'
  | 'pace'
  | 'cadence'
  | 'power'
  | 'temperature'
  | 'gforceX'
  | 'gforceY'
  | 'gforceZ';

@Component({
  selector: 'app-map-chart-compare',
  templateUrl: './map-chart-compare.component.html',
  styleUrls: ['./map-chart-compare.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    GoogleMapComponent,
    LeafletMapComponent,
    TrinomialChartComponent,
    TranslateModule,
    DataTypeTranslatePipe,
  ],
})
export class MapChartCompareComponent implements OnInit, OnChanges, OnDestroy {
  @Input() userPoint: Array<any>;
  @Input() sportType: SportType;
  @Input() isNormalCoordinate: any;
  @Input() sysAccessRight: number;
  @Input() unit: number;
  @Output() chartSetting: EventEmitter<string> = new EventEmitter();
  @ViewChild('gMap') gMap: ElementRef;

  private ngUnsubscribe = new Subject();

  /**
   * ui會用到的各種flag
   */
  uiFlag = {
    showMap: false,
    showMapOpt: false,
    showDataSelector: <string | null>null,
    isPreviewMode: false,
  };

  /**
   * 地圖設定
   */
  mapOpt = {
    showMapSourceSelector: true,
    mapSource: MapSource.google, // 地圖來源
    mapKind: <MapKind>'normal', // 街道圖/熱力圖
    compareA: {
      type: <CompareDataOpt | null>null,
      name: '',
      color: 'rgba(155, 194, 71, 1)',
      data: [],
    },
    compareB: {
      type: <CompareDataOpt | null>null,
      name: '',
      color: 'rgba(252, 124, 124, 1)',
      data: [],
    },
    terrain: [],
    second: [],
  };

  clickEvent: Subscription;

  focusPosition = 0;

  readonly MapSource = MapSource;

  constructor(
    private hintDialogService: HintDialogService,
    private translate: TranslateService,
    private dataTypeTranslatePipe: DataTypeTranslatePipe,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    // 經緯度座標皆為異常值，則不顯示地圖
    if (this.isNormalCoordinate || this.userPoint.length > 1) {
      this.mapOpt.mapKind = this.sportType === 7 ? 'heat' : 'normal'; // 僅球類運動顯示熱力圖
      this.checkMapLoaded();
    } else {
      this.uiFlag.showMap = false;
    }

    if (location.search.includes('ipm=s')) {
      this.setChartSetting();
    } else {
      this.handleDefaultCompareData(this.sportType);
    }
  }

  /**
   * 確認各個地圖套件有載入，兩個都無法載入就隱藏地圖
   */
  checkMapLoaded() {
    // 判斷leaflet map是否可以載入
    if ('L' in window) {
      this.uiFlag.showMap = true;
      this.mapOpt.mapSource = MapSource.osm;
    } else {
      this.mapOpt.showMapSourceSelector = false;
    }

    // 判斷google map是否可以載入
    if ('google' in window && typeof google === 'object' && typeof google.maps === 'object') {
      this.uiFlag.showMap = true;
      this.mapOpt.mapSource = MapSource.google;
    } else {
      this.mapOpt.showMapSourceSelector = false;
    }
  }

  /**
   * 確認是否為預覽列印頁面
   * @author kidin-1100225
   */
  setChartSetting() {
    const queryString = location.search.split('?')[1];
    if (queryString && queryString.length > 0) {
      const queryArr = queryString.split('&');
      let correctNum = 0;
      queryArr.forEach((_queryArr) => {
        const query = _queryArr.split('='),
          key = query[0],
          value = query[1];
        switch (key) {
          case 'mapSource':
            this.changeMapSource(+value as MapSource);
            break;
          case 'compareA':
            this.uiFlag.showDataSelector = 'compareA';
            this.changeCompareData(value as CompareDataOpt);
            correctNum++;
            break;
          case 'compareB':
            this.uiFlag.showDataSelector = 'compareB';
            this.changeCompareData(value as CompareDataOpt);
            correctNum++;
            break;
        }

        this.uiFlag.showDataSelector = null;
      });

      // 確認queryString正確帶有compareA和compareB這兩個key，避免圖表異常顯示
      if (correctNum !== 2) {
        this.handleDefaultCompareData(this.sportType);
      } else {
        this.mapOpt.terrain = [1, 2].includes(this.sportType)
          ? this.userPoint[0].altitudeMeters
          : [];
        this.mapOpt.second = this.userPoint[0].pointSecond;
      }
    } else {
      this.handleDefaultCompareData(this.sportType);
    }
  }

  /**
   * 判斷是否支援canvas
   * @author kidin-1100118
   */
  checkCanvasSupport(): boolean {
    const testArea = document.createElement('canvas');
    if (testArea.getContext && testArea.getContext('2d')) {
      return true;
    } else {
      const msg = 'Browser not support heat map!';
      this.hintDialogService.openAlert(msg);
      return false;
    }
  }

  /**
   * 根據運動類別預設比較圖表的資料類型
   * @param type {SportType}-運動類別
   * @author kidin-1100120
   */
  handleDefaultCompareData(type: SportType) {
    const pipeArgs = { sportsType: type, unitType: this.unit };
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        switch (type) {
          case SportType.run:
            this.mapOpt.compareA = {
              type: 'hr',
              name: this.translate.instant(this.dataTypeTranslatePipe.transform('hr', pipeArgs)),
              color: this.mapOpt.compareA.color,
              data: this.userPoint[0][this.handleDataKey('hr', type)],
            };

            this.mapOpt.compareB = {
              type: 'pace',
              name: this.translate.instant(this.dataTypeTranslatePipe.transform('pace', pipeArgs)),
              color: this.mapOpt.compareB.color,
              data: this.userPoint[0][this.handleDataKey('pace', type)],
            };

            break;
          case SportType.cycle:
          case SportType.ball:
            this.mapOpt.compareA = {
              type: 'hr',
              name: this.translate.instant(this.dataTypeTranslatePipe.transform('hr', pipeArgs)),
              color: this.mapOpt.compareA.color,
              data: this.userPoint[0][this.handleDataKey('hr', type)],
            };

            this.mapOpt.compareB = {
              type: 'speed',
              name: this.translate.instant(this.dataTypeTranslatePipe.transform('speed', pipeArgs)),
              color: this.mapOpt.compareB.color,
              data: this.userPoint[0][this.handleDataKey('speed', type)],
            };

            break;
          case SportType.swim:
          case SportType.row:
            this.mapOpt.compareA = {
              type: 'pace',
              name: this.translate.instant(this.dataTypeTranslatePipe.transform('pace', pipeArgs)),
              color: this.mapOpt.compareA.color,
              data: this.userPoint[0][this.handleDataKey('pace', type)],
            };

            this.mapOpt.compareB = {
              type: 'cadence',
              name: this.translate.instant(
                this.dataTypeTranslatePipe.transform('cadence', pipeArgs)
              ),
              color: this.mapOpt.compareB.color,
              data: this.userPoint[0][this.handleDataKey('cadence', type)],
            };

            break;
        }

        this.mapOpt.terrain = [1, 2].includes(this.sportType)
          ? this.userPoint[0].altitudeMeters
          : [];
        this.mapOpt.second = this.userPoint[0].pointSecond;
      });
  }

  /**
   * 切換地圖來源
   * @param source {MapSource}-地圖來源
   * @author kidin-1100114
   */
  changeMapSource(source: MapSource) {
    this.mapOpt.mapSource = source;
    this.uiFlag.showDataSelector = null;
    this.chartSettingEmit();
  }

  /**
   * 切換地圖類別
   * @param kind {MapKind}-地圖類別
   * @author kidin-1100114
   */
  changeMapKind(kind: MapKind) {
    this.mapOpt.mapKind = kind;
    this.uiFlag.showDataSelector = null;
  }

  /**
   * 切換比較類別
   * @param idx {'compareA' | 'compareB'}
   * @param type {type}-欲比較的項目類別
   * @author kidin-1100114
   */
  changeCompareData(type: CompareDataOpt) {
    const {
      uiFlag: { showDataSelector },
      sportType,
      unit,
    } = this;
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        if (showDataSelector) {
          this.mapOpt[showDataSelector] = {
            type,
            name: this.translate.instant(
              this.dataTypeTranslatePipe.transform(type, { sportsType: sportType, unitType: unit })
            ),
            color: this.mapOpt[showDataSelector].color,
            data: this.userPoint[0][this.handleDataKey(type, this.sportType)],
          };
        }
      });

    this.uiFlag.showDataSelector = null;
    this.chartSettingEmit();
  }

  /**
   * 顯示地圖/比較圖設定選項
   * @param e {MouseEvent}
   * @author kidin-1100114
   */
  handleShowOptMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showMapOpt } = this.uiFlag;
    if (showMapOpt) {
      this.uiFlag.showMapOpt = false;
      this.ngUnsubscribeClick();
    } else {
      this.uiFlag.showMapOpt = true;
      this.subscribeClick();
    }

    this.uiFlag.showDataSelector = null;
  }

  /**
   * 訂閱點擊事件
   * @author kidin-1100114
   */
  subscribeClick() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.uiFlag.showMapOpt = false;
      this.ngUnsubscribeClick();
      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 取消訂閱點擊事件
   * @author kidin-1100114
   */
  ngUnsubscribeClick() {
    if (this.clickEvent) this.clickEvent.unsubscribe();
  }

  /**
   * 顯示下拉式選單與否
   * @param e {MouseEvent}
   * @param list {'compareA' | 'compareB'}-使用者欲選擇的資料欄位
   * @author kidin-1100119
   */
  handleShowDropList(e: MouseEvent, list: 'compareA' | 'compareB') {
    e.stopPropagation();
    this.uiFlag.showDataSelector = this.uiFlag.showDataSelector === list ? null : list;
  }

  /**
   * 根據資料類別和運動類別回應api對應的key
   * @param dataType {CompareDataOpt}-資料類別
   * @param sportType {SportType}-運動類別
   * @author kidin-1100120
   */
  handleDataKey(dataType: CompareDataOpt, sportType: SportType): string {
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
          default:
            return 'cadence';
        }
        break;
      case 'power':
        return sportType === SportType.cycle ? 'cycleWatt' : 'rowingWatt';
      case 'temperature':
        return 'temp';
      case 'gforceX':
        return 'gsensorXRawData';
      case 'gforceY':
        return 'gsensorYRawData';
      case 'gforceZ':
        return 'gsensorZRawData';
      default:
        return '';
    }
  }

  /**
   * 根據使用者滑鼠在圖表的位置，移動地圖的記號
   * @param e {number}-point位置
   * @author kidin-1100121
   */
  movePoint(e: number) {
    this.focusPosition = e;
  }

  /**
   * 將圖表設定傳至父組件以方便設定預覽列印url querystring
   * @author kidin-1100225
   */
  chartSettingEmit() {
    const setting = `mapSource=${this.mapOpt.mapSource}&compareA=${this.mapOpt.compareA.type}&compareB=${this.mapOpt.compareB.type}`;
    this.chartSetting.emit(setting);
  }

  /**
   * 找出路線中有效的起始座標
   * @param coordinate {Array<[number, number]>}-經度緯度陣列
   * @author kidin-1100226
   */
  findEffectIndex(coordinate: Array<[number, number]>) {
    let index: number | null = null;
    for (let i = 0, len = coordinate.length; i < len; i++) {
      const [_lon, _lat] = coordinate[i];
      if (_lon !== null && _lon !== 100 && _lat !== null && _lat !== 100) {
        index = i;
        break;
      }
    }

    return index;
  }

  /**
   * 確認該點是否在該範圍內
   * @param point {Array<number>}-座標
   * @param borderArr {Array<Array<number>>}-地區邊界座標
   */
  handleBorderData(point: Array<number>, borderArr: Array<Array<number>>) {
    const x = point[0],
      y = point[1];
    let inside = false;
    for (let i = 0, j = borderArr.length - 1; i < borderArr.length; j = i++) {
      const xi = borderArr[i][0];
      const yi = borderArr[i][1];
      const xj = borderArr[j][0];
      const yj = borderArr[j][1];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
