import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { Subject, combineLatest, of, fromEvent, Subscription } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MapLanguageEnum } from '../../../../shared/models/i18n';
import { Domain, WebIp } from '../../../../shared/enum/domain';
import { formTest } from '../../../../shared/models/form-test';
import { EventStatus } from '../../models/activity-content';
import {
  NodejsApiService,
  AuthService,
  Api20xxService,
  ApiCommonService,
} from '../../../../core/services';
import { getCurrentTimestamp, deepCopy, getUrlQueryStrings } from '../../../../core/utils';

type SwitchType = 'main' | 'sub';
type SwitchAction = 'up' | 'down';
enum RankType {
  event,
  cumulativeClimb,
  cumulativeDistance,
  routine,
  mapBest,
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    rankType: <RankType>RankType.event,
    mainListTop: <RankType>RankType.event,
    subListTop: 0,
    currentFocusList: 0,
    mapLanguageIndex: 0,
    filterGroup: <string | null>null,
    screenSize: window.innerWidth,
  };

  token = this.authService.token;
  subList: Array<any> = [];
  eventList: Array<any> = [];
  backupList: Array<any> = [];
  rankList: Array<any> = [];
  mapInfo: Array<any> = [];
  routine: Array<any> = [];
  groupList: Array<any> = [];
  queryEventId: number | null = null;
  readonly RankType = RankType;
  readonly rankListLength = Object.keys(RankType).length / 2;
  readonly shiftLength = 35;
  readonly mapIconPath = `https://${this.getIconHost()}/app/public_html/cloudrun/update/`;

  constructor(
    private officialActivityService: OfficialActivityService,
    private apiCommonService: ApiCommonService,
    private api20xxService: Api20xxService,
    private translateService: TranslateService,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.uiFlag.mapLanguageIndex = this.checkLanguage();
    this.getQueryString();
    this.handlePageResize();
    this.getAllMapInfo();
    this.getRaceList();
  }

  /**
   * 取得url query string，若為event id，則請求排行榜
   * @author kidin-1101214
   */
  getQueryString() {
    const { eventId } = getUrlQueryStrings(location.search);
    if (eventId) {
      const valid = formTest.number.test(eventId);
      if (valid) {
        this.queryEventId = +eventId;
      }
    }
  }

  /**
   * 取得圖片放置domain
   * @author kidin-1101201
   */
  getIconHost() {
    const { host } = location;
    const isDevelop = host.includes(WebIp.develop) || host.includes(Domain.uat);
    return isDevelop ? Domain.uat : Domain.newProd;
  }

  /**
   * 確認現在語系為何
   * @author kidin-1101130
   */
  checkLanguage() {
    const language = this.translateService.currentLang.toLowerCase();
    switch (language) {
      case 'zh-tw':
        return MapLanguageEnum.TW;
      case 'zh-cn':
        return MapLanguageEnum.CN;
      case 'es-es':
        return MapLanguageEnum.ES;
      default:
        return MapLanguageEnum.EN;
    }
  }

  /**
   * 處理視窗大小改變事件
   * @author kidin1101019
   */
  handlePageResize() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.uiFlag.screenSize = window.innerWidth;
    });
  }

  /**
   * 切換選單列表
   * @param type {SwitchType}-切換的選單類別
   * @param action {SwitchAction}-切換動作
   * @author kidin-1101130
   */
  switchList(type: SwitchType, action: SwitchAction) {
    if (type === 'main') {
      this.shiftMainList(action);
    } else {
      this.shiftSubList(action);
    }
  }

  /**
   * 變更排行榜類別
   * @param type {SwitchAction}-排行榜類別
   * @author kidin-1101130
   */
  selectRankType(type: RankType) {
    const { rankType } = this.uiFlag;
    if (type !== rankType) {
      this.uiFlag.rankType = type;
      this.uiFlag.subListTop = 0;
      this.uiFlag.currentFocusList = 0;
      this.getSubList(type);
    }
  }

  /**
   * 選擇指定之副選單排行榜
   * @param index {number}-副選單序列
   * @author kidin-1101201
   */
  selectSubList(index: number) {
    this.uiFlag.currentFocusList = index;
    this.uiFlag.progress = 30;
    const { rankType } = this.uiFlag;
    switch (rankType) {
      case RankType.event:
        this.getEventRank(index);
        break;
      case RankType.mapBest: {
        const mapId = index + 1;
        this.getMapBestRank(mapId);
        break;
      }
      case RankType.cumulativeClimb:
        this.getRankData(3, index);
        break;
      case RankType.cumulativeDistance:
        this.getRankData(2, index);
        break;
      case RankType.routine:
        this.getRankData(1, index);
        break;
    }
  }

  /**
   * 偏移排行類別選單
   * @param action {SwitchAction}-切換動作
   * @author kidin-1101130
   */
  shiftMainList(action: SwitchAction) {
    const {
      uiFlag: { mainListTop },
      rankListLength,
    } = this;
    let nextTop: number;
    if (action === 'down') {
      const maxShiftTop = rankListLength - 3;
      nextTop = mainListTop === maxShiftTop ? maxShiftTop : mainListTop + 1;
    } else {
      nextTop = mainListTop === RankType.event ? RankType.event : mainListTop - 1;
    }

    this.uiFlag.mainListTop = nextTop;
  }

  /**
   * 根據主類別顯示副清單列表，並顯示副清單中第一項之排行榜
   * @param type {RankType}-主類別選單列表
   * @author kidin-1101130
   */
  getSubList(type: RankType) {
    this.uiFlag.progress = 30;
    const { eventList, mapInfo, routine } = this;
    switch (type) {
      case RankType.event:
        this.subList = deepCopy(eventList);
        if (eventList.length > 0) {
          this.getEventRank(0);
        } else {
          this.uiFlag.progress = 30;
        }
        break;
      case RankType.mapBest:
        this.subList = deepCopy(mapInfo);
        this.getMapBestRank(1);
        break;
      case RankType.cumulativeClimb:
        this.subList = [...routine];
        this.getRankData(3, 0);
        break;
      case RankType.cumulativeDistance:
        this.subList = [...routine];
        this.getRankData(2, 0);
        break;
      case RankType.routine:
        this.subList = [...routine];
        this.getRankData(1, 0);
        break;
    }
  }

  /**
   * 偏移副選單
   * @param action {SwitchAction}-切換動作
   * @author kidin-1101130
   */
  shiftSubList(action: SwitchAction) {
    const {
      uiFlag: { subListTop },
      subList,
    } = this;
    const subListLength = subList.length;
    if (subListLength > 3) {
      let nextTop: number;
      if (action === 'down') {
        const maxShiftTop = subListLength - 3;
        nextTop = subListTop === maxShiftTop ? maxShiftTop : subListTop + 1;
      } else {
        nextTop = subListTop === 0 ? 0 : subListTop - 1;
      }

      this.uiFlag.subListTop = nextTop;
    }
  }

  /**
   * 取得所有雲跑地圖資訊
   * @author kidin-1101130
   */
  getAllMapInfo() {
    combineLatest([
      this.officialActivityService.getRxAllMapInfo(),
      this.officialActivityService.getRxRoutine(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resultArray) => {
        const [list, leaderboard] = resultArray as any;
        this.mapInfo = list;
        this.routine = leaderboard;
      });
  }

  /**
   * 取得副列表，並顯示列表第一個的排行榜
   * @author kidin-1101130
   */
  getRaceList() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      const currentTimestamp = getCurrentTimestamp();
      const baseDate = '2021-11-01T00:00:00';
      const startTimestamp = new Date(baseDate).getTime() / 1000;
      const body = {
        token: this.token,
        filterRaceStartTime: startTimestamp,
        filterRaceEndTime: currentTimestamp,
        page: {
          index: 0,
          counts: 100,
        },
      };

      this.officialActivityService.getEventList(body).subscribe((res) => {
        if (this.apiCommonService.checkRes(res)) {
          const eventList = res.eventList.filter((list) => list.eventStatus === EventStatus.audit);
          this.eventList = eventList;
          this.subList = eventList;
          if (eventList.length > 0) {
            const index = this.getAssignLeaderboardIndex(eventList);
            this.uiFlag.currentFocusList = index;
            const {
              eventId,
              cloudrunMapId: mapId,
              raceDate: { startDate: raceStartDate, endDate: raceEndDate },
            } = eventList[index];

            const reqBody = {
              token: this.token,
              rankType: 4,
              mapId,
              eventId,
              raceStartDate,
              raceEndDate,
              page: 0,
              pageCounts: 10000,
            };

            this.getEventGroup(eventId);
            this.getLeaderboardStatistics(reqBody);
          } else {
            this.uiFlag.progress = 100;
          }
        }
      });
    }
  }

  /**
   * 取得指定之活動列表序列
   * @param list {Array<any>}-活動列表
   * @param eventId {number}-欲顯示之
   * @author kidin-1110307
   */
  getAssignLeaderboardIndex(list: Array<any>) {
    if (this.queryEventId) {
      const index = list.findIndex((_list) => _list.eventId === this.queryEventId);
      return index >= 0 ? index : 0;
    } else {
      return 0;
    }
  }

  /**
   * 取得指定活動之排行榜
   * @param index {number}-活動清單序列
   * @author kidin-1101201
   */
  getEventRank(index: number) {
    const { token, subList } = this;
    const {
      eventId,
      cloudrunMapId: mapId,
      raceDate: { startDate: raceStartDate, endDate: raceEndDate },
    } = subList[index];

    this.getEventGroup(eventId);

    const body = {
      token,
      rankType: 4,
      mapId,
      eventId,
      raceStartDate,
      raceEndDate,
      page: 0,
      pageCounts: 10000,
    };

    this.getLeaderboardStatistics(body);
  }

  /**
   * 取得指定地圖最佳排行榜
   * @param mapId {number}-雲跑地圖流水id
   * @author kidin-1101201
   */
  getMapBestRank(mapId: number) {
    const body = {
      token: this.token,
      rankType: 3,
      mapId,
      page: 0,
      pageCounts: 10000,
    };

    this.getLeaderboardStatistics(body);
  }

  /**
   * 取得指定活動所有分組
   * @param eventId {number}-指定之活動id
   * @author kidin-1101201
   */
  getEventGroup(eventId: number) {
    this.officialActivityService.getEventDetail({ eventId }).subscribe((res) => {
      if (this.apiCommonService.checkRes(res)) {
        const { group } = res.eventDetail;
        this.groupList = this.assignGroupColor(group);
      }
    });
  }

  /**
   * 指定各分組代表色
   * @param groupList {Array<any>}-分組清單
   * @author kidin-1101201
   */
  assignGroupColor(groupList: Array<any>) {
    const length = groupList.length;
    const groupColor = this.officialActivityService.assignGroupColor(length);
    const newList = groupList.map((_group, index) => {
      const color = groupColor[index];
      Object.assign(_group, { color });
      return _group;
    });

    return newList;
  }

  /**
   * 初始化部份flag
   * @author kidin-1101202
   */
  initFlag() {
    this.rankList = [];
    this.backupList = [];
    this.uiFlag.filterGroup = null;
  }

  /**
   * 取得排行榜（api 2016）
   * @param body {any}
   * @author kidin-1101130
   */
  getLeaderboardStatistics(body: any) {
    this.initFlag();
    this.nodejsApiService
      .getLeaderboardStatistics(body)
      .pipe(
        switchMap((leaderboard) => {
          this.uiFlag.progress += 15;
          const requestSuccess = this.apiCommonService.checkRes(leaderboard);
          const rankList = leaderboard.info ? leaderboard.info.rankList : [];
          if (requestSuccess && rankList.length > 0) {
            const body = {
              search: {
                userInfo: {
                  args: { userId: this.getRacerList(rankList) },
                  target: ['nickname', 'icon'],
                },
              },
            };

            // 透過api取得所有參賽者的暱稱與頭像
            return this.nodejsApiService.getAssignInfo(body).pipe(
              map((userList) => {
                if (this.apiCommonService.checkRes(userList)) {
                  const { result } = userList;
                  return rankList.map((_rankList, index) => {
                    const plugin = result[index];
                    Object.assign(_rankList, plugin);
                    if (this.uiFlag.rankType === RankType.event) {
                      const { groupList } = this;
                      const idx = groupList.findIndex(
                        (_groupList) => _groupList.name === _rankList.groupName
                      );
                      const color = groupList[idx].color;
                      Object.assign(_rankList, { color });
                    }

                    return _rankList;
                  });
                } else {
                  return of(leaderboard);
                }
              })
            );
          } else {
            return of(leaderboard);
          }
        })
      )
      .subscribe((res) => {
        if (Array.isArray(res)) {
          this.backupList = deepCopy(res);
          this.rankList = deepCopy(res);
        }

        this.uiFlag.progress = 100;
      });
  }

  /**
   * 取得排行榜（api 2010）
   * @param rankType {number}-排行榜類別
   * @param index {number}-指定的副選單序列
   * @author kidin-1101201
   */
  getRankData(rankType: number, index: number) {
    this.initFlag();
    const { month, mapId } = this.subList[index];
    const body = {
      rankType,
      month,
      queryType: 2,
      page: 0,
      pageCounts: 100,
    };

    if (rankType === 1) Object.assign(body, { mapId });
    this.api20xxService
      .getRankData(body)
      .pipe(
        switchMap((rankResult) => {
          if (this.apiCommonService.checkRes(rankResult)) {
            this.uiFlag.progress += 15;
            const { accRankList, rankList } = rankResult.info;
            const list = accRankList ? accRankList : rankList;
            if (list.length > 0) {
              const nameList = list.map((_list) => _list.raceManName);
              const alaqlBody = {
                search: {
                  userInfo: {
                    args: { nickname: nameList },
                    target: ['icon'],
                  },
                },
              };

              // 透過api取得所有參賽者的頭像，並將物件參數重新命名
              return this.nodejsApiService.getAssignInfo(alaqlBody).pipe(
                map((alaqlResult) => {
                  if (this.apiCommonService.checkRes(alaqlResult)) {
                    return list.map((_list, index) => {
                      const { rankNum: rank, raceManName: nickname, rankItemValue: result } = _list;
                      const { icon } = alaqlResult.result[index];
                      return { rank, nickname, result, icon };
                    });
                  } else {
                    return of(rankResult);
                  }
                })
              );
            } else {
              return of(rankResult);
            }
          } else {
            return of(rankResult);
          }
        })
      )
      .subscribe((res) => {
        if (Array.isArray(res)) this.rankList = res;
        this.uiFlag.progress = 100;
      });
  }

  /**
   * 根據排行榜清單取得參賽者user id清單
   * @param rankList {Array<any>}-排行榜清單
   * @author kidin-1101130
   */
  getRacerList(rankList: Array<any>) {
    const racer: Array<number> = [];
    rankList.forEach((_list) => {
      racer.push(_list.userId);
    });

    return racer;
  }

  /**
   * 篩選指定分組之排行榜
   * @param groupName {string}-群組名稱
   * @author kidin-1101202
   */
  filterGroup(groupName: string | null = null) {
    this.uiFlag.filterGroup = groupName;
    if (groupName) {
      const filterList = deepCopy(this.backupList.filter((_list) => _list.groupName === groupName));
      this.rankList = filterList.map((_filterList, index) => {
        let rank: number;
        if (index === 0) {
          rank = 1;
        } else {
          const { rank: frontRank, result: frontResult } = filterList[index - 1];
          rank = _filterList.result === frontResult ? frontRank : frontRank + 1;
        }

        Object.assign(_filterList, { rank });
        return _filterList;
      });
    } else {
      this.rankList = deepCopy(this.backupList);
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
