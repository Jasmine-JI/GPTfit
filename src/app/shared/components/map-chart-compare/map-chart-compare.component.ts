import { Component, OnInit, OnChanges, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { transform, WGS84, BD09 } from 'gcoord';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from '../../services/utils.service';
import { SportType } from '../../models/report-condition';
import { TranslateService } from '@ngx-translate/core';
import { DataTypeTranslatePipe } from '../../pipes/data-type-translate.pipe';


declare let google: any,
            BMap: any,
            BMapLib: any;

type MapSource = 'google' | 'baidu';
type MapKind = 'normal' | 'heat';
type BoundaryCoordinate = {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
type CompareDataOpt = 'hr' | 'speed' | 'pace' | 'cadence' | 'power' | 'temperature' | 'gforceX' | 'gforceY' | 'gforceZ';

@Component({
  selector: 'app-map-chart-compare',
  templateUrl: './map-chart-compare.component.html',
  styleUrls: ['./map-chart-compare.component.scss']
})
export class MapChartCompareComponent implements OnInit, OnChanges, OnDestroy {

  @Input('userPoint') userPoint: Array<any>;
  @Input('userInfo') userInfo: Array<any>;
  @Input('sportType') sportType: SportType;
  @Input('isNormalCoordinate') isNormalCoordinate: any;
  @Input('sysAccessRight') sysAccessRight: number;
  @Input('unit') unit: number;
  @Input('hideChart') hideChart: boolean;
  @ViewChild('gMap') gMap: ElementRef;
  @ViewChild('bMap') bMap: ElementRef;

  private ngUnsubscribe = new Subject;

  /**
   * ui會用到的各種flag
   */
  uiFlag = {
    userInChina: false,
    showMap: false,
    showMapOpt: false,
    showDataSelector: null
  };

  /**
   * 地圖設定
   */
  mapOpt = {
    showMapSourceSelector: true,
    mapSource: <MapSource>'google',  // 地圖來源
    mapKind: <MapKind>'normal', // 街道圖/熱力圖
    compareA: {
      type: <CompareDataOpt>null,
      name: '',
      color: 'rgba(155, 194, 71, 1)',
      data: []
    },
    compareB: {
      type: <CompareDataOpt>null,
      name: '',
      color: 'rgba(252, 124, 124, 1)',
      data: []
    },
    terrain: [],
    second: []
  }

  /**
   * google map 用參數
   */
  googleObj = {
    gMapPlayMark: [],
    map: null,
    path: null,
    displayMap: null
  }

  /**
   * baidu map 用參數
   */
  baiduObj = {
    bMapPlayMark: [],
    map: null,
    path: null,
    displayMap: null
  }

  clickEvent: Subscription;

  constructor(
    private utils: UtilsService,
    private translate: TranslateService,
    private dataTypeTranslatePipe: DataTypeTranslatePipe
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    // 經緯度座標皆為異常值，則不顯示地圖
    if (this.isNormalCoordinate || this.userPoint.length > 1) {
      this.mapOpt.mapKind = this.sportType === 7 ? 'heat' : 'normal';  // 僅球類運動顯示熱力圖
      this.checkMapLoaded(this.userPoint);
    } else {
      this.uiFlag.showMap = false;
    }

    this.handleDefaultCompareData(this.sportType);
  }

  /**
   * 確認各個地圖套件有載入，兩個都無法載入就隱藏地圖
   * @param dataArr {Array<any>}-所有人的point資訊
   * @author kidin-1100113
   */
  checkMapLoaded(dataArr: Array<any>) {
    // 判斷bidu map是否可以載入
    if ('BMAP_NORMAL_MAP' in window) {
      this.uiFlag.showMap = true;
      this.mapOpt.mapSource = 'baidu';
    } else {
      this.mapOpt.showMapSourceSelector = false;
    }

    // 判斷google map是否可以載入
    if ('google' in window && typeof google === 'object' && typeof google.maps === 'object') {
      this.uiFlag.showMap = true;
      this.mapOpt.mapSource = 'google';
    } else {
      this.mapOpt.showMapSourceSelector = false;
      this.uiFlag.userInChina = true;  // 暫以無法載入google map當作使用者位於中國的依據
    }

    this.mapOpt.mapSource === 'google' ? this.handleGoogleMap(this.userPoint) : this.handleBaiduMap(this.userPoint);
  }

  /**
   * 處理google map顯示
   * @param dataArr {Array<number>}-所有人的point資訊
   * @author kidin-1100113
   */
  handleGoogleMap(dataArr: Array<any>) {
    setTimeout(() => {
      const googleMapEle = this.gMap.nativeElement,
            bounds = new google.maps.LatLngBounds(),
            effectPointIdx = [],
            reservedPoint = {
              top: null,
              bottom: null,
              left: null,
              right: null
            };

      this.googleObj.path = dataArr[0].latitudeDegrees.map((_lan, _idx) => {
          const _lng = dataArr[0].longitudeDegrees[_idx],
                _mapPoint = new google.maps.LatLng(_lan, _lng);  // google map座標為(緯度, 經度)
          if (_lan && _lng) {
            effectPointIdx.push(_idx); // 儲存有效點的位置方便補值
            reservedPoint.top = !reservedPoint.top || _lan > reservedPoint.top ? _lan : reservedPoint.top;
            reservedPoint.bottom = !reservedPoint.bottom || _lan < reservedPoint.bottom ? _lan : reservedPoint.bottom;
            reservedPoint.left = !reservedPoint.left || _lng < reservedPoint.left ? _lng : reservedPoint.left;
            reservedPoint.right = !reservedPoint.right || _lng > reservedPoint.right ? _lng : reservedPoint.right;
            bounds.extend(_mapPoint);
          }

          return _mapPoint;
        });

      // 將整體路線在顯示中向上偏移，以留給圖表
      bounds.extend(
        new google.maps.LatLng(reservedPoint.bottom - ((reservedPoint.top - reservedPoint.bottom) * 0.2), (reservedPoint.left + reservedPoint.right) / 2)
      );

      // 將無效點以該點後面的有效點進行填補
      let j = 0;
      this.googleObj.path = this.googleObj.path.map((_path, _index) => {
        if (_index != effectPointIdx[j]) {
          return this.googleObj.path[effectPointIdx[j]];
        } else {
          j++;
          return _path;
        }

      });

      const startMark = new google.maps.Marker({  // 路線起始點
              position: this.googleObj.path[0],
              title: 'Start point',
              icon: '/assets/map_marker_start.svg'
            }),
            endMark = new google.maps.Marker({  // 路線終點
              position: this.googleObj.path[this.googleObj.path.length - 1],
              title: 'End point',
              icon: '/assets/map_marker_end.svg'
            }),
            mapSetting = {  // 地圖設定
              zoom: 15,
              center: new google.maps.LatLng(24.123499, 120.66014),
              mapTypeId: 'roadmap',
              gestureHandling: 'cooperative', // 讓使用者在手機環境下使用單止滑頁面，雙指滑地圖
              streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP,
              },
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
              }
            };

      this.googleObj.map = new google.maps.Map(googleMapEle, mapSetting);
      startMark.setMap(this.googleObj.map);
      endMark.setMap(this.googleObj.map);

      // 建立所有使用者的標記
      dataArr.forEach((_data, _index) => {
        const mark = new google.maps.Marker({
          position: this.googleObj.path[0],
          title: this.userInfo ? this.userInfo[_index].name : 'User',
          icon: '/assets/map_marker_player.svg'
        })

        mark.setMap(this.googleObj.map);
        this.googleObj.gMapPlayMark.push(mark);
      });

      // this.changeMapKind(this.mapOpt.mapKind);
      if (this.mapOpt.mapKind === 'normal') {
        this.googleObj.displayMap = new google.maps.Polyline({
          path: this.googleObj.path,
          geodesic: true,
          strokeColor: '#FF00AA',
          strokeOpacity: 0.7,
          strokeWeight: 4
        });
  
      } else {
        this.googleObj.displayMap = new google.maps.visualization.HeatmapLayer({
          data: this.googleObj.path,
          radius: 20,
          opacity: 1
        });
  
      }
  
      this.googleObj.displayMap.setMap(this.googleObj.map);
      this.googleObj.map.fitBounds(bounds);  // 將地圖縮放至可看到整個路線
    })
    
  }

  /**
   * 處理baidu map顯示
   * @param dataArr {Array<number>}-所有人的point資訊
   * @author kidin-1100113
   */
  handleBaiduMap(dataArr: Array<any>) {
    setTimeout(() => {
      const baiduMapEle = this.bMap.nativeElement,
            effectPointIdx = [],
            reservedPoint: BoundaryCoordinate = {
              top: null,
              bottom: null,
              left: null,
              right: null
            };

      this.baiduObj.map = new BMap.Map(baiduMapEle);
      this.baiduObj.path = dataArr[0].latitudeDegrees.map((_lan, _idx) => {

        const _lng = dataArr[0].longitudeDegrees[_idx];
        if (_lan && _lng) {
          effectPointIdx.push(_idx); // 儲存有效點的位置方便補值
          reservedPoint.top = !reservedPoint.top || _lan > reservedPoint.top ? _lan : reservedPoint.top;
          reservedPoint.bottom = !reservedPoint.bottom || _lan < reservedPoint.bottom ? _lan : reservedPoint.bottom;
          reservedPoint.left = !reservedPoint.left || _lng < reservedPoint.left ? _lng : reservedPoint.left;
          reservedPoint.right = !reservedPoint.right || _lng > reservedPoint.right ? _lng : reservedPoint.right;
        }

        return [_lng, _lan]; // 百度地圖座標是（經度, 緯度）
      });

      // 將無效點以該點後面的有效點進行填補，並使用套件將大地座標轉為百度座標（勿使用baidu官方轉換座標的api）-1100118
      let j = 0;
      this.baiduObj.path = this.baiduObj.path.map((_path, _index) => {
        let _bd09Point;
        if (_index != effectPointIdx[j]) {
          _bd09Point = transform([this.baiduObj.path[effectPointIdx[j]][0], this.baiduObj.path[effectPointIdx[j]][1]], WGS84, BD09);
        } else {
          j++;
          _bd09Point = transform([_path[0], _path[1]], WGS84, BD09);
        }

        return new BMap.Point(_bd09Point[0], _bd09Point[1]);
      });

      const startMark = new BMap.Marker(  // 路線起始點
        this.baiduObj.path[0],
        {
          icon: new BMap.Icon('/assets/map_marker_start.svg', new BMap.Size(33, 50), {
            anchor: new BMap.Size(16, 50),
            imageOffset: new BMap.Size(0, 0)
          })
        }
      ),
      endMark = new BMap.Marker(  // 路線終點
        this.baiduObj.path[this.baiduObj.path.length - 1],
        {
          icon: new BMap.Icon('/assets/map_marker_end.svg', new BMap.Size(33, 50), {
            anchor: new BMap.Size(16, 50),
            imageOffset: new BMap.Size(0, 0)
          })
        }
      );

      const pathHorizonCenter = (reservedPoint.left + reservedPoint.right) / 2,
            pathVerticalCenter = reservedPoint.bottom - ((reservedPoint.top - reservedPoint.bottom) * 0.2),  // 將整體路線在顯示中向上偏移，以留給圖表
            bd09Center = transform([pathHorizonCenter, pathVerticalCenter], WGS84, BD09),
            bdCenterPoint = new BMap.Point(bd09Center[0], bd09Center[1]),
            boundPath = this.baiduObj.path.slice();

      boundPath.push(bdCenterPoint);
      const {zoom, center} = this.baiduObj.map.getViewport(boundPath);  // 取得視圖縮放大小與中心點
                  
      this.baiduObj.map.centerAndZoom(center, zoom); // 初始化地圖
      this.baiduObj.map.addOverlay(startMark);
      this.baiduObj.map.setCenter(startMark);
      this.baiduObj.map.addOverlay(endMark);
      this.baiduObj.map.setCenter(endMark);
      this.baiduObj.map.disableScrollWheelZoom(); // 關閉滑鼠滾輪縮放，避免手機頁面無法滑動頁面
      this.baiduObj.map.addControl(new BMap.NavigationControl({anchor: 'BMAP_ANCHOR_TOP_RIGHT'}));  // 平移縮放按鈕
      this.baiduObj.map.addControl(new BMap.MapTypeControl({anchor: 'BMAP_ANCHOR_TOP_LEFT'}));  // 地圖類型按鈕
      // 建立所有使用者的標記
      dataArr.forEach((_data, _index) => {
        const playerMark = new BMap.Marker(  // 路線起始點
          this.baiduObj.path[0],
          {
            icon: new BMap.Icon('/assets/map_marker_player.svg', new BMap.Size(12, 12), {
              anchor: new BMap.Size(6, 12),
              imageOffset: new BMap.Size(0, 0)
            })
          }
        );
        
        this.baiduObj.map.addOverlay(playerMark);
        this.baiduObj.map.setCenter(playerMark);
        this.baiduObj.bMapPlayMark.push(playerMark);
      });

      if(this.mapOpt.mapKind === 'heat' && this.checkCanvasSupport()) {
        const heatmapOverlay = new BMapLib.HeatmapOverlay({"radius": 20});
        this.baiduObj.map.addOverlay(heatmapOverlay);
        heatmapOverlay.setDataSet({data: this.baiduObj.path, max:100});
      } else {
        const polyline = new BMap.Polyline(  // 路線聚合線
          this.baiduObj.path,
          {
            strokeColor:"rgba(232, 62, 140, 1)",
            strokeWeight:6,
            strokeOpacity:0.5
          }
        );

        this.baiduObj.map.addOverlay(polyline);
      }

    });

  }

  /**
   * 計算baidu 地圖縮放大小，以讓整個路線可以在地圖中完整顯示(先用baidu api處理，如沒問題則刪除此function)
   * coordinate
   * @author kidin-1100118
  calcScale(coordinate: BoundaryCoordinate) {
    const earthRadius = 6378.39, // km
          earthCircumference = 2 * earthRadius * Math.PI, // 地球圓周（km）
          {top, bottom, left, right} = coordinate,
          currentEarthRadius = earthRadius * Math.sin(90 - ((top + bottom) / 2)),  // 根據緯度不同，該緯度的水平地球半徑也不相同
          horizonDistance = currentEarthRadius / 360 * (right - left),
          verticalDistance = earthCircumference / 360 * (top - bottom);

    console.log('pathDis', coordinate, horizonDistance, verticalDistance);
    // baidu map以目前的視圖，垂直距離6km的縮放大小大概在13，放大2倍，縮放大小+1
    if (horizonDistance >= verticalDistance) {
      return horizonDistance / 6 >= 1 ? Math.ceil(13 - Math.log2((horizonDistance / 6))) : Math.floor(13 + (Math.log2(6 / horizonDistance)));
    } else {
      return verticalDistance / 6 >= 1 ? Math.ceil(13 - Math.log2((verticalDistance / 6))) : Math.floor(13 + (Math.log2(6 / verticalDistance)));
    }

  }
  */

  /**
   * 判斷是否支援canvas
   * @author kidin-1100118
   */
  checkCanvasSupport(): boolean {
    const testArea = document.createElement('canvas');
    if(testArea.getContext && testArea.getContext('2d')) {
      return true;
    } else {
      const msg = 'Browser not support baidu heat map!'
      this.utils.openAlert(msg);
      return false;
    }
    
  }

  /**
   * 根據運動類別預設比較圖表的資料類型
   * @param type {SportType}-運動類別
   * @author kidin-1100120
   */
  handleDefaultCompareData(type: SportType) {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      switch (type) {
        case 1:
          this.mapOpt.compareA = {
            type: 'hr',
            name: this.translate.instant(this.dataTypeTranslatePipe.transform('hr', [type, this.unit])),
            color: this.mapOpt.compareA.color,
            data: this.userPoint[0][this.handleDataKey('hr', type)]
          };

          this.mapOpt.compareB = {
            type: 'pace',
            name: this.translate.instant(this.dataTypeTranslatePipe.transform('pace', [type, this.unit])),
            color: this.mapOpt.compareB.color,
            data: this.userPoint[0][this.handleDataKey('pace', type)]
          };

          break;
        case 2:
        case 7:
          this.mapOpt.compareA = {
            type: 'hr',
            name: this.translate.instant(this.dataTypeTranslatePipe.transform('hr', [type, this.unit])),
            color: this.mapOpt.compareA.color,
            data: this.userPoint[0][this.handleDataKey('hr', type)]
          };

          this.mapOpt.compareB = {
            type: 'speed',
            name: this.translate.instant(this.dataTypeTranslatePipe.transform('speed', [type, this.unit])),
            color: this.mapOpt.compareB.color,
            data: this.userPoint[0][this.handleDataKey('speed', type)]
          };

          break;
        case 4:
        case 6:
          this.mapOpt.compareA = {
            type: 'pace',
            name: this.translate.instant(this.dataTypeTranslatePipe.transform('pace', [type, this.unit])),
            color: this.mapOpt.compareA.color,
            data: this.userPoint[0][this.handleDataKey('pace', type)]
          };

          this.mapOpt.compareB = {
            type: 'cadence',
            name: this.translate.instant(this.dataTypeTranslatePipe.transform('cadence', [type, this.unit])),
            color: this.mapOpt.compareB.color,
            data: this.userPoint[0][this.handleDataKey('cadence', type)]
          };

          break;
      }

      this.mapOpt.terrain = [1, 2].includes(this.sportType) ? this.userPoint[0].altitudeMeters : [];
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
    this.mapOpt.mapSource === 'google' ? this.handleGoogleMap(this.userPoint) : this.handleBaiduMap(this.userPoint);
    this.uiFlag.showDataSelector = false;
  }

  /**
   * 切換地圖類別
   * @param kind {MapKind}-地圖類別
   * @author kidin-1100114
   */
  changeMapKind(kind: MapKind) {
    this.mapOpt.mapKind = kind;
    this.mapOpt.mapSource === 'google' ? this.handleGoogleMap(this.userPoint) : this.handleBaiduMap(this.userPoint);
    this.uiFlag.showDataSelector = false;
  }

  /**
   * 切換比較類別
   * @param idx {'compareA' | 'compareB'}
   * @param type {type}-欲比較的項目類別
   * @author kidin-1100114
   */
  changeCompareData(type: CompareDataOpt) {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.mapOpt[this.uiFlag.showDataSelector] = {
        type,
        name: this.translate.instant(this.dataTypeTranslatePipe.transform(type, [this.sportType, this.unit])),
        color: this.mapOpt[this.uiFlag.showDataSelector].color,
        data: this.userPoint[0][this.handleDataKey(type, this.sportType)]
      };
      
    });

    this.uiFlag.showDataSelector = null;
  }

  /**
   * 顯示地圖/比較圖設定選項
   * @param e {MouseEvent}
   * @author kidin-1100114
   */
  handleShowOptMenu(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showMapOpt = !this.uiFlag.showMapOpt;
    this.uiFlag.showMapOpt ? this.subscribeClick() : this.ngUnsubscribeClick();
    this.uiFlag.showDataSelector = null;
  }

  /**
   * 訂閱點擊事件
   * @author kidin-1100114
   */
  subscribeClick() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.uiFlag.showMapOpt = false;
      this.ngUnsubscribeClick();
    });

  }

  /**
   * 取消訂閱點擊事件
   * @author kidin-1100114
   */
  ngUnsubscribeClick() {
    this.clickEvent.unsubscribe();
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
        switch(sportType) {
          case 1:
            return 'runCadence';
          case 2:
            return 'cycleCadence';
          case 4:
            return 'swimCadence';
          case 6:
            return 'rowingCadence';
        }
      case 'power':
        return sportType === 2 ? 'cycleWatt' : 'rowingWatt';
      case 'temperature':
        return 'temp';
      case 'gforceX':
        return 'gsensorXRawData';
      case 'gforceY':
        return 'gsensorYRawData';
      case 'gforceZ':
        return 'gsensorZRawData';
    }

  }

  /**
   * 根據使用者滑鼠在圖表的位置，移動地圖的記號
   * @param e {number}-point位置
   * @author kidin-1100121
   */
  movePoint(e: number) {
    if (this.mapOpt.mapSource === 'google') {
      this.googleObj.gMapPlayMark.forEach(_mark => _mark.setPosition(this.googleObj.path[e]));
    } else {
      this.baiduObj.bMapPlayMark.forEach(_mark => _mark.setPosition(this.baiduObj.path[e]));
    }

  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
