import { Injectable } from '@angular/core';
import {
  Api10xxService,
  Api11xxService,
  Api21xxService,
  AuthService,
  UserService,
  HashIdService,
  LocalstorageService,
} from '../../../core/services';
import {
  Api2103Post,
  Api2103Response,
  SportsFileInfo,
  ActivityInfo,
  ActivityLap,
  ActivityPoint,
} from '../../../core/models/api/api-21xx';
import { DisplayDetailField } from '../../../core/enums/api';
import { of, ReplaySubject } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { checkResponse, splitNameInfo, handleSceneryImg, deepCopy } from '../../../core/utils';
import { appPath } from '../../../app-path.const';
import { SportType } from '../../../core/enums/sports';
import {
  QuadrantSetting,
  QuadrantDataOpt,
  QuadrantNum,
  QuadrantPoint,
  QuadrantData,
} from '../../../core/models/compo';
import { TranslateService } from '@ngx-translate/core';
import { MinMaxHandler } from '../../../core/classes';
import { quadrantColor } from '../../../core/models/represent-color';

@Injectable({
  providedIn: 'root',
})
export class SportsDetailService {
  /**
   * 運動檔案檔案是否有使用者自己上傳的佈景圖
   */
  private _haveFileSenery = false;

  /**
   * 象限圖設定
   */
  private _quadrantSetting = new ReplaySubject<QuadrantSetting>(1);

  constructor(
    private authService: AuthService,
    private api10xxService: Api10xxService,
    private api11xxService: Api11xxService,
    private api21xxService: Api21xxService,
    private userService: UserService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private localstorageService: LocalstorageService
  ) {}

  /**
   * 取得運動檔案是否已有自訂佈景圖
   */
  get haveFileSenery() {
    return this._haveFileSenery;
  }

  /**
   * 取得基本運動檔案，並判斷檔案持有人是否為登入者
   * @param fileId 運動檔案流水編號
   */
  getBaseSportsDetail(fileId: number) {
    const body = this.getApi2103Post(fileId);
    return this.api21xxService.fetchSportListDetail(body).pipe(
      switchMap((res1) => this.getFileScenery(res1, true)),
      switchMap((res2) => this.getBaseOwnerInfo(res2))
    );
  }

  /**
   * 補足根據複合式運動檔案資訊，如判斷檔案持有人是否為登入者以及取得佈景圖
   * @param fileId 運動檔案流水編號
   */
  handleBaseComplexDetail(data: Api2103Response) {
    return of(data).pipe(
      switchMap((res1) => this.getFileScenery(res1, true)),
      switchMap((res2) => this.getBaseOwnerInfo(res2))
    );
  }

  /**
   * 取得 api 2103 post
   * @param fileId 運動檔案流水編號
   */
  getApi2103Post(fileId: number): Api2103Post {
    return {
      token: this.authService.token,
      fileId,
      displayDetailField: DisplayDetailField.showByCJson,
    };
  }

  /**
   * 取得檔案擁有人icon
   * @param res api 2103 回應
   */
  getBaseOwnerInfo(res: Api2103Response) {
    const userId = +splitNameInfo(res.fileInfo.author).userId;
    if (!userId) return this.handleOldFormat(res);

    const isFileOwner = this.userService.getUser().userId === +userId;
    return isFileOwner ? this.addUserInfo(res) : this.addOwnerInfo(res, userId);
  }

  /**
   * 若檔案無佈景圖，則依運動類別與副類別給予預設圖片
   * @param res api 2103 回應
   * @param isBaseData 是否為基準運動檔案數據
   */
  getFileScenery(res: Api2103Response, isBaseData: boolean) {
    const {
      fileInfo: { photo },
      activityInfoLayer: { type, subtype },
    } = res;
    const notHavePhoto = !photo;
    if (notHavePhoto) {
      res.fileInfo.photo = handleSceneryImg(+type, subtype ?? 0);
    }

    if (isBaseData) this._haveFileSenery = !notHavePhoto;
    return of(res);
  }

  /**
   * 舊有運動檔案 fileInfo.author欄位可能為非 $nickname?userId=$userId 的格式
   * @param res api 2103 回應
   */
  handleOldFormat(res: Api2103Response) {
    return of({ data: res, isFileOwner: false });
  }

  /**
   * 將 api 2103 添加登入者的icon url
   * @param res api 2103 回應
   */
  addUserInfo(res: Api2103Response) {
    const { icon, userId } = this.userService.getUser();
    const authorLink = this.getUserLink(userId as number);
    res.fileInfo = { ...res.fileInfo, authorIcon: icon, authorLink };
    return of({ data: res, isFileOwner: true });
  }

  /**
   * 取得使用者個人頁面連結
   */
  getUserLink(userId: number) {
    const hashUserId = this.hashIdService.handleUserIdEncode(userId);
    return `/${appPath.personal.home}/${hashUserId}`;
  }

  /**
   * 將 api 2103 添加非登入者的檔案持有者icon url
   * @param res api 2103 回應
   */
  addOwnerInfo(res: Api2103Response, userId: number) {
    const body = { targetUserId: userId };
    return this.api10xxService.fetchGetUserProfile(body).pipe(
      map((ownerInfo) => {
        const authorIcon = ownerInfo?.userProfile?.avatarUrl ?? '';
        const authorLink = this.getUserLink(userId);
        res.fileInfo = { ...res.fileInfo, authorIcon, authorLink };
        return { data: res, isFileOwner: false };
      })
    );
  }

  /**
   * 取得自己的運動檔案列表作為可選擇的比較清單
   * @param body
   */
  getCompareList(body) {
    return this.api21xxService
      .fetchSportList(body)
      .pipe(switchMap((res) => this.checkListResponse(res)));
  }

  /**
   * 確認運動列表回應有無問題，有問題就當作無資料
   * @param res
   */
  checkListResponse(res) {
    const isEffect = checkResponse(res, false);
    const result = isEffect ? res : { info: [], totalCounts: 0 };
    return of(result);
  }

  /**
   * 取得比較運動檔案詳細資料，並與基本運動檔案進行處理以符合各區塊顯示格式
   * @param fileId 運動檔案流水編號
   */
  getCompareSportsDetail(fileId: number) {
    const body = this.getApi2103Post(fileId);
    return this.api21xxService.fetchSportListDetail(body).pipe(
      switchMap((res1) => this.getFileScenery(res1, false)),
      switchMap((res2) => this.addUserInfo(res2))
    );
  }

  /**
   * 訂閱象限圖設定
   */
  getRxQuadrantSetting() {
    return this._quadrantSetting;
  }

  /**
   * 根據運動類別與使用者先前配置設置象限圖設定
   * @param sportsType 運動類別
   */
  setQuadrantSetting(sportsType: SportType, newSetting?: QuadrantSetting) {
    if (newSetting) {
      this.localstorageService.setQuadrantSetting(sportsType, newSetting);
      this._quadrantSetting.next(newSetting);
    } else {
      const userSetting = this.localstorageService.getQuadrantSetting(sportsType);
      this._quadrantSetting.next(userSetting ?? this.getDefaultQuadrantSetting(sportsType));
    }
  }

  /**
   * 根據運動類別設置預設的象限圖設定
   * @param sportsType 運動類別
   */
  setDefaultQuadrantSetting(sportsType: SportType) {
    this._quadrantSetting.next(this.getDefaultQuadrantSetting(sportsType));
    const userSetting = this.localstorageService.getQuadrantSetting(sportsType);
    if (userSetting) this.localstorageService.removeQuadrantSetting(sportsType);
  }

  /**
   * 根據運動類別取得預設的象限圖設定
   * @param sportsType 運動類別
   */
  getDefaultQuadrantSetting(sportsType: SportType) {
    const translate = (arr: Array<string>) =>
      arr.map((_key) => this.translate.instant(_key)).join('/');
    switch (sportsType) {
      case SportType.run: {
        return {
          xAxis: {
            type: 'speed' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('speed', sportsType),
          },
          yAxis: {
            type: 'hr' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('hr', sportsType),
          },
          meaning: {
            quadrantI: translate([
              'universal_activityData_sprint',
              'universal_activityData_highLoad',
            ]),
            quadrantII: translate([
              'universal_activityData_uphill',
              'universal_activityData_ineffective',
            ]),
            quadrantIII: translate(['universal_activityData_resumeTraining']),
            quadrantIV: translate([
              'universal_activityData_downhill',
              'universal_activityData_highEfficiency',
            ]),
          },
          customMeaning: false,
        };
      }
      case SportType.swim: {
        return {
          xAxis: {
            type: 'speed' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('speed', sportsType),
          },
          yAxis: {
            type: 'cadence' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('cadence', sportsType),
          },
          meaning: {
            quadrantI: translate([
              'universal_activityData_sprint',
              'universal_activityData_accelerate',
            ]),
            quadrantII: translate([
              'universal_activityData_retrograde',
              'universal_activityData_ineffective',
            ]),
            quadrantIII: translate(['universal_activityData_leisureActivities']),
            quadrantIV: translate([
              'universal_activityData_forward',
              'universal_activityData_highEfficiency',
            ]),
          },
          customMeaning: false,
        };
      }
      case SportType.row: {
        return {
          xAxis: {
            type: 'speed' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('speed', sportsType),
          },
          yAxis: {
            type: 'cadence' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('cadence', sportsType),
          },
          meaning: {
            quadrantI: translate([
              'universal_activityData_sprint',
              'universal_activityData_accelerate',
            ]),
            quadrantII: translate([
              'universal_activityData_retrograde',
              'universal_activityData_ineffective',
            ]),
            quadrantIII: translate(['universal_activityData_leisureActivities']),
            quadrantIV: translate([
              'universal_activityData_forward',
              'universal_activityData_highEfficiency',
            ]),
          },
          customMeaning: false,
        };
      }
      default: {
        return {
          xAxis: {
            type: 'speed' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('speed', sportsType),
          },
          yAxis: {
            type: 'cadence' as QuadrantDataOpt,
            origin: this.getQuadrantAxisSetting('cadence', sportsType),
          },
          meaning: {
            quadrantI: translate([
              'universal_activityData_sprint',
              'universal_activityData_accelerate',
            ]),
            quadrantII: translate(['universal_activityData_lightGearRatio']),
            quadrantIII: translate([
              'universal_activityData_uphill',
              'universal_activityData_ineffective',
            ]),
            quadrantIV: translate([
              'universal_activityData_glide',
              'universal_activityData_gearRatio',
            ]),
          },
          customMeaning: false,
        };
      }
    }
  }

  /**
   * 根據數據類別與運動類別取得預設數據源點
   * @param dataType 數據類別
   * @param sportsType 運動類別
   */
  getQuadrantAxisSetting(dataType: QuadrantDataOpt, sportsType: SportType) {
    switch (dataType) {
      case 'cadence': {
        const value = {
          [SportType.run]: 180,
          [SportType.cycle]: 100,
          [SportType.swim]: 30,
          [SportType.row]: 40,
        };
        return value[sportsType] ?? value[SportType.cycle];
      }
      case 'power': {
        const value = {
          [SportType.cycle]: 350,
          [SportType.row]: 400,
        };
        return value[sportsType] ?? value[SportType.cycle];
      }
      case 'speed': {
        const value = {
          [SportType.run]: 10,
          [SportType.cycle]: 30,
          [SportType.swim]: 4.5,
          [SportType.row]: 15,
        };
        return value[sportsType] ?? value[SportType.run];
      }
      default:
        return this.userService.getUser().userHrRange.z4;
    }
  }

  /**
   * 將運動點依象限設定取得分佈位置與各象限佔比
   * @param file 運動檔案
   */
  getRxQuadrantData(file: Api2103Response) {
    return this._quadrantSetting.pipe(map((setting) => this.handleQuadrantData(file, setting)));
  }

  /**
   * 將運動點依象限設定取得分佈位置與各象限佔比
   * @param file 運動點資訊
   * @param setting 象限圖設定
   */
  handleQuadrantData(file: Api2103Response, setting: QuadrantSetting) {
    const {
      activityInfoLayer: { type },
      activityPointLayer: point,
    } = file;
    const pointCopy = deepCopy(point);
    const keyList = pointCopy.shift(); // point陣列首項為數據鍵名
    const keyIndex = this.getKeyIndex(keyList);
    const {
      xAxis: { type: xAxisType, origin: xAxisOrigin },
      yAxis: { type: yAxisType, origin: yAxisOrigin },
    } = setting;
    const xDataIndex = keyIndex[this.getDataKey(xAxisType, +type)];
    const yDataIndex = keyIndex[this.getDataKey(yAxisType, +type)];

    // 象限圖數據
    const chartData: Array<QuadrantPoint> = [];

    // 象限圖邊界
    const boundary = {
      x: new MinMaxHandler(xAxisOrigin),
      y: new MinMaxHandler(yAxisOrigin),
    };

    // 各象限有效數據數目
    const quadrantPointNum: QuadrantNum = {
      i: 0,
      ii: 0,
      iii: 0,
      iv: 0,
    };

    point.forEach((_point) => {
      const _xPoint = _point[xDataIndex];
      const _yPoint = _point[yDataIndex];
      boundary.x.setMinMax(_xPoint);
      boundary.y.setMinMax(_yPoint);
      let pointColor: string; // 該點在象限圖呈現的顏色
      if (_xPoint != null && _yPoint != null) {
        if (_xPoint > xAxisOrigin && _yPoint > yAxisOrigin) {
          quadrantPointNum.i++;
          pointColor = quadrantColor.i;
        } else if (_xPoint <= xAxisOrigin && _yPoint > yAxisOrigin) {
          quadrantPointNum.ii++;
          pointColor = quadrantColor.ii;
        } else if (_xPoint <= xAxisOrigin && _yPoint <= yAxisOrigin) {
          quadrantPointNum.iii++;
          pointColor = quadrantColor.iii;
        } else {
          quadrantPointNum.iv++;
          pointColor = quadrantColor.iv;
        }

        chartData.push({
          x: _xPoint,
          y: _yPoint,
          color: pointColor,
        });
      }
    });

    return { chartData, boundary, quadrantPointNum } as QuadrantData;
  }

  /**
   * 將字串陣列轉為鍵為陣列值，值為陣列索引的物件
   * @param arr 字串陣列
   */
  getKeyIndex(arr: Array<string>) {
    return arr.reduce((_prev, _curr, _index) => {
      _prev = { ..._prev, [_curr]: _index };
      return _prev;
    }, {});
  }

  /**
   * 根據資料類別和運動類別回應api對應的key
   * @param dataType {QuadrantDataOpt}-資料類別
   * @param sportType {SportType}-運動類別
   * @author kidin-1100120
   */
  private getDataKey(dataType: QuadrantDataOpt, sportType: SportType): string {
    switch (dataType) {
      case 'speed':
        return 'speed';
      case 'cadence': {
        const cadence = {
          [SportType.run]: 'runCadence',
          [SportType.cycle]: 'cycleCadence',
          [SportType.swim]: 'swimCadence',
          [SportType.row]: 'rowingCadence',
        };

        return cadence[sportType] ?? cadence[SportType.run];
      }
      case 'power':
        return sportType === SportType.cycle ? 'cycleWatt' : 'rowingWatt';
      default:
        return 'heartRateBpm';
    }
  }

  /**
   * 取得降噪係數
   * @param length {number}-數據長度
   */
  private getCoefficient(length: number): number {
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
}
