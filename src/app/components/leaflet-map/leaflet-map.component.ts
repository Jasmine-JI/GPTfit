import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  SimpleChanges,
  SimpleChange,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { MapReservedSpace, RacerMarkInLeafletMap } from '../../core/classes';
import { deepCopy } from '../../core/utils';
import {
  TAIWAN_CENTER_LATLNG,
  MAP_START_ICON_PATH,
  MAP_END_ICON_PATH,
  MAP_CURRENT_ICON_PATH,
} from '../../core/models/const';
import 'heatmap.js';
import { RacerInfo } from '../../core/models/compo';

declare const HeatmapOverlay: any;
const leaflet = globalThis.L;

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeafletMapComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer') mapContainer: ElementRef;
  @Input() usePage: 'sportsFile' | 'cloudrunReport';
  @Input() mapType: 'normal' | 'heat' = 'normal';
  @Input() path: Array<[number, number]>;
  @Input() currentMarkPosition: any;
  @Input() currentRacerPosition: Map<number, [number, number]>;
  @Input() newRacer: RacerInfo;
  @Input() delRacer: number;
  @Input() currentFocusRacer: number;
  @Input() playSecond: number;
  @Input() removeAllRacer = true;
  @Output() mapError = new EventEmitter();

  /**
   * leaflet物件
   * @refrence https://leafletjs.com/reference.html#map-example
   */
  leafletMap: any;

  /**
   * 地圖設定
   */
  mapSetting = {
    zoom: 4,
    minZoom: 4,
    maxZoom: 18,
  };

  /**
   * 熱力圖設定
   */
  heatMapSetting = {
    container: <ElementRef | null>null,
    radius: 10,
    maxOpacity: 0.5,
    minOpacity: 0,
    blur: 0.75,
  };

  /**
   * 用來取得保留比較圖表的空間
   */
  reservedSpace = new MapReservedSpace();

  /**
   * 目前聚焦位置標記
   */
  currentMark: any;

  /**
   * 所有雲跑參賽者
   */
  racerMarkList: Map<number, RacerMarkInLeafletMap>;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(e: SimpleChanges): void {
    const {
      path,
      currentMarkPosition,
      newRacer,
      delRacer,
      currentFocusRacer,
      playSecond,
      removeAllRacer,
    } = e;
    if (path && path.currentValue) this.initMap();
    if (currentMarkPosition && !currentMarkPosition.firstChange) this.changeFocusPosition();
    if (newRacer) this.addRacer(newRacer.currentValue);
    if (delRacer) this.removeRacer(delRacer.currentValue);
    if (currentFocusRacer) this.changeRacerFocus(currentFocusRacer);
    if (playSecond) this.changeRacerPosition(this.currentRacerPosition);
    if (removeAllRacer && removeAllRacer.currentValue) this.removeAll();
  }

  /**
   * 初始化地圖
   */
  initMap() {
    of('')
      .pipe(
        map(() => this.initVarible()),
        map(() => this.getNeedData()),
        map((effectIndex) => this.createLeafletPath(effectIndex))
      )
      .subscribe((leafletPath) => this.createMap(leafletPath));
  }

  /**
   * 將變數初始化
   */
  initVarible() {
    if (this.leafletMap) this.leafletMap.remove();
    if (this.racerMarkList) this.racerMarkList.clear();
  }

  /**
   * 根據原始路徑取得必要參數，以用來修正原始路徑與地圖視圖
   */
  getNeedData() {
    const effectIndexList: Array<number> = [];
    this.path.forEach(([_lat, _lng], _index) => {
      if (_lng && _lat) {
        this.reservedSpace.boundaryLat = _lat;
        this.reservedSpace.boundaryLng = _lng;
        effectIndexList.push(_index);
      }
    });

    return effectIndexList;
  }

  /**
   * 生成有效路徑
   * @param effectIndexList {Array<number>}-路徑中有效座標的序列
   */
  createLeafletPath(effectIndexList: Array<number>): Array<[number, number]> {
    // 將無效點以該點後面的有效點進行填補
    let i = 0;
    const { path } = this;
    return path.map((_path, _index) => {
      const effectIndex = effectIndexList[i];
      if (_index !== effectIndex) {
        const [_effectLat, _effectLng] = path[effectIndex];
        return [_effectLat, _effectLng];
      }

      i++;
      return _path;
    });
  }

  /**
   * 初始化地圖
   * @param leafletPath {Array<[number, number]>}
   */
  createMap(leafletPath: Array<[number, number]>) {
    // 用setTimeout待畫面渲染後再產生地圖
    setTimeout(() => {
      if (this.mapContainer) {
        const container = this.mapContainer.nativeElement;
        const option = {
          ...this.mapSetting,
          center: TAIWAN_CENTER_LATLNG,
          scrollWheelZoom: false,
          dragging: false,
        };
        this.leafletMap = leaflet.map(container, option);
        leaflet
          .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
          })
          .addTo(this.leafletMap);

        const boundPath = deepCopy(leafletPath);
        const { horizonCenter, verticalCenter } = this.reservedSpace.mapCenter;
        if (this.usePage === 'sportsFile') boundPath.push([verticalCenter, horizonCenter]);
        this.leafletMap.fitBounds(boundPath);
        this.addStartEndMark(leafletPath);
        this.addPathLine(leafletPath);
        this.initUserMark(leafletPath);
      }
    });
  }

  /**
   * 在地圖中添加路線起點與終點
   * @param path {Array<[number, number]>}-gpx路線
   */
  addStartEndMark(path: Array<[number, number]>) {
    const startLatLng = path[0];
    const endLatLng = path[path.length - 1];
    const startMark = leaflet.marker(startLatLng, {
      icon: this.getMarkIcon(MAP_START_ICON_PATH, false),
    });
    const endMark = leaflet.marker(endLatLng, {
      icon: this.getMarkIcon(MAP_END_ICON_PATH, false),
    });

    startMark.addTo(this.leafletMap);
    endMark.addTo(this.leafletMap);
  }

  /**
   * 根據地圖類別添加路線
   * @param path {Array<[number, number]>}-gpx路線
   */
  addPathLine(path: Array<[number, number]>) {
    switch (this.mapType) {
      case 'heat': {
        const heatLayerConfig = {
          radius: 5,
          maxOpacity: 0.8,
          scaleRadius: false,
          // property below is responsible for colorization of heat layer
          useLocalExtrema: true,
          // here we need to assign property value which represent lat in our data
          latField: 'lat',
          // here we need to assign property value which represent lng in our data
          lngField: 'lng',
          // here we need to assign property value which represent valueField in our data
          valueField: 'count',
        };

        const heatmapLayer = new HeatmapOverlay(heatLayerConfig);
        heatmapLayer.setData(this.getHeatMapPath(path));
        heatmapLayer.addTo(this.leafletMap);
        break;
      }
      default: {
        const pathLine = leaflet.polyline(path, { color: '#FF00AA' });
        pathLine.addTo(this.leafletMap);
        break;
      }
    }
  }

  /**
   * 取得熱力圖可用的路線資料格式
   * @param path {Array<[number, number]>}-gpx路線
   */
  getHeatMapPath(path: Array<[number, number]>) {
    const data = path.map((_path) => {
      const [lat, lng] = _path;
      return { lat, lng, count: 1 };
    });

    return { data };
  }

  /**
   * 根據頁面將使用者標記進行初始化
   * @param path {Array<[number, number]>}-gpx路線
   */
  initUserMark(path: Array<[number, number]>) {
    const startLatLng = path[0];
    switch (this.usePage) {
      case 'cloudrunReport':
        break;
      default:
        this.currentMark = leaflet.marker(startLatLng, {
          icon: this.getMarkIcon(MAP_CURRENT_ICON_PATH, true),
        });
        this.currentMark.addTo(this.leafletMap);
        break;
    }
  }

  /**
   * 取得標記設定
   * @param iconUrl {string}-標記icon路徑
   * @param isFocusMark {boolean}-是否為聚焦的標記
   */
  getMarkIcon(iconUrl: string, isFocusMark: boolean) {
    const iconSize = isFocusMark ? [12, 12] : [33, 50];
    const iconAnchor = isFocusMark ? [6, 6] : [16, 45];
    return leaflet.icon({ iconUrl, iconSize, iconAnchor });
  }

  /**
   * 變更使用者目前標記位置
   */
  changeFocusPosition() {
    const { path, currentMarkPosition } = this;
    const currentPosition = path[currentMarkPosition];
    if (currentPosition[0] !== null) this.currentMark.setLatLng(currentPosition);
  }

  /**
   * 新增跑者
   * @param racer {RacerInfo}-跑者資訊
   */
  addRacer(racer: RacerInfo) {
    if (racer) {
      const { name, imgUrl, fileId, color } = racer;
      const option = { name, imgUrl, color };
      const racerMark = new RacerMarkInLeafletMap(this.path[0], option);
      racerMark.mapMarker.addTo(this.leafletMap);
      if (!this.racerMarkList) this.racerMarkList = new Map();
      this.racerMarkList.set(fileId, racerMark);
    }
  }

  /**
   * 移除跑者
   * @param racer {number}-該跑者其運動紀錄的fileId
   */
  removeRacer(racer: number) {
    if (racer) {
      this.racerMarkList.get(racer).remove();
      this.racerMarkList.delete(racer);
    }
  }

  /**
   * 移除所有跑者
   */
  removeAll() {
    if (this.racerMarkList) {
      this.racerMarkList.forEach((_value) => _value.remove());
      this.racerMarkList.clear();
    }
  }

  /**
   * 處理聚焦跑者變更
   * @param racerChange {SimpleChange}-聚焦跑者變更
   */
  changeRacerFocus(racerChange: SimpleChange) {
    const { currentValue, previousValue } = racerChange;
    if (previousValue) this.blurRacer(previousValue);
    if (currentValue) this.focusRacer(currentValue);
  }

  /**
   * 離焦跑者
   * @param racer {number}-該跑者其運動紀錄的fileId
   */
  blurRacer(racer: number) {
    const mark = this.racerMarkList.get(racer);
    if (mark) {
      mark.adjustIconSize(false);
    }
  }

  /**
   * 聚焦跑者
   * @param racer {number}-該跑者其運動紀錄的fileId
   */
  focusRacer(racer: number) {
    const mark = this.racerMarkList.get(racer);
    if (racer) {
      mark.adjustIconSize(true);
    }
  }

  /**
   * 變更跑者位置
   * @param racerPositionList {Map<number, [number, number]>}-跑者位置
   */
  changeRacerPosition(racerPositionList: Map<number, [number, number]>) {
    if (racerPositionList) {
      racerPositionList.forEach((_value, _fileId) => {
        this.racerMarkList.get(_fileId).move(_value);
      });
    }
  }

  /**
   * 根據地圖放大比例取得icon合適大小
   * @param isFocus {boolean}-是否聚焦
   */
  getRacerIconSize(isFocus: boolean) {
    return isFocus ? 50 : 30;
  }

  ngOnDestroy(): void {}
}
