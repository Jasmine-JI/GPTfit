import { Component, OnInit, OnChanges, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { transform, WGS84, BD09, GCJ02 } from 'gcoord';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


declare let google: any,
            BMap: any;

type MapSource = 'google' | 'baidu';
type MapKind = 'normal' | 'heat';

@Component({
  selector: 'app-map-chart-compare',
  templateUrl: './map-chart-compare.component.html',
  styleUrls: ['./map-chart-compare.component.scss']
})
export class MapChartCompareComponent implements OnInit, OnChanges, OnDestroy {

  @Input('userPoint') userPoint: Array<any>;
  @Input('userInfo') userInfo: Array<any>;
  @Input('sportType') sportType: number;
  @Input('isNormalCoordinate') isNormalCoordinate: any;
  @Input('sysAccessRight') sysAccessRight: number;
  @ViewChild('gMap') gMap: ElementRef;
  @ViewChild('bMap') bMap: ElementRef;

  private ngUnsubscribe = new Subject;

  /**
   * ui會用到的各種flag
   */
  uiFlag = {
    userInChina: false,
    showMap: false,
    showMapOpt: false
  };

  /**
   * 地圖設定
   */
  mapOpt = {
    showMapSourceSelector: true,
    mapSource: <MapSource>'google',  // 地圖來源
    mapKind: <MapKind>'normal', // 街道圖/熱力圖
    compareA: null,
    compareB: null
  }

  /**
   * google map 使用者標記
   */
  gMapPlayMark = [];

  /**
   * baidu map 使用者標記
   */
  bMapPlayMark = [];

  googleMap: any;
  path: any;
  displayMap: any;
  baiduMap: any;
  clickEvent: Subscription;

  constructor() { }

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
      this.handleBaiduMap(dataArr);
    } else {
      this.mapOpt.showMapSourceSelector = false;
    }

    // 判斷google map是否可以載入
    if ('google' in window && typeof google === 'object' && typeof google.maps === 'object') {
      this.uiFlag.showMap = true;
      this.mapOpt.mapSource = 'google';
      this.handleGoogleMap(dataArr);
    } else {
      this.mapOpt.showMapSourceSelector = false;
      this.uiFlag.userInChina = true;  // 暫以無法載入google map當作使用者位於中國的依據
    }

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

      this.path = dataArr[0].latitudeDegrees.map((_lan, _idx) => {
          const _lng = dataArr[0].longitudeDegrees[_idx],
                _mapPoint = new google.maps.LatLng(_lan, _lng);
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
      this.path = this.path.map((_path, _index) => {
        if (_index != effectPointIdx[j]) {
          return this.path[effectPointIdx[j]];
        } else {
          j++;
          return _path;
        }

      });

      const startMark = new google.maps.Marker({  // 路線起始點
              position: this.path[0],
              title: 'Start point',
              icon: '/assets/map_marker_start.svg'
            }),
            endMark = new google.maps.Marker({  // 路線終點
              position: this.path[this.path.length - 1],
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

      this.googleMap = new google.maps.Map(googleMapEle, mapSetting);
      startMark.setMap(this.googleMap);
      endMark.setMap(this.googleMap);

      // 建立所有使用者的標記
      dataArr.forEach((_data, _index) => {
        const mark = new google.maps.Marker({
          position: this.path[0],
          title: this.userInfo ? this.userInfo[_index].name : 'User',
          icon: '/assets/map_marker_player.svg'
        })

        mark.setMap(this.googleMap);
        this.gMapPlayMark.push(this.path[0]);
      });

      // this.changeMapKind(this.mapOpt.mapKind);
      if (this.mapOpt.mapKind === 'normal') {
        this.displayMap = new google.maps.Polyline({
          path: this.path,
          geodesic: true,
          strokeColor: '#FF00AA',
          strokeOpacity: 0.7,
          strokeWeight: 4
        });
  
      } else {
        this.displayMap = new google.maps.visualization.HeatmapLayer({
          data: this.path,
          radius: 20,
          opacity: 1
        });
  
      }
  
      this.displayMap.setMap(this.googleMap);
      this.googleMap.fitBounds(bounds);  // 將地圖縮放至可看到整個路線
    })
    
  }

  /**
   * 處理baidu map顯示
   * @param dataArr {Array<number>}-所有人的point資訊
   * @author kidin-1100113
   */
  handleBaiduMap(dataArr: Array<any>) {

  }

  /**
   * 切換地圖來源
   * @param source {MapSource}-地圖來源
   * @author kidin-1100114
   */
  changeMapSource(source: MapSource) {
    this.mapOpt.mapSource = source;
  }

  /**
   * 切換地圖類別
   * @param kind {MapKind}-地圖類別
   * @author kidin-1100114
   */
  changeMapKind(kind: MapKind) {
    this.mapOpt.mapKind = kind;
    this.handleGoogleMap(this.userPoint);
  }

  /**
   * 切換比較類別
   * @param idx {'compareA' | 'compareB'}
   * @param type {type}-欲比較的項目類別
   * @author kidin-1100114
   */
  changeCompareData(idx: 'compareA' | 'compareB', type: string) {
    this.mapOpt[idx] = type;
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
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
