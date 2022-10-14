import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  NgModule,
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
import { MapReservedSpace, RacerMarkInGoogleMap } from '../../core/classes';
import { deepCopy } from '../../shared/utils';
import {
  TAIWAN_CENTER_LATLNG,
  MAP_START_ICON_PATH,
  MAP_END_ICON_PATH,
  MAP_CURRENT_ICON_PATH,
} from '../../core/models/const';
import 'heatmap.js';
import { RacerInfo } from '../../core/models/compo';
import { transform, WGS84, GCJ02 } from 'gcoord';
import { chinaBorder } from '../../core/models/const';

// 若google api掛掉則建物件代替，避免造成gptfit卡住。
const google: any = (window as any).google || { maps: { OverlayView: null } };

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleMapComponent implements OnInit, OnChanges, OnDestroy {
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
   * google map 物件
   * @refrence https://developers.google.com/maps/documentation/javascript
   */
  googleMap: any;

  /**
   * 符合google map 格式的路徑
   */
  googleMapPath: Array<any>;

  /**
   * google map 地圖類別
   */
  mapKind: 'roadmap' | 'satellite' | 'hybrid' = 'roadmap';

  /**
   * 地圖設定
   */
  mapSetting = {
    zoom: 15,
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
  racerMarkList: Map<number, RacerMarkInGoogleMap>;

  /**
   * 該路徑是否在中國
   */
  pathInChina = false;

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
        map(() => this.checkPath(this.path)),
        map((data) => this.createGooglePath(data))
      )
      .subscribe((result) => this.createMap(result));
  }

  /**
   * 將變數初始化
   */
  initVarible() {
    if (this.racerMarkList) this.racerMarkList.clear();
  }

  /**
   * 確認路徑是否在中國，在中國則需糾偏
   * 同時根據原始路徑取得必要參數，以用來修正原始路徑與地圖視圖
   * @param originPath {Array<[number, number]>}-未糾偏的路徑
   */
  checkPath(originPath: Array<[number, number]>) {
    const [startLat, startLng] = originPath[0];
    const isRoadMap = this.mapKind === 'roadmap';
    const inChina = this.handleBorderData([startLng, startLat], chinaBorder);
    const effectIndexList: Array<number> = [];
    const newPath = originPath.map(([_lat, _lng], _index) => {
      let [_correctionLat, _correctionLng] = [_lat, _lng];
      if (isRoadMap && inChina) {
        const transformPoint = transform([_lng, _lat], WGS84, GCJ02);
        [_correctionLng, _correctionLat] = transformPoint as [number, number];
      }

      if (_correctionLng && _correctionLat) {
        this.reservedSpace.boundaryLat = _correctionLat;
        this.reservedSpace.boundaryLng = _correctionLng;
        effectIndexList.push(_index);
      }

      return [_correctionLat, _correctionLng] as [number, number];
    });

    return { newPath, effectIndexList };
  }

  /**
   * 生成有效路徑
   * @param data {{ newPath: Array<[number, number]>; effectIndexList: Array<number>;}}-路徑中有效座標的序列
   */
  createGooglePath(data: { newPath: Array<[number, number]>; effectIndexList: Array<number> }) {
    const { newPath, effectIndexList } = data;
    // 將無效點以該點後面的有效點進行填補
    let i = 0;
    const bounds = new google.maps.LatLngBounds();
    const mapPath = newPath.map(([_lat, _lng], _index) => {
      const effectIndex = effectIndexList[i];
      let [_effectLat, _effectLng] = [_lat, _lng];
      if (_index !== effectIndex) {
        [_effectLat, _effectLng] = newPath[effectIndex];
      } else {
        i++;
      }

      const _mapPoint = new google.maps.LatLng(_effectLat, _effectLng);
      bounds.extend(_mapPoint);
      return _mapPoint;
    });

    if (this.usePage === 'sportsFile') {
      const { horizonCenter, verticalCenter } = this.reservedSpace.mapCenter;
      const paddingPoint = new google.maps.LatLng(verticalCenter, horizonCenter);
      bounds.extend(paddingPoint);
    }

    return { bounds, mapPath };
  }

  /**
   * 初始化地圖
   * @param data {{ bounds: any; mapPath: Array<any> }}
   */
  createMap(data: { bounds: any; mapPath: Array<any> }) {
    // 用setTimeout待畫面渲染後再產生地圖
    setTimeout(() => {
      if (this.mapContainer) {
        const { bounds, mapPath } = data;
        this.googleMapPath = mapPath;
        const container = this.mapContainer.nativeElement;
        const [centerLat, centerLng] = TAIWAN_CENTER_LATLNG;
        const centerPoint = new google.maps.LatLng(centerLat, centerLng);
        const option = {
          ...this.mapSetting,
          center: centerPoint,
          mapTypeId: this.mapKind,
          gestureHandling: 'cooperative', // 讓使用者在手機環境下使用單止滑頁面，雙指滑地圖
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        };

        this.googleMap = new google.maps.Map(container, option);
        this.googleMap.fitBounds(bounds); // 將地圖縮放至可看到整個路線
        this.addStartEndMark(mapPath);
        this.addPathLine(mapPath);
        this.initUserMark(mapPath);
      }
    });
  }

  /**
   * 在地圖中添加路線起點與終點
   * @param path {any}-gpx路線
   */
  addStartEndMark(path: any) {
    const startLatLng = path[0];
    const endLatLng = path[path.length - 1];
    const startMark = new google.maps.Marker({
      position: startLatLng,
      icon: MAP_START_ICON_PATH,
      title: 'Start point',
    });
    const endMark = new google.maps.Marker({
      position: endLatLng,
      icon: MAP_END_ICON_PATH,
      title: 'End point',
    });

    startMark.setMap(this.googleMap);
    endMark.setMap(this.googleMap);
  }

  /**
   * 根據地圖類別添加路線
   * @param path {any}-gpx路線
   */
  addPathLine(path: any) {
    let displayMap: any;
    switch (this.mapType) {
      case 'heat': {
        displayMap = new google.maps.visualization.HeatmapLayer({
          data: path,
          radius: 20,
          opacity: 1,
        });

        break;
      }
      default: {
        displayMap = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#FF00AA',
          strokeOpacity: 0.7,
          strokeWeight: 4,
        });

        break;
      }
    }

    displayMap.setMap(this.googleMap);
  }

  /**
   * 取得熱力圖可用的路線資料格式
   * @param path {any}-gpx路線
   */
  getHeatMapPath(path: any) {
    const data = path.map((_path) => {
      const [lat, lng] = _path;
      return { lat, lng, count: 1 };
    });

    return { data };
  }

  /**
   * 根據頁面將使用者標記進行初始化
   * @param path {any}-gpx路線
   */
  initUserMark(path: any) {
    const startLatLng = path[0];
    switch (this.usePage) {
      case 'cloudrunReport':
        break;
      default:
        this.currentMark = new google.maps.Marker({
          position: startLatLng,
          icon: MAP_CURRENT_ICON_PATH,
          title: 'User',
        });

        this.currentMark.setMap(this.googleMap);
        break;
    }
  }

  /**
   * 變更使用者目前標記位置
   */
  changeFocusPosition() {
    const { googleMapPath, currentMarkPosition } = this;
    const currentPosition = googleMapPath[currentMarkPosition];
    if (currentPosition[0] !== null) this.currentMark.setPosition(currentPosition);
  }

  /**
   * 新增跑者
   * @param racer {RacerInfo}-跑者資訊
   */
  addRacer(racer: RacerInfo) {
    if (racer) {
      const { name, imgUrl, fileId, color } = racer;
      const option = { name, imgUrl, color };
      const racerMark = new RacerMarkInGoogleMap(this.googleMapPath[0], option);
      racerMark.setMap(this.googleMap);
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
      this.racerMarkList.get(racer).onRemove();
      this.racerMarkList.delete(racer);
    }
  }

  /**
   * 移除所有跑者
   */
  removeAll() {
    if (this.racerMarkList) {
      this.racerMarkList.forEach((_value) => _value.onRemove());
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
    if (mark) mark.adjustIconSize(false);
  }

  /**
   * 聚焦跑者
   * @param racer {number}-該跑者其運動紀錄的fileId
   */
  focusRacer(racer: number) {
    const mark = this.racerMarkList.get(racer);
    if (racer) mark.adjustIconSize(true);
  }

  /**
   * 變更跑者位置
   * @param racerPositionList {Map<number, [number, number]>}-跑者位置
   */
  changeRacerPosition(racerPositionList: Map<number, [number, number]>) {
    if (racerPositionList) {
      racerPositionList.forEach(([_lat, _lng], _fileId) => {
        const _position = new google.maps.LatLng(_lat, _lng);
        this.racerMarkList.get(_fileId).move(_position);
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

  ngOnDestroy(): void {}
}

@NgModule({
  declarations: [GoogleMapComponent],
  exports: [GoogleMapComponent],
  imports: [CommonModule, TranslateModule],
})
export class GoogleMapModule {}
