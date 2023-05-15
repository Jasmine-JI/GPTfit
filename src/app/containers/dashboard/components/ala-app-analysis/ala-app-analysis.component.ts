import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AlaAppAnalysisService } from '../../services/ala-app-analysis.service';
import dayjs from 'dayjs';
import { AlaApp } from '../../../../shared/models/app-id';
import { AlbumType } from '../../../../shared/models/image';
import { Subject, fromEvent, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { AuthService, NodejsApiService, ApiCommonService } from '../../../../core/services';

enum StatisticTypeEnum {
  sports = 1,
  lifeTracking,
  image,
}

enum ObjType {
  all,
  user,
  group,
}

type StatisticMethod = 'pre' | 'realtime';
type InputType = 'user' | 'group' | 'sn' | 'language' | 'region';

const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
const allApp = [
  AlaApp.gptfit,
  AlaApp.connect,
  AlaApp.cloudrun,
  AlaApp.trainlive,
  AlaApp.fitness,
  AlaApp.tft,
];
const commonRegion = [
  { code: 'TW', name: '台灣' },
  { code: 'CN', name: '中國' },
  { code: 'us', name: '美國' },
];
const commonLanguage = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英文' },
  { code: 'es', name: '西班牙語' },
  { code: 'de', name: '德文' },
  { code: 'fr', name: '法文' },
  { code: 'it', name: '義大利文' },
  { code: 'pt', name: '葡萄牙文' },
];

@Component({
  selector: 'app-AlaApp-analysis',
  templateUrl: './ala-app-analysis.component.html',
  styleUrls: ['./ala-app-analysis.component.scss'],
})
export class AlaAppAnalysisComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  userInputSubscription = new Subscription();
  groupInputSubscription = new Subscription();
  clickEventSubscription = new Subscription();
  @ViewChild('userInput') user: ElementRef;
  @ViewChild('groupInput') group: ElementRef;
  @ViewChild('snInput') sn: ElementRef;
  @ViewChild('regionInput') region: ElementRef;
  @ViewChild('languageInput') language: ElementRef;

  /**
   * ui用到的各種flag
   */
  uiFlag = {
    progress: 100,
    statisticType: <StatisticTypeEnum>StatisticTypeEnum.sports,
    statisticMethod: <StatisticMethod>'pre',
    showAdvancedCondition: false,
    showAutoCompleted: <InputType>null,
  };

  /**
   * 流量統計條件
   */
  filterCondition = <any>{
    createFromApp: allApp,
  };

  /**
   * api 4003 reqbody
   */
  imageReqBody = {
    token: this.authService.token,
    objectType: ObjType.all,
    subset: false,
    imgType: AlbumType.all,
  };

  /**
   * 供日期選擇器用
   */
  selectTime = {
    startTimestamp: dayjs().startOf('month').valueOf(),
    endTimestamp: dayjs().valueOf(),
  };

  /**
   * api所需日期資訊
   */
  searchTime = {
    startTime: dayjs().startOf('month').format(dateFormat),
    endTime: dayjs().format(dateFormat),
  };

  /**
   * 查詢結果
   */
  searchRes = {
    trendChart: {
      gptfit: [],
      connect: [],
      cloudrun: [],
      trainlive: [],
      fitness: [],
      tft: [],
    },
    fileCount: 0,
    totalSpace: 0,
    createTime: 'YYYY-MM-DD  HH:mm',
  };

  autoCompletedList = [];
  readonly allAppNumber = allApp.length;
  readonly AlaApp = AlaApp;
  readonly AlbumType = AlbumType;
  readonly ObjType = ObjType;
  readonly StatisticTypeEnum = StatisticTypeEnum;

  constructor(
    private alaAppAnalysisService: AlaAppAnalysisService,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {
    this.submit(); // 先以預設條件呈現結果
  }

  /**
   * 變更統計類別
   * @param type {StatisticTypeEnum}
   * @author kidin-1100804
   */
  changeStatisticType(type: StatisticTypeEnum) {
    if (this.uiFlag.statisticType !== type) {
      this.uiFlag.statisticType = type;
      this.checkCondition();
      this.allConditionRecovery();
      this.imgConditionRecovery();
      this.initSearchRes();
    }
  }

  /**
   * 變更統計方法
   * @param method {StatisticMethod}
   * @author kidin-1100804
   */
  changeStatisticMethod(method: StatisticMethod) {
    if (this.uiFlag.statisticMethod !== method) {
      this.uiFlag.statisticMethod = method;
      this.checkCondition();
      this.allConditionRecovery();
      this.imgConditionRecovery();
      this.initSearchRes();
    }
  }

  /**
   * 取得選擇的日期
   * @param e {any}
   * @author kidin-1100804
   */
  getSelectDate(e: any) {
    const { startDate, endDate } = e;
    this.searchTime = {
      startTime: startDate,
      endTime: endDate,
    };
  }

  /**
   * 顯示進階條件與否
   * @author kidin-1100804
   */
  showAdvancedCondition() {
    this.uiFlag.showAdvancedCondition = !this.uiFlag.showAdvancedCondition;
    this.checkCondition();
  }

  /**
   * 確認目前條件，以訂閱或解訂閱輸入框
   * @author kidin-1100805
   */
  checkCondition() {
    const { statisticType, statisticMethod } = this.uiFlag;
    if (this.uiFlag.showAdvancedCondition && statisticMethod === 'realtime') {
      if (statisticType !== StatisticTypeEnum.image) {
        this.subscribeInput(ObjType.user);
        this.subscribeInput(ObjType.group);
      } else {
        const { objectType } = this.imageReqBody;
        if (objectType === ObjType.user) {
          this.subscribeInput(ObjType.user);
          this.unSubscribeInput(ObjType.group);
        } else if (objectType === ObjType.group) {
          this.subscribeInput(ObjType.group);
          this.unSubscribeInput(ObjType.user);
        } else {
          this.unSubscribeInput(ObjType.user);
          this.unSubscribeInput(ObjType.group);
        }
      }
    } else {
      this.unSubscribeInput(ObjType.user);
      this.unSubscribeInput(ObjType.group);
    }
  }

  /**
   * 選擇app類別
   * @param app {AlaApp}-選擇的app
   * @author kidin-1100804
   */
  selectApp(app: AlaApp) {
    const { createFromApp } = this.filterCondition;
    const currentLength = createFromApp.length;
    if (app === AlaApp.all) {
      this.filterCondition.createFromApp = currentLength < this.allAppNumber ? allApp : [];
    } else {
      if (createFromApp.includes(app)) {
        this.filterCondition.createFromApp = createFromApp.filter((_app) => _app !== app);
      } else {
        this.filterCondition.createFromApp.push(app);
      }
    }
  }

  /**
   * 選擇圖床找查找對象類別
   * @param type {ObjType}-對象類別
   * @author kidin-1100805
   */
  selectObjType(type: ObjType) {
    this.imageReqBody.objectType = type;
    const { imgType } = this.imageReqBody;
    if (type === ObjType.user) {
      const userImageType = [
        AlbumType.all,
        AlbumType.personalIcon,
        AlbumType.personalScenery,
        AlbumType.personalSportFile,
      ];

      this.imageReqBody.imgType = userImageType.includes(imgType) ? imgType : AlbumType.all;
      this.subscribeInput(ObjType.user);
      this.unSubscribeInput(ObjType.group);
    } else if (type === ObjType.group) {
      const groupImageType = [AlbumType.all, AlbumType.groupIcon, AlbumType.groupScenery];

      this.imageReqBody.imgType = groupImageType.includes(imgType) ? imgType : AlbumType.all;
      this.subscribeInput(ObjType.group);
      this.unSubscribeInput(ObjType.user);
    } else {
      this.unSubscribeInput(ObjType.user);
      this.unSubscribeInput(ObjType.group);
    }

    this.allConditionRecovery();
  }

  /**
   * 選擇圖床類別
   * @param type {AlbumType}-選擇的圖床類別
   * @author kidin-1100804
   */
  selectImageType(type: AlbumType) {
    this.imageReqBody.imgType = type;
  }

  /**
   * 確認查找是否包含子群組
   * @author kidin-1100805
   */
  clickSearchChild() {
    this.imageReqBody.subset = !this.imageReqBody.subset;
  }

  /**
   * 訂閱使用者輸入框事件
   * @param type {ObjType}-事件對象
   * @author kidin-1100805
   */
  subscribeInput(type: ObjType) {
    const key = type === ObjType.user ? 'user' : 'group';
    setTimeout(() => {
      const input = this[key].nativeElement,
        keyUpEvent = fromEvent(input, 'keyup');
      this[`${key}InputSubscription`] = keyUpEvent
        .pipe(debounceTime(500), takeUntil(this.ngUnsubscribe))
        .subscribe((event) => {
          const { value } = (event as any).target;
          if (value && value.length > 0) {
            if (type === ObjType.user) {
              this.getUserSearch(value);
            } else {
              this.getGroupSearch(value);
            }
          } else {
            this.uiFlag.showAutoCompleted = null;
          }
        });
    });
  }

  /**
   * 解除訂閱所有輸入框事件
   * @param type {ObjType}-事件對象
   * @author kidin-1100805
   */
  unSubscribeInput(type: ObjType) {
    const prefix = type === ObjType.user ? 'user' : 'group';
    this[`${prefix}InputSubscription`].unsubscribe();
  }

  /**
   * 根據關鍵字搜尋使用者
   * @param str {string}-暱稱關鍵字
   * @author kidin-1100805
   */
  getUserSearch(str: string) {
    let params = new HttpParams();
    params = params.set('type', '0');
    params = params.set('keyword', str);
    params = params.set('searchType', '1');
    params = params.set('groupId', '0-0-0-0-0-0');
    this.nodejsApiService.searchMember(params).subscribe((res) => {
      if (res.length > 0) {
        this.autoCompletedList = res;
        this.uiFlag.showAutoCompleted = 'user';
      } else {
        this.uiFlag.showAutoCompleted = null;
      }
    });
  }

  /**
   * 根據關鍵字搜尋群組
   * @param str {string}-群組關鍵字
   * @author kidin-1100805
   */
  getGroupSearch(str: string) {
    const body = {
      token: this.authService.token,
      searchName: str,
    };
    this.nodejsApiService.searchGroup(body).subscribe((res) => {
      this.autoCompletedList = res;
      this.uiFlag.showAutoCompleted = this.autoCompletedList.length > 0 ? 'group' : null;
    });
  }

  /**
   * 點擊自動完成表單的內容
   * @param e {MouseEvent}
   * @param idx {number}-在自動完成表單內的序列
   * @author kidin-1100806
   */
  clickAutoCompleted(e: MouseEvent, idx: number) {
    e.stopPropagation();
    const { showAutoCompleted } = this.uiFlag,
      assignObj = this.autoCompletedList[idx];
    let compareKey: string;
    switch (showAutoCompleted) {
      case 'user':
        compareKey = 'userId';
        break;
      case 'group':
        compareKey = 'groupId';
        break;
      case 'region':
      case 'language':
        compareKey = 'code';
        break;
    }

    const condition = this.filterCondition[showAutoCompleted];
    if (condition) {
      if (
        condition.findIndex((_condition) => _condition[compareKey] === assignObj[compareKey]) < 0
      ) {
        const { statisticType } = this.uiFlag;
        if (statisticType === StatisticTypeEnum.image) {
          this.filterCondition[showAutoCompleted] = [assignObj];
        } else {
          condition.push(assignObj);
        }
      }
    } else {
      this.filterCondition = {
        [showAutoCompleted]: [assignObj],
        ...this.filterCondition,
      };
    }

    const input = this[showAutoCompleted].nativeElement;
    (input as any).value = null;
    this.uiFlag.showAutoCompleted = null;
  }

  /**
   * 移除指定的條件
   * @param type {string}-條件類型
   * @param idx {number}-條件清單序列
   * @author kidin-1100806
   */
  delCondition(type: string, idx: number) {
    this.filterCondition[type].splice(idx, 1);
  }

  /**
   * 當按下enter鍵或模糊輸入框時則追加輸入的sn條件
   * @param e {KeyboardEvent | Event | MouseEvent}
   * @author kidin-1100806
   */
  handleSnInput(e: KeyboardEvent | Event | MouseEvent) {
    const {
      type,
      key,
      target: { value },
    } = e as any;
    switch (type) {
      case 'keyup':
        if (key === 'Enter' && value.length > 0) {
          this.addConditionValue('sn', value);
        }
        break;
      case 'focusout':
      case 'change':
        if (value.length > 0) {
          this.addConditionValue('sn', value);
        }
        break;
    }
  }

  /**
   * 追加輸入的條件
   * @param value {string}-輸入的內容
   * @author kidin-1100806
   */
  addConditionValue(type: InputType, value: string) {
    const upperCaseList = ['sn', 'region'];
    const finalVal = upperCaseList.includes(type) ? value.toUpperCase() : value.toLowerCase(),
      condition = this.filterCondition[type];
    if (condition && !condition.includes(finalVal)) {
      this.filterCondition[type].push(finalVal);
    } else {
      this.filterCondition = {
        [type]: [finalVal],
        ...this.filterCondition,
      };
    }

    const input = this[type].nativeElement;
    (input as any).value = null;
  }

  /**
   * 顯示預設常用列表，並訂閱全域點擊事件
   * @param e {MouseEvent}
   * @param type {'region' | 'language'}
   * @author kidin-1100806
   */
  openCommonList(e: MouseEvent, type: 'region' | 'language') {
    e.stopPropagation();
    this.unsubscribeClick(); // 避免重複點擊
    this.autoCompletedList = type === 'region' ? commonRegion : commonLanguage;
    this.uiFlag.showAutoCompleted = type;
    const clickEvent = fromEvent(window, 'click');
    this.clickEventSubscription = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.uiFlag.showAutoCompleted = null;
      this.unsubscribeClick();
    });
  }

  /**
   * 取消訂閱全域點擊事件
   * @author kidin-1100810
   */
  unsubscribeClick() {
    if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
  }

  /**
   * 當按下enter鍵或模糊輸入框時則追加輸入的地區條件
   * @param e {KeyboardEvent | Event | MouseEvent}
   * @author kidin-1100806
   */
  handleRegionInput(e: KeyboardEvent | Event | MouseEvent) {
    const {
      type,
      key,
      target: { value },
    } = e as any;
    switch (type) {
      case 'keyup':
        if (key === 'Enter' && value.length > 0) {
          this.addConditionValue('region', value);
          this.uiFlag.showAutoCompleted = null;
        }
        break;
      case 'focusout':
      case 'change':
        if (value.length > 0) {
          this.addConditionValue('region', value);
        }

        break;
    }
  }

  /**
   * 當按下enter鍵或模糊輸入框時則追加輸入的語言條件
   * @param e {KeyboardEvent | Event | MouseEvent}
   * @author kidin-1100806
   */
  handleLanguageInput(e: KeyboardEvent | Event | MouseEvent) {
    const {
      type,
      key,
      target: { value },
    } = e as any;
    switch (type) {
      case 'keyup':
        if (key === 'Enter' && value.length > 0) {
          this.addConditionValue('language', value);
          this.uiFlag.showAutoCompleted = null;
        }
        break;
      case 'focusout':
      case 'change':
        if (value.length > 0) {
          this.addConditionValue('language', value);
        }

        break;
    }
  }

  /**
   * 將進階篩選條件恢復至預設
   * @author kidin-1100806
   */
  allConditionRecovery() {
    this.filterCondition = {
      createFromApp: allApp,
    };
  }

  /**
   * api 4003 request body initail
   * @author kidin-1100809
   */
  imgConditionRecovery() {
    this.imageReqBody = {
      token: this.authService.token,
      objectType: ObjType.all,
      subset: false,
      imgType: AlbumType.all,
    };
  }

  /**
   * 將所有條件整理過後送出查詢
   * @author kidin-1100809
   */
  submit() {
    this.uiFlag.progress = 0;
    const { statisticMethod, statisticType } = this.uiFlag;
    let body: any;
    if (statisticMethod === 'pre') {
      body = {
        token: this.authService.token,
        searchFileType: statisticType,
        searchTime: this.searchTime,
        filterCondition: this.filterCondition,
      };

      this.getTrackingCalculateData(body);
    } else {
      if (statisticType === StatisticTypeEnum.image) {
        body = this.imageReqBody;
        const { objectType } = this.imageReqBody;
        if (objectType === ObjType.user) {
          body = {
            userId: this.filterCondition.user[0].userId,
            ...body,
          };
        } else if (objectType === ObjType.group) {
          body = {
            groupId: this.filterCondition.group[0].groupId,
            ...body,
          };
        }

        this.getGalleryStatisticsData(body);
      } else {
        this.uiFlag.progress = 30;
        body = this.arrangeCondition(statisticType, this.searchTime, this.filterCondition);
        this.getTrackingStatisticsData(body);
      }
    }
  }

  /**
   * 初始化搜尋結果
   * @author kidin-1100809
   */
  initSearchRes() {
    this.searchRes = {
      trendChart: {
        gptfit: [],
        connect: [],
        cloudrun: [],
        trainlive: [],
        fitness: [],
        tft: [],
      },
      fileCount: 0,
      totalSpace: 0,
      createTime: 'YYYY-MM-DD  HH:mm',
    };
  }

  /**
   * 將條件進行整理
   * @param searchFileType {any}-搜尋類型
   * @param condition {any}-進階條件
   * @author kidin-1100809
   */
  arrangeCondition(
    searchFileType: StatisticTypeEnum,
    searchTime: { startTime: string; endTime: string },
    condition: any
  ) {
    const body = {
      token: this.authService.token,
      searchFileType,
      searchTime,
      filterCondition: {},
    };

    for (const _condition in condition) {
      if (Object.prototype.hasOwnProperty.call(condition, _condition)) {
        const content = condition[_condition];
        if (content.length > 0) {
          switch (_condition) {
            case 'createFromApp':
              body.filterCondition = {
                createFromApp: content,
                ...body.filterCondition,
              };
              break;
            case 'region': {
              const countryRegion = content.map((_content) => {
                if (_content.code) {
                  return `*${_content.code}*`;
                } else {
                  return `*${_content}*`;
                }
              });

              body.filterCondition = {
                countryRegion,
                ...body.filterCondition,
              };
              break;
            }
            case 'language': {
              const language = content.map((_content) => {
                if (_content.code) {
                  return `*${_content.code}*`;
                } else {
                  return `*${_content}*`;
                }
              });

              body.filterCondition = {
                language,
                ...body.filterCondition,
              };
              break;
            }
            case 'sn': {
              const equipmentSN = content.map((_content) => `*${_content}*`);
              body.filterCondition = {
                equipmentSN,
                ...body.filterCondition,
              };
              break;
            }
            case 'user': {
              const author = content.map((_content) => `*?userId=${_content.userId}*`);
              body.filterCondition = {
                author,
                ...body.filterCondition,
              };
              break;
            }
            case 'group': {
              const brand = [],
                branch = [],
                coach = [];
              content.forEach((_content) => {
                const { groupId } = _content,
                  blurId = `*groupId=${groupId}*`,
                  idArr = _content.groupId.split('-'),
                  isClass = idArr[4] != 0,
                  isBranch = !isClass && idArr[3] != 0;
                if (isClass) {
                  coach.push(blurId);
                } else if (isBranch) {
                  branch.push(blurId);
                } else {
                  brand.push(blurId);
                }
              });

              if (coach.length > 0) {
                body.filterCondition = {
                  class: coach,
                  ...body.filterCondition,
                };
              }

              if (branch.length > 0) {
                body.filterCondition = {
                  branch,
                  ...body.filterCondition,
                };
              }

              if (brand.length > 0) {
                body.filterCondition = {
                  brand,
                  ...body.filterCondition,
                };
              }

              break;
            }
          }
        }
      }
    }

    return body;
  }

  /**
   * 透過api 4002取得預先統計分析
   * @param body {any}-4002 request body
   * @author kidin-1100809
   */
  getTrackingCalculateData(body: any) {
    this.uiFlag.progress = 50;
    this.alaAppAnalysisService.getPreAnalysis(body).subscribe((res) => {
      this.initSearchRes();
      const { processResult, dataStatistics } = res;
      if (!processResult) {
        const { apiCode, resultCode, resultMessage } = res;
        this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
        this.uiFlag.progress = 100;
      } else {
        const { apiCode, resultCode, resultMessage } = processResult;
        if (resultCode !== 200) {
          this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
          this.uiFlag.progress = 100;
        } else {
          dataStatistics.forEach((_data) => {
            const { analysis, startTime } = _data;
            analysis.forEach((_analysis) => {
              const { appId, byte, fileCount } = _analysis;
              this.searchRes.fileCount += fileCount;
              this.searchRes.totalSpace += byte;
              const startTimestamp = dayjs(startTime).valueOf(),
                oneRangeData = [startTimestamp, byte];
              switch (appId) {
                case AlaApp.gptfit:
                  this.searchRes.trendChart.gptfit.push(oneRangeData);
                  break;
                case AlaApp.connect:
                  this.searchRes.trendChart.connect.push(oneRangeData);
                  break;
                case AlaApp.cloudrun:
                  this.searchRes.trendChart.cloudrun.push(oneRangeData);
                  break;
                case AlaApp.trainlive:
                  this.searchRes.trendChart.trainlive.push(oneRangeData);
                  break;
                case AlaApp.fitness:
                  this.searchRes.trendChart.fitness.push(oneRangeData);
                  break;
                case AlaApp.tft:
                  this.searchRes.trendChart.tft.push(oneRangeData);
                  break;
              }
            });
          });

          this.searchRes.createTime = dayjs().format('YYYY-MM-DD HH:mm');
          this.uiFlag.progress = 100;
        }
      }
    });
  }

  /**
   * 透過api 4003取得預先統計分析
   * @param body {any}-4003 request body
   * @author kidin-1100809
   */
  getGalleryStatisticsData(body: any) {
    this.uiFlag.progress = 50;
    this.alaAppAnalysisService.getImgAnalysis(body).subscribe((res) => {
      this.initSearchRes();
      const { processResult, dataStatistics } = res;
      if (!processResult) {
        const { apiCode, resultCode, resultMessage } = res;
        this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
        this.uiFlag.progress = 100;
      } else {
        const { apiCode, resultCode, resultMessage } = processResult;
        if (resultCode !== 200) {
          this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
          this.uiFlag.progress = 100;
        } else {
          dataStatistics.forEach((_data) => {
            const { analysis } = _data;
            analysis.forEach((_analysis) => {
              const { byte, fileCount } = _analysis;
              this.searchRes.fileCount += fileCount;
              this.searchRes.totalSpace += byte;
            });
          });

          this.searchRes.createTime = dayjs().format('YYYY-MM-DD HH:mm');
          this.uiFlag.progress = 100;
        }
      }
    });
  }

  /**
   * 透過api 4001取得預先統計分析
   * @param body {any}-4001 request body
   * @author kidin-1100809
   */
  getTrackingStatisticsData(body: any) {
    this.uiFlag.progress = 50;
    this.alaAppAnalysisService.getFileAnalysis(body).subscribe((res) => {
      this.initSearchRes();
      const { processResult, dataStatistics } = res;
      if (!processResult) {
        const { apiCode, resultCode, resultMessage } = res;
        this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
        this.uiFlag.progress = 100;
      } else {
        const { apiCode, resultCode, resultMessage } = processResult;
        if (resultCode !== 200) {
          this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
          this.uiFlag.progress = 100;
        } else {
          dataStatistics.forEach((_data) => {
            const { analysis } = _data;
            analysis.forEach((_analysis) => {
              const { pointCount, fileCount } = _analysis;
              this.searchRes.fileCount += fileCount;
              this.searchRes.totalSpace += pointCount * 32; // 點陣數量 * 32byte
            });
          });

          this.searchRes.createTime = dayjs().format('YYYY-MM-DD HH:mm');
          this.uiFlag.progress = 100;
        }
      }
    });
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
