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
import { transform, WGS84, BD09 } from 'gcoord';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from '../../services/utils.service';
import { chinaAndTaiwanBorder } from '../../models/china-border-data';
import { Unit } from '../../enum/value-conversion';
import { ActivityService } from '../../services/activity.service';
import { mi } from '../../models/bs-constant';
import { GroupService } from '../../services/group.service';
import { SelectDate } from '../../models/utils-type';
import { deepCopy } from '../../utils/index';
import { AuthService } from '../../../core/services/auth.service';

// 若google api或baidu api掛掉則建物件代替，避免造成gptfit卡住。
const google: any = (window as any).google || { maps: { OverlayView: null } };
const BMap: any = (window as any).BMap || { Overlay: null };
declare const BMAP_SATELLITE_MAP: any;

type MapSource = 'google' | 'baidu';
type PlaySpeed = 1 | 5 | 10 | 20 | 50 | 100;

@Component({
  selector: 'app-cloudrun-map',
  templateUrl: './cloudrun-map.component.html',
  styleUrls: ['./cloudrun-map.component.scss'],
})
export class CloudrunMapComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('gMap') gMap: ElementRef;
  @ViewChild('bMap') bMap: ElementRef;
  @Input() mapGpx: Array<Array<number>>;
  @Input() mapDistance: number;
  @Input() altitude: Array<number>;
  @Input() userList: Array<any>;
  @Input() userId: number;
  @Input() unit: Unit;
  @Input() selectDate: SelectDate;
  @Input() groupId: string;
  @Input() mapId: number;
  @Input() mapSource: MapSource;
  @Input() compareList: Array<number>;
  @Input() isPreviewMode: boolean;
  @Input() page: 'group' | 'person';
  @Output() mapSourceChange: EventEmitter<MapSource> = new EventEmitter();
  @Output() comparePlayer: EventEmitter<number> = new EventEmitter();

  private ngUnsubscribe = new Subject();

  /**
   * ui會用到的各種flag
   */
  uiFlag = {
    userInChina: false,
    showMap: false,
    showMapOpt: false,
    changeMapSource: false,
  };

  /**
   * 地圖設定
   */
  mapOpt = {
    showMapSourceSelector: true,
    mapSource: <MapSource>'google', // 地圖來源
  };

  /**
   * google map 用參數
   */
  googleObj = {
    gMapPlayMark: [],
    map: null,
    path: null,
    displayMap: null,
    mapIdListener: null,
    zoomListener: null,
  };

  /**
   * baidu map 用參數
   */
  baiduObj = {
    bMapPlayMark: [],
    map: null,
    path: null,
    displayMap: null,
  };

  /**
   * 地圖播放相關flag
   */
  mapPlay = {
    init: true,
    startPlaying: false,
    pause: false,
    playSpeed: <PlaySpeed>10,
    playSecond: 0,
    truthSecond: 0,
    zoom: {
      normal: null,
      current: null,
    },
    playerMark: {},
    showSpeedOpt: false,
  };

  groupLevel: number;
  clickEvent: Subscription;
  playInterval: any;
  playerList: any; // 所有玩家列表
  loadedList = {}; // 使用者選擇載入的列表
  chartData = [];
  dataStore = {}; // 將已載入過得使用者point資料暫存起來

  constructor(
    private utils: UtilsService,
    private activityService: ActivityService,
    private changeDetectorRef: ChangeDetectorRef,
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(e: any): void {
    if (e.mapGpx) {
      this.initVar();
      this.checkMapLoaded(this.mapGpx);
    }

    if (this.userList && e.userList) {
      if (this.groupId) this.groupLevel = +this.utils.displayGroupLevel(this.groupId);
      this.createPlayerList(this.userList);
      if (this.isPreviewMode) {
        this.mapOpt.mapSource = this.mapSource;
        this.mapOpt.mapSource === 'google'
          ? this.handleGoogleMap(this.mapGpx)
          : this.handleBaiduMap(this.mapGpx);

        if (this.compareList && this.compareList.length > 0) {
          this.loadPlayerData(this.compareList.map((_list) => +_list));
        }
      }
    }
  }

  /**
   * 確認各個地圖套件有載入，兩個都無法載入就隱藏地圖
   * @param gpx {Array<any>}-地圖gpx
   * @author kidin-1100113
   */
  checkMapLoaded(gpx: Array<Array<number>>) {
    if (!this.isPreviewMode) {
      // 判斷bidu map是否可以載入
      if ('BMAP_NORMAL_MAP' in window) {
        this.uiFlag.showMap = true;
        if (!this.uiFlag.changeMapSource) this.mapOpt.mapSource = 'baidu';
      } else {
        this.mapOpt.showMapSourceSelector = false;
      }

      // 判斷google map是否可以載入
      if ('google' in window && typeof google === 'object' && typeof google.maps === 'object') {
        this.uiFlag.showMap = true;
        if (!this.uiFlag.changeMapSource) this.mapOpt.mapSource = 'google';
      } else {
        this.mapOpt.showMapSourceSelector = false;
        this.uiFlag.userInChina = true; // 暫以無法載入google map當作使用者位於中國的依據
      }
    } else {
      this.uiFlag.showMap = true;
      this.mapOpt.showMapSourceSelector = false;
    }

    this.uiFlag.changeMapSource = true;
    this.mapOpt.mapSource === 'google' ? this.handleGoogleMap(gpx) : this.handleBaiduMap(gpx);
  }

  /**
   * 處理google map顯示
   * @param gpx {Array<number>}-地圖gpx
   * @author kidin-1100113
   */
  handleGoogleMap(gpx: Array<any>) {
    setTimeout(() => {
      const googleMapEle = this.gMap.nativeElement,
        bounds = new google.maps.LatLngBounds();

      // 使用套件將大地座標轉為GCJ02-1100323
      this.googleObj.path = gpx.map((_gpx, _idx) => {
        const [_lan, _lng] = [..._gpx],
          _mapPoint = new google.maps.LatLng(_lan, _lng); // google map座標為(緯度, 經度)
        if (_lan && _lng) {
          bounds.extend(_mapPoint);
        }

        return _mapPoint;
      });

      const startMark = new google.maps.Marker({
          // 路線起始點
          position: this.googleObj.path[0],
          title: 'Start point',
          icon: '/assets/map_marker_start.svg',
        }),
        endMark = new google.maps.Marker({
          // 路線終點
          position: this.googleObj.path[this.googleObj.path.length - 1],
          title: 'End point',
          icon: '/assets/map_marker_end.svg',
        }),
        mapSetting = {
          // 地圖設定
          zoom: 15,
          center: new google.maps.LatLng(24.123499, 120.66014),
          mapTypeId: 'satellite',
          streetViewControl: false,
          rotateControl: false,
          mapTypeControl: false,
          gestureHandling: 'cooperative', // 讓使用者在手機環境下使用單止滑頁面，雙指滑地圖
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
        };

      this.googleObj.map = new google.maps.Map(googleMapEle, mapSetting);
      startMark.setMap(this.googleObj.map);
      endMark.setMap(this.googleObj.map);

      this.googleObj.displayMap = new google.maps.Polyline({
        path: this.googleObj.path,
        geodesic: true,
        strokeColor: '#FF00AA',
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });

      this.googleObj.displayMap.setMap(this.googleObj.map);
      this.googleObj.map.fitBounds(bounds); // 將地圖縮放至可看到整個路線
      this.mapPlay.zoom.normal = this.googleObj.map.getZoom();

      // 監聽縮放大小
      this.googleObj.zoomListener = google.maps.event.addListener(
        this.googleObj.map,
        'zoom_changed',
        () => {
          const { current } = this.mapPlay.zoom,
            newZoom = this.googleObj.map.getZoom();

          if (newZoom !== current) {
            this.mapPlay.zoom.current = newZoom;
            this.adjustMapIconSize();
          }
        }
      );
    });
  }

  /**
   * 處理baidu map顯示
   * @param gpx {Array<number>}-地圖gpx
   * @author kidin-1100113
   */
  handleBaiduMap(gpx: Array<any>) {
    setTimeout(() => {
      const baiduMapEle = this.bMap.nativeElement,
        needConverse = this.handleBorderData([gpx[0][1], gpx[0][0]], chinaAndTaiwanBorder);

      this.baiduObj.map = new BMap.Map(baiduMapEle, { mapType: BMAP_SATELLITE_MAP });
      this.baiduObj.path = gpx.map((_gpx, _idx) => {
        const [_lan, _lng] = [..._gpx];

        // 使用套件將大地座標轉為百度座標（勿使用baidu官方轉換座標的api）-1100322
        let _bd09Point;
        if (this.uiFlag.userInChina || needConverse) {
          _bd09Point = transform([_lng, _lan], WGS84, BD09);
        } else {
          _bd09Point = transform([_lng, _lan], WGS84, WGS84);
        }

        return new BMap.Point(_bd09Point[0], _bd09Point[1]);
      });

      const startMark = new BMap.Marker(this.baiduObj.path[0], { // 路線起始點
          icon: new BMap.Icon('/assets/map_marker_start.svg', new BMap.Size(33, 50), {
            anchor: new BMap.Size(16, 50),
            imageOffset: new BMap.Size(0, 0),
          }),
        }),
        endMark = new BMap.Marker(this.baiduObj.path[this.baiduObj.path.length - 1], { // 路線終點
          icon: new BMap.Icon('/assets/map_marker_end.svg', new BMap.Size(33, 50), {
            anchor: new BMap.Size(16, 50),
            imageOffset: new BMap.Size(0, 0),
          }),
        });

      const boundPath = this.baiduObj.path.slice(),
        { zoom, center } = this.baiduObj.map.getViewport(boundPath); // 取得視圖縮放大小與中心點

      this.baiduObj.map.centerAndZoom(center, zoom); // 初始化地圖
      this.baiduObj.map.addOverlay(startMark);
      this.baiduObj.map.setCenter(startMark);
      this.baiduObj.map.addOverlay(endMark);
      this.baiduObj.map.setCenter(endMark);
      this.baiduObj.map.disableScrollWheelZoom(); // 關閉滑鼠滾輪縮放，避免手機頁面無法滑動頁面
      this.baiduObj.map.addControl(new BMap.NavigationControl({ anchor: 'BMAP_ANCHOR_TOP_RIGHT' })); // 平移縮放按鈕

      const polyline = new BMap.Polyline(this.baiduObj.path, { // 路線聚合線
        strokeColor: 'rgba(232, 62, 140, 1)',
        strokeWeight: 6,
        strokeOpacity: 0.5,
      });

      this.baiduObj.map.addOverlay(polyline);

      this.baiduObj.map.addEventListener('zoomend', () => {
        const { current } = this.mapPlay.zoom,
          newZoom = this.baiduObj.map.getZoom();

        if (newZoom !== current) {
          this.mapPlay.zoom.current = newZoom;
          this.adjustMapIconSize();
        }
      });
    });
  }

  /**
   * 初始化變數
   * @author kidin-1100325
   */
  initVar() {
    this.dataStore = {};
    this.loadedList = {};
  }

  /**
   * 顯示地圖設定選項
   * @param e {MouseEvent}
   * @author kidin-1100114
   */
  handleShowOptMenu(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showMapOpt = !this.uiFlag.showMapOpt;
    this.uiFlag.showMapOpt ? this.subscribeClick() : this.ngUnsubscribeClick();
  }

  /**
   * 切換地圖來源
   * @param source {MapSource}-地圖來源
   * @author kidin-1100114
   */
  changeMapSource(source: MapSource) {
    this.mapOpt.mapSource = source;
    this.mapOpt.mapSource === 'google'
      ? this.handleGoogleMap(this.mapGpx)
      : this.handleBaiduMap(this.mapGpx);
    this.mapSourceChange.emit(source);
    this.uiFlag.showMapOpt = false;
    this.ngUnsubscribeClick();
  }

  /**
   * 訂閱點擊事件
   * @author kidin-1100114
   */
  subscribeClick() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.uiFlag.showMapOpt = false;
      this.mapPlay.showSpeedOpt = false;
      this.ngUnsubscribeClick();
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
   * 根據使用者滑鼠在圖表的位置，移動地圖的記號
   * @param e {number}-point位置
   * @author kidin-1100121
   */
  movePoint(e: number) {
    if (this.mapOpt.mapSource === 'google') {
      this.googleObj.gMapPlayMark.forEach((_mark) => _mark.setPosition(this.googleObj.path[e]));
    } else {
      this.baiduObj.bMapPlayMark.forEach((_mark) => _mark.setPosition(this.baiduObj.path[e]));
    }
  }

  /**
   * 確認該點是否在該範圍內
   * @param point {Array<number>}-座標
   * @param borderArr {Array<Array<number>>}-地區邊界座標
   * @author kidin-1100225
   */
  handleBorderData(point: Array<number>, borderArr: Array<Array<number>>) {
    const x = point[0],
      y = point[1];
    let inside = false;
    for (let i = 0, j = borderArr.length - 1; i < borderArr.length; j = i++) {
      const xi = borderArr[i][0],
        yi = borderArr[i][1],
        xj = borderArr[j][0],
        yj = borderArr[j][1],
        intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * 生成玩家列表，並依最佳成績排序後，加入名次
   * @param list {any}-個人成績清單
   * @author kidin-1100323
   */
  createPlayerList(list: any) {
    let completeList: Array<any>;
    if (this.page === 'group') {
      completeList = list.filter((_list) => _list.bestSeconds);
      completeList.sort((a, b) => a.bestSeconds - b.bestSeconds);
    } else {
      completeList = list.sort((a, b) => a.totalSecond - b.totalSecond);
    }

    this.playerList = this.assignRank(completeList);
    this.mapPlay.playSpeed = 10;
    this.initMapPlay();
  }

  /**
   * 進行排名，成績相同者排名相同
   * @param list {any}-排序過後的清單
   * @author kidin-1100402
   */
  assignRank(list: any) {
    let rank = 1;
    for (let i = 0, len = list.length; i < len; i++) {
      if (this.page === 'group') {
        if (i === 0 || list[i].bestSeconds !== list[i - 1].bestSeconds) {
          rank = i + 1;
        }
      } else {
        if (i === 0 || list[i].totalSecond !== list[i - 1].totalSecond) {
          rank = i + 1;
        }
      }

      Object.assign(list[i], { rank });
    }

    return list;
  }

  /**
   * 載入預設玩家point資訊(第一名/自己 或 自己/第二名 或 第一名/第二名)
   * @author kidin-1100325
  loadDefaultPlayer() {
    const index = this.playerList.findIndex(_player => _player.fileId == this.fileId);
    let loadArr = [];
    if (!this.dataStore[this.playerList[0].fileId]) {
      loadArr.push(0);
    } else {
      this.addPlayer(0);
    }

    if (index > 0) {

      if (!this.dataStore[this.playerList[index].fileId]) {
        loadArr.push(index);
      } else {
        this.addPlayer(index);
      }

    } else {

      if (this.playerList[1] && !this.dataStore[this.playerList[1].fileId]) {
        loadArr.push(1);
      } else if (this.playerList[1]) {
        this.addPlayer(1);
      }
      
    }

    if (loadArr.length > 0) this.loadPlayerData(loadArr);
  }
  */

  /**
   * 使用2111載入玩家point資訊
   * @param indexArr {Array<number>}
   * @author kidin-1100325
   */
  loadPlayerData(indexArr: Array<number>) {
    const { startDate, endDate } = this.selectDate,
      fileIdArr = [];

    indexArr.forEach((_index) => {
      fileIdArr.push(this.playerList[_index].fileId);
    });

    if (fileIdArr.length > 0) {
      const body = {
        token: this.authService.token,
        privacyCheck: this.groupId ? 2 : 1,
        searchTime: {
          type: 1,
          fuzzyTime: [],
          filterStartTime: startDate,
          filterEndTime: endDate,
        },
        searchRule: {
          activity: 1,
          targetUser: this.groupId ? 3 : 2,
          groupId: this.groupId ? `${this.groupService.getBlurryGroupId(this.groupId)}` : '',
          fileInfo: {
            fileId: fileIdArr,
            author: '',
            dispName: '',
            equipmentSN: '',
            class: '',
            teacher: '',
            tag: '',
            cloudRunMapId: this.mapId,
          },
        },
        display: {
          activityLapLayerDisplay: 3,
          activityLapLayerDataField: [],
          activityPointLayerDisplay: 2,
          activityPointLayerDataField: [
            'pointSecond',
            'latitudeDegrees',
            'longitudeDegrees',
            'distanceMeters',
            'speed',
          ],
        },
        page: 0,
        pageCounts: 10,
      };

      this.activityService.fetchMultiActivityData(body).subscribe((res) => {
        const { resultCode, resultMessage, apiCode, info } = res;
        if (resultCode !== 200) {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else if (!info || !info.activities || info.activities.length === 0) {
          const msg = 'Oops! Loading error.';
          this.utils.openAlert(msg);
        } else {
          const { activities } = info;
          activities.forEach((_activity) => {
            const {
              activityPointLayer,
              fileInfo: { fileId },
            } = _activity;
            Object.assign(this.dataStore, {
              [fileId]: {
                secondBase: activityPointLayer,
                distanceBase: this.filterSameDistanceData(activityPointLayer),
              },
            });
          });

          indexArr.forEach((_index) => {
            this.addPlayer(_index);
          });
        }
      });
    }
  }

  /**
   * 使用者所點選的玩家
   * @param index {number}
   * @author kidin-1100325
   */
  clickPlayer(index: number) {
    const { fileId } = this.playerList[index];
    if (this.loadedList[fileId]) {
      this.removePlayer(fileId);
      this.comparePlayer.emit(index);
    } else {
      if (this.dataStore[fileId]) {
        this.addPlayer(index);
      } else {
        this.loadPlayerData([index]);
      }
    }
  }

  /**
   * 使用者聚焦的對象
   * @param index {number}
   * @author kidin-1100412
   */
  focusPlayer(index: number) {
    const { fileId } = this.playerList[index],
      iconSize = this.getMapIconSize() + 20;
    if (this.loadedList[fileId]) {
      this.mapPlay.playerMark[fileId].adjustIconSize(iconSize);
    }
  }

  /**
   * 使用者移開聚焦的對象
   * @param index {number}
   * @author kidin-1100412
   */
  blurPlayer(index: number) {
    const { fileId } = this.playerList[index],
      iconSize = this.getMapIconSize();
    if (this.loadedList[fileId]) {
      this.mapPlay.playerMark[fileId].adjustIconSize(iconSize);
    }
  }

  /**
   * 移除玩家
   * @param fileId {number}
   * @author kidin-1100326
   */
  removePlayer(fileId: number) {
    const obj = deepCopy(this.loadedList);
    delete obj[fileId];
    this.loadedList = obj; // 變更loadedList記憶體位置以觸發子組件change事件
    this.mapPlay.playerMark[fileId].onRemove();
    delete this.mapPlay.playerMark[fileId];
  }

  /**
   * 移除地圖上所有玩家mark
   * @author kidin-1100329
   */
  removeAllPlayerMark() {
    for (const _playerId in this.mapPlay.playerMark) {
      if (this.mapPlay.playerMark.hasOwnProperty(_playerId)) {
        this.mapPlay.playerMark[_playerId].onRemove();
      }
    }

    this.loadedList = {};
    this.mapPlay.playerMark = {};
    this.initMapPlay();
    this.comparePlayer.emit(-1);
  }

  /**
   * 載入列表增加指定玩家
   * @param index {number}
   * @author kidin-1100325
   */
  addPlayer(index: number) {
    this.comparePlayer.emit(index);
    const random = (Math.random() * 300).toFixed(0),
      { fileId, name, icon } = this.playerList[index],
      { distanceBase, secondBase } = this.dataStore[fileId],
      obj = deepCopy(this.loadedList);

    Object.assign(obj, {
      [fileId]: {
        name,
        icon,
        distanceBase,
        secondBase,
        color: `hsla(${random}, 70%, 50%, 1)`,
      },
    });

    this.loadedList = obj; // 變更loadedList記憶體位置以觸發子組件change事件
    if (this.mapOpt.mapSource === 'google') {
      this.createGMapPlayerMark(fileId);
    } else {
      this.createBMapPlayerMark(fileId);
    }
  }

  /**
   * 建立玩家在google map的起始位置mark
   * @param fileId {number}
   * @author kidin-1100326
   */
  createGMapPlayerMark(fileId: number) {
    const { name, color, secondBase, icon } = this.loadedList[fileId],
      lat = +secondBase[0].latitudeDegrees,
      lng = +secondBase[0].longitudeDegrees,
      position = new google.maps.LatLng(lat, lng), // google map座標為(緯度, 經度)
      iconSize = this.getMapIconSize();
    Object.assign(this.mapPlay.playerMark, {
      [fileId]: new CustomGMapIcon(iconSize, position, name, icon, color),
    });

    this.mapPlay.playerMark[fileId].setMap(this.googleObj.map);
  }

  /**
   * 調整玩家icon的大小
   * @author kidin-1100329
   */
  adjustMapIconSize() {
    const iconSize = this.getMapIconSize();
    for (const _playerId in this.mapPlay.playerMark) {
      if (this.mapPlay.playerMark.hasOwnProperty(_playerId)) {
        this.mapPlay.playerMark[_playerId].adjustIconSize(iconSize);
      }
    }
  }

  /**
   * 根據google map縮放大小調整icon size
   * @author kidin-1100329
   */
  getMapIconSize() {
    const { normal, current } = this.mapPlay.zoom;
    let iconSize = 30;
    if (current > normal) {
      iconSize += (current - normal) * 10;
    }

    return iconSize;
  }

  /**
   * 建立玩家在baidu map的起始位置mark
   * @param fileId {number}
   * @author kidin-1100326
   */
  createBMapPlayerMark(fileId: number) {
    const { name, color, secondBase, icon } = this.loadedList[fileId],
      lat = +secondBase[0].latitudeDegrees,
      lng = +secondBase[0].longitudeDegrees,
      needConverse = this.handleBorderData([lng, lat], chinaAndTaiwanBorder),
      iconSize = this.getMapIconSize();

    // 使用套件將大地座標轉為百度座標（勿使用baidu官方轉換座標的api）-1100330
    let bd09Point;
    if (this.uiFlag.userInChina || needConverse) {
      bd09Point = transform([lng, lat], WGS84, BD09);
    } else {
      bd09Point = transform([lng, lat], WGS84, WGS84);
    }

    const position = new BMap.Point(bd09Point[0], bd09Point[1]);
    Object.assign(this.mapPlay.playerMark, {
      [fileId]: new CustomBMapIcon(iconSize, position, name, icon, color),
    });

    this.baiduObj.map.addOverlay(this.mapPlay.playerMark[fileId]);
  }

  /**
   * 設定玩家在google map的位置
   * @param fileId {number}
   * @param index {number}-路徑索引值
   * @author kidin-1100326
   */
  setGMapMark(fileId: number, index: number) {
    const { secondBase } = this.loadedList[fileId];
    if (secondBase[index]) {
      const lat = +secondBase[index].latitudeDegrees,
        lng = +secondBase[index].longitudeDegrees,
        position = new google.maps.LatLng(lat, lng);
      this.mapPlay.playerMark[fileId].onMove(position);
      return false;
    } else {
      return true;
    }
  }

  /**
   * 設定玩家在baidu map的位置
   * @param fileId {number}
   * @param index {number}-路徑索引值
   * @author kidin-1100326
   */
  setBMapMark(fileId: number, index: number) {
    const { secondBase } = this.loadedList[fileId];
    if (secondBase[index]) {
      const lat = +secondBase[index].latitudeDegrees,
        lng = +secondBase[index].longitudeDegrees,
        needConverse = this.handleBorderData([lng, lat], chinaAndTaiwanBorder);

      // 使用套件將大地座標轉為百度座標（勿使用baidu官方轉換座標的api）-1100330
      let bd09Point;
      if (this.uiFlag.userInChina || needConverse) {
        bd09Point = transform([lng, lat], WGS84, BD09);
      } else {
        bd09Point = transform([lng, lat], WGS84, WGS84);
      }

      const position = new BMap.Point(bd09Point[0], bd09Point[1]);
      this.mapPlay.playerMark[fileId].onMove(position);
      return false;
    } else {
      return true;
    }
  }

  /**
   * 將相同距離的數據進行合併均化，並只回傳符合圖表格式配速（秒）和距離數據
   * @param point {Array<any>}
   * @author kidin-1100325
   */
  filterSameDistanceData(point: Array<any>) {
    const result = [];
    let sameLen = 1,
      sameTotal = 0;
    for (let i = 0, len = point.length; i < len; i++) {
      const { distanceMeters: disA, speed: speedA } = point[i];
      if (i !== len - 1) {
        const { distanceMeters: disB } = point[i + 1];
        if (disA === disB) {
          sameLen += 1;
          sameTotal += speedA;
        } else {
          if (sameLen >= 2) {
            const avgSpeed = (sameTotal + speedA) / sameLen,
              costSecond = this.countCostSecond(avgSpeed);
            result.push([+disA, costSecond]);
            (sameLen = 1), (sameTotal = 0);
          } else {
            const costSecond = this.countCostSecond(speedA);
            result.push([+disA, costSecond]);
          }
        }
      } else {
        if (sameLen >= 2) {
          const avgSpeed = (sameTotal + speedA) / sameLen,
            costSecond = this.countCostSecond(avgSpeed);
          result.push([+disA, costSecond]);
        } else {
          const costSecond = this.countCostSecond(speedA);
          result.push([+disA, costSecond]);
        }
      }
    }

    return result;
  }

  /**
   * 將時速轉換成1km/1mi所花費的秒數
   * @param speed {number}-時速
   * @author kidin-1100326
   */
  countCostSecond(speed: number) {
    return +(3600 / (this.unit === 0 ? speed : speed / mi)).toFixed(0);
  }

  /**
   * 點擊播放或暫停
   * @author kidin-1100326
   */
  handlePlaying() {
    if (this.mapPlay.startPlaying) {
      this.mapPlay.pause = !this.mapPlay.pause;
    } else {
      this.startPlaying();
    }
  }

  /**
   * 點擊停止或賽事重新開始時，將狀態初始化
   * @author kidin-1100326
   */
  initMapPlay() {
    if (this.playInterval) clearInterval(this.playInterval);
    this.mapPlay.startPlaying = false;
    this.mapPlay.pause = false;
    this.mapPlay.truthSecond = 0;
    // 將所有參賽者回歸原點
    for (const _playerId in this.loadedList) {
      if (this.loadedList.hasOwnProperty(_playerId)) {
        if (this.mapOpt.mapSource === 'google') {
          this.setGMapMark(+_playerId, 0);
        } else {
          this.setBMapMark(+_playerId, 0);
        }
      }
    }

    this.mapPlay.init = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 顯示播放速度選項清單
   * @author kidin-1100326
   */
  showPlaySpeedOpt(e: MouseEvent) {
    e.stopPropagation();
    this.mapPlay.showSpeedOpt = true;
    this.subscribeClick();
  }

  /**
   * 開始播放模擬賽事
   * @author kidin-1100326
   */
  startPlaying() {
    if (!this.mapPlay.init) this.initMapPlay();
    this.mapPlay.startPlaying = true;
    this.playInterval = setInterval(() => {
      if (!this.mapPlay.pause) {
        this.mapPlay.truthSecond++;
        let raceCompleted = true;
        for (const _playerId in this.loadedList) {
          if (this.loadedList.hasOwnProperty(_playerId)) {
            if (this.mapOpt.mapSource === 'google') {
              if (!this.setGMapMark(+_playerId, this.mapPlay.truthSecond)) raceCompleted = false;
            } else {
              if (!this.setBMapMark(+_playerId, this.mapPlay.truthSecond)) raceCompleted = false;
            }
          }
        }

        if (raceCompleted) {
          this.handleRaceCompleted();
          this.mapPlay.truthSecond--; // 讓總計時跟最後一名時間相同
        }
      }

      this.changeDetectorRef.markForCheck();
    }, 1000 / this.mapPlay.playSpeed);
  }

  /**
   * 重播賽事結束
   * @author kidin-1100330
   */
  handleRaceCompleted() {
    if (this.playInterval) clearInterval(this.playInterval);
    this.mapPlay.startPlaying = false;
    this.mapPlay.pause = false;
    this.mapPlay.init = false;
  }

  /**
   * 變更播放速度
   * @param speed {PlaySpeed}-播放速度
   * @author kidin-1100326
   */
  changePlayingSpeed(speed: PlaySpeed) {
    this.mapPlay.playSpeed = speed;
    if (this.mapPlay.startPlaying && this.playInterval) {
      clearInterval(this.playInterval);
      this.startPlaying();
    }
  }

  /**
   * 取消訂閱rxjs及移除google map 監聽
   */
  ngOnDestroy(): void {
    if (this.playInterval) clearInterval(this.playInterval);
    if (this.googleObj.zoomListener) google.maps.event.removeListener(this.googleObj.zoomListener);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

/**
 * 自定義google map mark
 * @author kidin-1100329
 * @refrence https://developers.google.com/maps/documentation/javascript/examples/overlay-popup
 */
class CustomGMapIcon extends google.maps.OverlayView {
  position: any; // 該mark gpx位置
  containerDiv: HTMLDivElement;
  icon: HTMLDivElement;
  offset = 15;
  img: any;

  constructor(iconSize: number, position: any, name: string, imgUrl: string, color: string) {
    super();
    this.position = position;
    this.containerDiv = document.createElement('div');
    this.containerDiv.className = 'custom__mark';

    this.img = document.createElement('img');
    this.img.src = imgUrl;
    this.img.title = name;
    this.img.style.border = `3px solid ${color}`;
    this.img.style.height = `${iconSize}px`;
    this.img.style.width = `${iconSize}px`;
    this.img.onerror = () => {
      this.img.src = '/assets/images/user2.png';
    };

    this.containerDiv.appendChild(this.img);

    // Optionally stop clicks, etc., from bubbling up to the map.
    CustomGMapIcon.preventMapHitsAndGesturesFrom(this.containerDiv);
  }

  /**
   * Called when the CustomIcon is added to the map.
   */
  onAdd() {
    this.getPanes().floatPane.appendChild(this.containerDiv);
  }

  /**
   * Called when the CustomIcon is removed from the map.
   */
  onRemove() {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
    }
  }

  /**
   * 移動mark至指定位置
   * @param next {google.maps.LatLng}-欲移動之座標
   * @author kidin-1100329
   *
   */
  onMove(next: any) {
    this.position = next;
    this.draw();
  }

  /**
   * 調整icon大小
   * @param size {number}
   * @author kidin-1100329
   */
  adjustIconSize(size: number) {
    this.img.style.height = `${size}px`;
    this.img.style.width = `${size}px`;
    this.offset = size / 2;
    this.draw();
  }

  /**
   * Called each frame when the CustomIcon needs to draw itself.
   */
  draw() {
    const divPosition = this.getProjection().fromLatLngToDivPixel(this.position);

    // Hide the CustomIcon when it is far out of view.
    const display =
      Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? 'block' : 'none';

    if (display === 'block') {
      this.containerDiv.style.left = `${divPosition.x - this.offset}px`;
      this.containerDiv.style.top = `${divPosition.y - this.offset}px`;
    }

    if (this.containerDiv.style.display !== display) {
      this.containerDiv.style.display = display;
    }
  }
}

/**
 * 自定義baidu map mark
 * @author kidin-1100329
 * @refrence http://lbsyun.baidu.com/index.php?title=jspopular3.0/guide/custom-markers
 */
class CustomBMapIcon extends BMap.Overlay {
  position: any; // 該mark gpx位置
  containerDiv: HTMLDivElement;
  icon: HTMLDivElement;
  offset = 15;
  img: any;
  map: any;

  constructor(iconSize: number, position: any, name: string, imgUrl: string, color: string) {
    super();
    this.position = position;
    this.containerDiv = document.createElement('div');
    this.containerDiv.className = 'custom__mark';

    this.img = document.createElement('img');
    this.img.src = imgUrl;
    this.img.title = name;
    this.img.style.border = `3px solid ${color}`;
    this.img.style.height = `${iconSize}px`;
    this.img.style.width = `${iconSize}px`;
    this.img.onerror = () => {
      this.img.src = '/assets/images/user2.png';
    };

    this.containerDiv.appendChild(this.img);
  }

  /**
   * 初始化自定義mark
   */
  initialize(map: any) {
    this.map = map;
    map.getPanes().markerPane.appendChild(this.containerDiv);
  }

  /**
   * 移除自定義mark
   */
  onRemove() {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
    }
  }

  /**
   * 移動mark至指定位置
   * @param next {google.maps.LatLng}-欲移動之座標
   * @author kidin-1100329
   *
   */
  onMove(next: any) {
    this.position = next;
    this.draw();
  }

  /**
   * 調整icon大小
   * @param size {number}
   * @author kidin-1100329
   */
  adjustIconSize(size: number) {
    this.img.style.height = `${size}px`;
    this.img.style.width = `${size}px`;
    this.offset = size / 2;
    this.draw();
  }

  /**
   * 繪製mark
   */
  draw() {
    const divPosition = this.map.pointToOverlayPixel(this.position);

    this.containerDiv.style.left = `${divPosition.x - this.offset}px`;
    this.containerDiv.style.top = `${divPosition.y - this.offset}px`;
  }
}
