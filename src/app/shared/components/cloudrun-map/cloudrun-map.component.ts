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
  SimpleChanges,
} from '@angular/core';
import { Subscription, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Unit } from '../../enum/value-conversion';
import { mi } from '../../models/bs-constant';
import { ProfessionalService } from '../../../containers/professional/services/professional.service';
import { SelectDate } from '../../models/utils-type';
import {
  AuthService,
  Api21xxService,
  HintDialogService,
  ApiCommonService,
} from '../../../core/services';
import { RacerInfo, RacerPositionList } from '../../../core/models/compo';
import { displayGroupLevel } from '../../../core/utils';

// 若google api掛掉則建物件代替，避免造成gptfit卡住。
const google: any = (window as any).google;
const leaflet: any = (window as any).L;

type MapSource = 'google' | 'OSM';
type PlaySpeed = 1 | 5 | 10 | 20 | 50 | 100;

@Component({
  selector: 'app-cloudrun-map',
  templateUrl: './cloudrun-map.component.html',
  styleUrls: ['./cloudrun-map.component.scss'],
})
export class CloudrunMapComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('gMap') gMap: ElementRef;
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
    showMap: false,
    showMapOpt: false,
    changeMapSource: false,
    removeAllRacer: true,
  };

  /**
   * 地圖設定
   */
  mapOpt = {
    showMapSourceSelector: true,
    mapSource: <MapSource>'google', // 地圖來源
  };

  /**
   * 地圖播放相關flag
   */
  mapPlay = {
    init: true,
    startPlaying: false,
    pause: false,
    playSpeed: <PlaySpeed>10,
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
  playerList: Array<any>; // 所有玩家列表
  loadedList = new Map(); // 使用者選擇載入的列表
  chartData = [];
  dataStore = {}; // 將已載入過得使用者point資料暫存起來
  lastLoadedRacer: RacerInfo | null = null;
  lastUnloadRacer: number | null = null;
  currentFocusRacer: number;
  racerPositionList: RacerPositionList = new Map();

  constructor(
    private api21xxService: Api21xxService,
    private changeDetectorRef: ChangeDetectorRef,
    private professionalService: ProfessionalService,
    private authService: AuthService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(e: SimpleChanges): void {
    if (e.mapGpx) {
      this.initVar();
      this.checkMapLoaded(this.mapGpx);
    }

    if (this.userList && e.userList) {
      if (this.groupId) this.groupLevel = +displayGroupLevel(this.groupId);
      this.createPlayerList(this.userList);
      if (this.isPreviewMode) {
        this.mapOpt.mapSource = this.mapSource;

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
      if ('L' in window) {
        this.uiFlag.showMap = true;
        if (!this.uiFlag.changeMapSource) this.mapOpt.mapSource = 'OSM';
      } else {
        this.mapOpt.showMapSourceSelector = false;
      }

      // 判斷google map是否可以載入
      if (google && typeof google.maps === 'object') {
        this.uiFlag.showMap = true;
        if (!this.uiFlag.changeMapSource) this.mapOpt.mapSource = 'google';
      } else {
        this.mapOpt.showMapSourceSelector = false;
      }
    } else {
      this.uiFlag.showMap = true;
      this.mapOpt.showMapSourceSelector = false;
    }

    this.uiFlag.changeMapSource = true;
  }

  /**
   * 初始化變數
   * @author kidin-1100325
   */
  initVar() {
    this.dataStore = {};
    this.loadedList.clear();
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
    this.removeAllPlayerMark();
    this.mapOpt.mapSource = source;
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
          groupId: this.groupId ? `${this.professionalService.getBlurryGroupId(this.groupId)}` : '',
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

      this.api21xxService.fetchMultiActivityData(body).subscribe((res) => {
        const { resultCode, resultMessage, apiCode, info } = res;
        if (resultCode !== 200) {
          this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
        } else if (!info || !info.activities || info.activities.length === 0) {
          const msg = 'Oops! Loading error.';
          this.hintDialogService.openAlert(msg);
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
    if (this.loadedList.get(fileId)) {
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
    const { fileId } = this.playerList[index];
    if (this.loadedList.get(fileId)) {
      this.currentFocusRacer = fileId;
    }
  }

  /**
   * 使用者移開聚焦的對象
   * @param index {number}
   * @author kidin-1100412
   */
  blurPlayer(index: number) {
    const { fileId } = this.playerList[index];
    if (this.loadedList.get(fileId)) {
      this.currentFocusRacer = null;
    }
  }

  /**
   * 移除玩家
   * @param fileId {number}
   * @author kidin-1100326
   */
  removePlayer(fileId: number) {
    this.loadedList.delete(fileId);
    this.lastUnloadRacer = fileId;
    this.lastLoadedRacer = null;
  }

  /**
   * 移除地圖上所有玩家mark
   * @author kidin-1100329
   */
  removeAllPlayerMark() {
    this.loadedList.clear();
    this.racerPositionList.clear();
    this.uiFlag.removeAllRacer = true;
    this.lastLoadedRacer = null;
    this.lastUnloadRacer = null;
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
    const random = (Math.random() * 300).toFixed(0);
    const { fileId, name, icon } = this.playerList[index];
    const { distanceBase, secondBase } = this.dataStore[fileId];
    const representColor = `hsla(${random}, 70%, 50%, 1)`;
    const racerInfo = {
      name,
      icon,
      distanceBase,
      secondBase,
      color: representColor,
    };

    const racerMarkInfo: RacerInfo = {
      name,
      imgUrl: icon,
      fileId,
      color: representColor,
    };

    this.loadedList.set(fileId, racerInfo);
    this.lastLoadedRacer = racerMarkInfo;
    this.lastUnloadRacer = null;
    this.uiFlag.removeAllRacer = false;
  }

  /**
   * 設定玩家在map的位置
   * @param fileId {number}
   * @param index {number}-路徑索引值
   */
  getPosition(fileId: number, index: number): [number, number] | null {
    const { secondBase } = this.loadedList.get(fileId);
    if (secondBase[index]) {
      const { latitudeDegrees, longitudeDegrees } = secondBase[index];
      return [+latitudeDegrees, +longitudeDegrees];
    } else {
      return null;
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
   */
  initMapPlay() {
    if (this.playInterval) clearInterval(this.playInterval);
    this.mapPlay.startPlaying = false;
    this.mapPlay.pause = false;
    this.mapPlay.truthSecond = 0;
    // 將所有參賽者回歸原點
    this.loadedList.forEach((_value, _key) => {
      const fileId = +_key;
      const position = this.getPosition(fileId, 0);
      if (position) {
        this.racerPositionList.set(fileId, position);
      }
    });

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
        this.loadedList.forEach((_value, _key) => {
          const fileId = +_key;
          const position = this.getPosition(fileId, this.mapPlay.truthSecond);
          if (position) {
            raceCompleted = false;
            this.racerPositionList.set(fileId, position);
          }
        });

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
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    if (this.playInterval) clearInterval(this.playInterval);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
