import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Subject, fromEvent, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileService } from '../../services/user-profile.service';
import { UserProfileInfo } from '../../../containers/dashboard/models/userProfileInfo';
import { UtilsService } from '../../services/utils.service';
import { ActivityService } from '../../services/activity.service';
import { Router } from '@angular/router';
import { QrcodeService } from '../../../containers/portal/services/qrcode.service';
import { GroupService } from '../../../containers/dashboard/services/group.service';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { MuscleNamePipe } from '../../pipes/muscle-name.pipe';
import { mi, lb } from '../../models/bs-constant';
import * as _Highcharts from 'highcharts';
import { HrZoneRange } from '../../models/chart-data';
import { SportType } from '../../models/report-condition';

const errMsg = `Error! Please try again later.`,
      Highcharts: any = _Highcharts; // 不檢查highchart型態

type DisplayTag = 'summary' | 'detail' | 'segmentation' | 'chart';
type SegmentType = 'pointSecond' | 'distanceMeters';
type SegmentSecond = 60 | 300 | 600 | 1800;
type SegmentMeter = 100 | 500 | 1000 | 10000;

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss']
})
export class ActivityDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tagBar') tagBar: ElementRef;
  @ViewChild('summary') summary: ElementRef;
  @ViewChild('detail') detail: ElementRef;
  @ViewChild('segmentation') segmentation: ElementRef;
  @ViewChild('chart') chart: ElementRef;

  private ngUnsubscribe = new Subject();

  /**
   * ui 會用到的各種flag
   */
  uiFlag = {
    isPreviewMode: false,
    isPortal: false,
    isDebug: false,
    isLoading: false,
    isNormalCoordinate: false,
    showWeightTrainingOpt: false,
    showChartOpt: false,
    pcView: true,
    currentTag: <DisplayTag>'detail',
    tagChanged: false,
    resolution: 1,
    noFtpData: false,
    showSegmentRangeList: false
  };

  /**
   * active tag 底線的寬度和位置
   */
  activeLine = {
    left: 0,
    width: 60
  }

  /**
   * 使用者資訊
   */
  userProfile: UserProfileInfo;

  /**
   * 檔案持有人資訊
   */
  ownerProfile = {
    icon: null,
    name: null
  };

  /**
   * 運動檔案資訊
   */
  fileInfo = <any> {
    fileId: null
  };

  /**
   * 運動概要
   */
  activityInfoLayer: any;

  /**
   * 運動分段
   */
  activityLapLayer: any;

  /**
   * 運動分點
   */
  activityPointLayer: any;

  /**
   * 距離趨勢圖所需數據
   */
  trendChartData: any;

  /**
   * 圖表所需資訊（處理後）
   */
  chartData = {
    hr: [0, 0, 0, 0, 0, 0],
    hrInfo: <HrZoneRange>{
      hrBase: 0,
      z0: <number | string>0,
      z1: <number | string>0,
      z2: <number | string>0,
      z3: <number | string>0,
      z4: <number | string>0,
      z5: <number | string>0
    },
    ftp: [0, 0, 0, 0, 0, 0, 0]
  };

  /**
   * 分段數據
   */
  segmentData = {
    xAxis: <Array<number>>[0],
    yAxis: {
      hr: <Array<number>>[0],
      speed: <Array<number>>[0],
      altitude: <Array<number>>[0],
      cadence: <Array<number>>[0],
      power: <Array<number>>[0],
      temperature: <Array<number>>[0],
      gforceX: <Array<number>>[0],
      gforceY: <Array<number>>[0],
      gforceZ: <Array<number>>[0]
    }
  }

  /**
   * footer其他資訊
   */
  otherInfo = {
    classInfo: null,
    teacherInfo: null,
    deviceInfo: null,
    tagInfo: null
  };

  /**
   * 公英制轉換係數
   */
  unit = {
    mi: mi,
    lb: lb
  }

  /**
   * 趨勢圖表設定
   */
  trendChartOpt = {
    segmentMode: false,
    xAxisType: <SegmentType>'pointSecond',
    segmentRange: <SegmentSecond | SegmentMeter>60,
    haveDistanceChoice: true
  }

  fileTime: string;
  sceneryImg: string;
  pageResize: Subscription;
  clickEvent: Subscription;
  muscleTranslate = {};

  constructor(
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private router: Router,
    private qrcodeService: QrcodeService,
    private groupService: GroupService,
    private translate: TranslateService,
    private muscleName: MuscleNamePipe
  ) { }

  ngOnInit(): void {
    this.getFileId(location.pathname);
    this.checkQueryString(location.search);
    this.handlePageResize();
    this.getActivityDetail();
  }

  ngAfterViewInit() {
    this.switchTag(this.uiFlag.currentTag);
  }

  /**
   * 判斷是否為登入後運動詳細頁面，並從url取得運動檔案id
   * @param path {string}-url pathname
   * @author kidin-1100104
   */
  getFileId(path: string) {
    if (path.indexOf('dashboard') > -1) {
      this.uiFlag.isPortal = false;
      this.getRxUserProfile();
    } else {
      this.uiFlag.isPortal = true;
    }

    const pathArr = path.split('/');
    this.fileInfo.fileId = pathArr[pathArr.length - 1];
  }

  /**
   * 確認是否為 debug mode 或 preview mode
   * @param searchStr {string}-url query string
   * @author kidin-1100104
   */
  checkQueryString(searchStr: string) {
    if (searchStr.indexOf('debug') > -1) {
      this.uiFlag.isDebug = true;
    }

    if (searchStr.indexOf('ims') > -1) {
      this.uiFlag.isPreviewMode = true;
    }

  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-20200710
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      if (window.innerWidth < 768) {
        this.uiFlag.currentTag = this.uiFlag.tagChanged ? this.uiFlag.currentTag : 'summary';
        this.uiFlag.pcView = false;
      } else {
        this.uiFlag.currentTag = this.uiFlag.tagChanged ? this.uiFlag.currentTag : 'detail';
        this.uiFlag.pcView = true;
      }

      this.switchTag(this.uiFlag.currentTag);
    });

  }

  /**
   * 取得個人資訊
   * @author kidin-1100104
   */
  getRxUserProfile() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userProfile = res;
    });

  }

  /**
   * 取得運動詳細資料
   * @author kidin-1100104
   */
  getActivityDetail() {
    let body: any;
    if (this.uiFlag.isPortal) {
      body = {
        token: '',
        fileId: this.fileInfo.fileId,
        // displayDetailField: 3  // 新api回傳格式
      };

    } else {
      body = {
        token: this.utils.getToken(),
        fileId: this.fileInfo.fileId,
        // displayDetailField: 3, // 新api回傳格式
        debug: `${this.uiFlag.isDebug}`
      };

    }

    this.activityService.fetchSportListDetail(body).subscribe(res => {
      switch (res.resultCode) {
        case 400:  // 找不到該筆運動檔案或其他
          console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
          this.router.navigateByUrl('/404');
          break;
        case 403: // 無權限觀看該運動檔案
          this.router.navigateByUrl('/403');
          break;
        case 200:
          this.handleActivityDetail(res);
          break;
        default:
          console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
          this.utils.openAlert(errMsg);
          break;
      }

    });

  }

  /**
   * 處理運動詳細資料
   * @param data {any}-api 2103回傳的內容
   * @author kidin-1100104
   */
  handleActivityDetail(data: any) {
    this.handleFileInfo(data.fileInfo);
    this.activityInfoLayer = data.activityInfoLayer;
    // 距離為0則趨勢圖表設定框分段解析不顯示距離選項
    this.trendChartOpt.haveDistanceChoice = this.activityInfoLayer.totalDistanceMeters ? true : false;
    this.handleSceneryImg(+this.activityInfoLayer.type, +this.activityInfoLayer.subtype);
    this.handleHrZoneData(this.activityInfoLayer);
    if (+this.activityInfoLayer.type === 2) {
      this.handleFtpZoneData(this.activityInfoLayer);
    }

    this.activityLapLayer = data.activityLapLayer;
    // this.getOtherInfo(this.fileInfo);
    this.handleActivityPoint(data.activityPointLayer);
    if(this.activityInfoLayer.type == 3) {
      this.createMuscleTranslate();
    }

  }

  /**
   * 確認運動檔案是否為使用者所持
   * @param fileInfo {any}-api 2103的fileInfo
   * @author kiidn-1100104
   */
  handleFileInfo(fileInfo: any) {
    this.fileInfo = fileInfo;
    this.handleFileCreateDate(this.fileInfo.creationDate);

    const targetUserId = +this.fileInfo.author.split('=')[1];
    let isOwner = false;
    if (!this.uiFlag.isPortal) {
      
      if (this.userProfile.userId === targetUserId) {
        isOwner = true;
      }

    }

    if (!isOwner) {
      const body = {
        token: this.utils.getToken() || '',
        targetUserId: [targetUserId]
      };

      this.userProfileService.getUserProfile(body).subscribe(res => {
        if (res.processResult && res.processResult.resultCode === 200) {
          const {userProfile} = res;
          this.ownerProfile = {
            icon: userProfile[0].avatarUrl,
            name: userProfile[0].nickname
          };
        } else if (res.processResult && res.processResult.resultCode !== 200) {
          console.log(`${res.processResult.resultCode}: Api ${res.processResult.apiCode} ${res.processResult.resultMessage}`);
        } else {
          console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        }
  
      });
    } else {
      this.ownerProfile = {
        icon: this.userProfile.avatarUrl,
        name: this.userProfile.nickname
      }

    }

  }

  /**
   * 生成特定格式檔案時間
   * @param date {string}-檔案產生時間
   * @author kidin-1100105
   */
  handleFileCreateDate(date: string) {
    const dayInWeek = moment(date).weekday();
    let weekDay: string;

    this.translate.get('hollow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      switch (dayInWeek) {
        case 0:
          weekDay = this.translate.instant('universal_time_sun');
          break;
        case 1:
          weekDay = this.translate.instant('universal_time_mon');
          break;
        case 2:
          weekDay = this.translate.instant('universal_time_tue');
          break;
        case 3:
          weekDay = this.translate.instant('universal_time_wed');
          break;
        case 4:
          weekDay = this.translate.instant('universal_time_thu');
          break;
        case 5:
          weekDay = this.translate.instant('universal_time_fri');
          break;
        case 6:
          weekDay = this.translate.instant('universal_time_sat');
          break;
      }

      this.fileTime = moment(date).format('YYYY-MM-DDTHH:mm').replace('T', ` ${weekDay} `);
    });
    

  }

  /**
   * 根據運動類別顯示佈景圖
   * @param type {number}-運動類別
   * @author kidin-1100105
   */
  handleSceneryImg(type: number, subtype: number) {
    let sportType: string;
    switch (type) {
      case 1:
        sportType = 'run';
        break;
      case 2:
        sportType = 'cycle';
        break;
      case 3:
        sportType = 'weightTraining';
        break;
      case 4:
        sportType = 'swim';
        break;
      case 5:
        sportType = 'aerobic';
        break;
      case 6:
        sportType = 'rowing';
        break;
      case 7:
        sportType = 'ball';
        break;
    }

    if (subtype) {
      this.sceneryImg = `/app/public_html/img/${sportType}_${subtype}.jpg`;
    } else {
      this.sceneryImg = `/app/public_html/img/${sportType}_0.jpg`;
    }
    
  }

  /**
   * 將心率區間合併為array供圖表使用,及取得心率說明圖表
   * @param info {any}-activityInfoLayer
   * @author kidin-1100125
   */
  handleHrZoneData(info: any) {
    this.chartData.hr = [
      info.totalHrZone0Second,
      info.totalHrZone1Second,
      info.totalHrZone2Second,
      info.totalHrZone3Second,
      info.totalHrZone4Second,
      info.totalHrZone5Second
    ];
    
    const userAge = moment().diff(this.userProfile.birthday, 'years'),
          userHRBase = this.userProfile.heartRateBase,
          userMaxHR = this.userProfile.heartRateMax,
          userRestHR = this.userProfile.heartRateResting;
    this.chartData.hrInfo = this.utils.getUserHrRange(userHRBase, userAge, userMaxHR, userRestHR);
  }

  /**
   * 將閾值區間合併為array供圖表使用
   * @param info {any}-activityInfoLayer
   * @author kidin-1100125
   */
  handleFtpZoneData(info: any) {
    this.chartData.ftp = [
      info.totalFtpZone0Second,
      info.totalFtpZone1Second,
      info.totalFtpZone2Second,
      info.totalFtpZone3Second,
      info.totalFtpZone4Second,
      info.totalFtpZone5Second,
      info.totalFtpZone6Second
    ];

  }

  /**
   * 透過fileInfo的資訊，call 其他 api 取得其他所需資訊
   * @param fileInfo {any}-api 2103的fileInfo
   * @author kidin-1100104
   */
  getOtherInfo(fileInfo: any) {
    if (fileInfo.class) {
      this.getClassInfo(fileInfo.class.split('=')[1]);
      this.getTeacherInfo(+fileInfo.teacher.split('=')[1]);
    }

    if (fileInfo.equipmentSN.length !== 0) {
      this.getProductInfo(fileInfo.equipmentSN);
    }

    console.log('otherInfo', this.otherInfo);
  }

  /**
   * 生成肌肉部位多國語系
   * @author kidin-1100108
   */
  createMuscleTranslate() {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const muscleCodeArr = [16, 32, 48, 49, 50, 51, 52, 53, 64, 65, 66, 67, 68, 69, 80, 81, 82, 96, 97, 98, 99, 100, 112, 113, 114, 115, 116, 117, 128];
      muscleCodeArr.forEach(_code => {
        const muscleName = this.translate.instant(this.muscleName.transform(_code, null));
        Object.assign(this.muscleTranslate, {[`${_code}`]: muscleName});
      });

    });

  }

  /**
   * 取得課程資訊
   * @param groupId {string}
   * @author kidin-1100104
   */
  getClassInfo(groupId: string) {
    const body = {
      token: this.utils.getToken() || '',
      groupId,
      avatarType: 3,
      findRoot: 1
    };

    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        const {info} = res;
        this.otherInfo.classInfo = {
          icon: info.groupIcon,
          name: info.groupName,
          parents: `${info.groupRootInfo[2].brandName}/${info.groupRootInfo[3].branchName}`,
          desc: info.groupDesc
        };

      }
      
    });

  }

  /**
   * 取得教練資訊
   * @param userId {number}
   * @author kidin-1100104
   */
  getTeacherInfo(userId: number) {
    const body = {
      token: this.utils.getToken() || '',
      targetUserId: [userId]
    };

    this.userProfileService.getUserProfile(body).subscribe(res => {
      if (res.processResult && res.processResult.resultCode === 200) {
        const {userProfile} = res;
        this.otherInfo.teacherInfo = {
          icon: userProfile.avatarUrl,
          name: userProfile.nickname,
          desc: userProfile.description
        };
      } else if (res.processResult && res.processResult.resultCode !== 200) {
        console.log(`${res.processResult.resultCode}: Api ${res.processResult.apiCode} ${res.processResult.resultMessage}`);
      } else {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      }

    });

  }

  /**
   * 取得裝置資訊
   * @param equipmentList {Array<string>}-裝置sn序號列表
   * @author kidin-1100104
   */
  getProductInfo(equipmentList: Array<string>) {
    const body = {
      token: this.utils.getToken() || '',
      queryType: 1,
      queryArray: equipmentList
    };

    this.qrcodeService.getProductInfo(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        const {productInfo} = res.info;
        // 暫時只顯示單一裝置，待有顯示多裝置需求再修改
        this.otherInfo.deviceInfo = {
          icon: productInfo[0].modelImg,
          name: productInfo[0].modelName,
          type: productInfo[0].modelTypeName
        };

      }

    });

  }

  /**
   * 切換tag
   * @param tag {DisplayTag}-欲顯示的類別
   * @author kidin-1100107
   */
  switchTag(tag: DisplayTag) {
    this.uiFlag.tagChanged = true;
    this.uiFlag.currentTag = tag;
    setTimeout(() => {
      // 待api回覆並渲染畫面才能取得nativeElement
      if (!this[tag]) {
        this.switchTag(this.uiFlag.currentTag);
      } else {
        const tagBarElement = this.tagBar.nativeElement,
              currentTagElement = this[tag].nativeElement,
              tagBarLeft = tagBarElement.getBoundingClientRect().left,
              currentTagLeft = currentTagElement.getBoundingClientRect().left;

        this.activeLine = {
          left: currentTagLeft - tagBarLeft,
          width: currentTagElement.clientWidth
        }

      }

    }, 50);
    
  }

  /**
   * 將activityPointLayer加工以顯示地圖和圖表
   * @param point {any}-api 2103的activityPointLayer
   * @author kidin-1100104
   */
  handleActivityPoint(point: any) {
    // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    Highcharts.charts.length = 0;

    this.activityPointLayer = {};
    // this.uiFlag.resolution = this.handleResolution(point.length); (預埋)

    // 頁面所需資訊
    const needKey = [
      'pointSecond',
      'altitudeMeters',
      'heartRateBpm',
      'speed',
      'runCadence',
      'cycleCadence',
      'cycleWatt',
      'swimCadence',
      'temp',
      'rowingWatt',
      'rowingCadence',
      'gsensorXRawData',
      'gsensorYRawData',
      'gsensorZRawData',
      'moveRepetitions',
      'distanceMeters'
    ];

    let haveEffectiveCoordinates = false,
        effectiveDegree = {  // 補斷點用
          latitudeDegrees: null,
          longitudeDegrees: null
        },
        convertDegree = {  // 儲存整理過後的gps座標
          latitudeDegrees: [],
          longitudeDegrees: []
        };
        
    point.forEach((_point, _index) => {
      // point解析度調整(預埋)
      if (_index % this.uiFlag.resolution === 0) {

        // 處理gps座標
        if (_point['latitudeDegrees']) {

          // 當座標為null或(100, 100)時，視為未移動或無效點
          if (
            (_point['latitudeDegrees'] === null || _point['longitudeDegrees'] === null)
            || (_point['latitudeDegrees'] == 100 && _point['longitudeDegrees'] == 100)
          ) {
            
            if (effectiveDegree.latitudeDegrees) {
              convertDegree.latitudeDegrees.push(effectiveDegree.latitudeDegrees);
              convertDegree.longitudeDegrees.push(effectiveDegree.longitudeDegrees);
            } else {
              convertDegree.latitudeDegrees.push(null);
              convertDegree.longitudeDegrees.push(null);
            }

          } else {
            haveEffectiveCoordinates = true;
            effectiveDegree = {
              latitudeDegrees: +_point['latitudeDegrees'],
              longitudeDegrees: +_point['longitudeDegrees']
            };

            convertDegree.latitudeDegrees.push(effectiveDegree.latitudeDegrees);
            convertDegree.longitudeDegrees.push(effectiveDegree.longitudeDegrees);
          }

        }

        // 將各個所需資料分別合併為array，以供圖表使用
        needKey.forEach(_key => {
          if (_point.hasOwnProperty(_key)) {
            this.activityPointLayer.hasOwnProperty(_key) ?
              this.activityPointLayer[_key].push(+_point[_key]) : Object.assign(this.activityPointLayer, {[_key]: [+_point[_key]]});
          }

        });

      }

    });

    // 若所有座標皆為無效點，則不顯示地圖
    if (!haveEffectiveCoordinates) {
      this.uiFlag.isNormalCoordinate = false;
    } else {
      Object.assign(this.activityPointLayer, {'latitudeDegrees': convertDegree.latitudeDegrees});
      Object.assign(this.activityPointLayer, {'longitudeDegrees': convertDegree.longitudeDegrees});
      this.uiFlag.isNormalCoordinate = true;
    }

    console.log('point', this.activityPointLayer, this.uiFlag.isNormalCoordinate);
  }

  /**
   * 若point長度大於瀏覽器寬度2倍以上，則調整point解析度。
   * @param len {number}-point 長度
   * @author kidin-1100112
   */
  handleResolution(len: number): number {
    if (len >= window.innerWidth * 2) {
      return Math.floor(len / window.innerWidth);
    } else {
      return 1;
    }

  }


  /**
   * 顯示趨勢圖表設定選項
   * @param e {MouseEvent}
   * @author kidin-1100114
   */
  handleShowOptMenu(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showChartOpt = !this.uiFlag.showChartOpt;
    this.uiFlag.showChartOpt ? this.subscribeClick() : this.ngUnsubscribeClick();
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
      this.uiFlag.showChartOpt = false;
      this.uiFlag.showSegmentRangeList = false;
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
   * 切換是否分段
   * @author kidin-1100203
   */
  changeSegmentMode() {
    this.trendChartOpt.segmentMode = !this.trendChartOpt.segmentMode;
    if (this.trendChartOpt.segmentMode) {
      this.countSegmentData();
    }

  }

  /**
   * 切換x軸依據類型
   * @param type {SegmentType}-分段類型
   * @author kidin-1100203
   */
  changeXAxisType(type: SegmentType) {
    this.trendChartOpt.segmentRange = type === 'pointSecond' ? 60 : 100;
    this.trendChartOpt.xAxisType = type;

    const countList = this.getCountList(+this.activityInfoLayer.type as SportType);
    if (type === 'distanceMeters' && !this.trendChartData) {
      const apiKeyList = countList.map(_list => _list[1]);
      this.trendChartData = this.utils.handleRepeatXAxis(
        this.activityPointLayer['distanceMeters'],
        this.activityPointLayer,
        apiKeyList
      );
    }

    if (this.trendChartOpt.segmentMode) {
      this.countSegmentData();

    }

  }

  /**
   * 展開或收合分段範圍選擇清單
   * @param e {KeyboardEvent}
   * @author kidin-1100203
   */
  handleShowDropList() {
    this.uiFlag.showSegmentRangeList = !this.uiFlag.showSegmentRangeList;
  }

  /**
   * 切換分段範圍
   * @param range {SegmentSecond | SegmentMeter}-分段範圍
   * @author kidin-1100203
   */
  changeSegmentRange(range: SegmentSecond | SegmentMeter) {
    this.trendChartOpt.segmentRange = range;
    this.uiFlag.showSegmentRangeList = false;
    this.countSegmentData();
  }

  /**
   * 根據運動類別取得趨勢圖表所需顯示的項目
   * @param sportType {SportType}-運動類別
   * @author kidin-1100205
   */
  getCountList(sportType: SportType): Array<Array<string>> {
    let arr: Array<Array<string>>;
    switch (sportType) {
      case 1:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['cadence', 'runCadence'],
          ['speed', 'speed']
        ];
        break;
      case 2:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['cadence', 'cycleCadence'],
          ['power', 'cycleWatt'],
          ['speed', 'speed']
        ];
        break;
      case 3:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['cadence', 'moveRepetitions']
        ];
        break;
      case 4:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['cadence', 'swimCadence'],
          ['speed', 'speed']
        ];
        break;
      case 5:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp']
        ];
        break;
      case 6:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['cadence', 'rowingCadence'],
          ['speed', 'speed'],
          ['power', 'rowingWatt']
        ];
        break;
      case 7:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['speed', 'speed'],
          ['gforceX', 'gsensorXRawData'],
          ['gforceY', 'gsensorYRawData'],
          ['gforceZ', 'gsensorZRawData']
        ];
        break;
      default:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp']
        ];
        break;
    }

    return arr;
  }

  /**
   * 計算分段數據
   * 計算方式為依每個x軸數據差及分段範圍進行加權計算
   * ex. distance(x軸數據) = [0, 35, 195, 199]; hr(y軸數據) = [91, 133, 150, 143]; 分段為100 m
   * 則分段過後y軸數據計算為 分段一： (133 * (35 - 100 * 0) / 100) + (150 * (100 * 1 - 35) / 100)
   *                       分段二： (150 * (195 - 100 * 1) / (199 - 100 * 1)) + 143 * ((199 - 195) / (199 - 100 * 1))
   * 故分段數據為 distance = [0, 100, 200]; hr = [0, 144, 149.7];
   * @author kidin-1100203
   */
  countSegmentData() {
    this.initSegmentData();
    const countList = this.getCountList(+this.activityInfoLayer.type as SportType),
          range = this.trendChartOpt.segmentRange,
          refXAxisData = this.trendChartOpt.xAxisType === 'pointSecond' ? this.activityPointLayer['pointSecond'] : this.trendChartData.xAxis,
          refYAxisData = this.trendChartOpt.xAxisType === 'pointSecond' ? this.activityPointLayer : this.trendChartData.yAxis;
console.log('trendChartData', this.trendChartData);
    let divideIndex = 1,
        segmentTotal = {};
    for (let i = 0, dataLength = refXAxisData.length; i < dataLength; i++) {

      // 將分段範圍內的數據進行均化
      if (refXAxisData[i] < range * divideIndex) {
        // 將分段範圍內的所需所有類型數據根據比例進行加總
        countList.forEach((_list, _index) => {
          const key = _list[0],
                apiKey = _list[1];

          // 確認是否為最後一段數據
          let scale: number;
          if (refXAxisData[dataLength - 1] < range * divideIndex) {
            scale = (refXAxisData[i] - (refXAxisData[i - 1] || 0)) / (refXAxisData[dataLength - 1] - (range * (divideIndex - 1)));
          } else {
            scale = (refXAxisData[i] - (refXAxisData[i - 1] || 0)) / range;  // 數據在該分段佔比
          }

          // 將該分段數據進行加總
          if (segmentTotal.hasOwnProperty(key)) {
            segmentTotal[key] += refYAxisData[apiKey][i] * scale;
          } else {
            Object.assign(
              segmentTotal, 
              {[key]: refYAxisData[apiKey][i] * scale}
            );

          }

          // 確認是否為最後一個數據
          if (i === dataLength - 1) {
            this.segmentData.yAxis[key].push(+segmentTotal[key].toFixed(1));

            if (_index === 0) {
              this.segmentData.xAxis.push(range * divideIndex);
            }
          }

        });

      } else {
        const scale = (range * divideIndex - (refXAxisData[i - 1] || 0)) / range;  // 數據在該分段佔比
        // 當x軸數據大於目前分段範圍兩倍以上時
        if ((refXAxisData[i] / range) >= divideIndex + 1) {
          const nextBoundaryIdx = Math.ceil(refXAxisData[i] / range);

          countList.forEach((_list, _index) => {
            const key = _list[0],
                  apiKey = _list[1],
                  fillLen = nextBoundaryIdx - (divideIndex + 1) - 1,  // 填充的array長度
                  fillArr = new Array(fillLen),
                  xAxisFillArr = fillArr.map((_arr, index) => range * ((divideIndex + 1) + index)),
                  yAxisFillArr = fillArr.fill(refYAxisData[apiKey][i], 0, fillLen);

            // y軸填入上一段數據後，開始填充下一段數據
            segmentTotal[key] += refYAxisData[apiKey][i] * scale;
            this.segmentData.yAxis[key].push(+segmentTotal[key].toFixed(1));
            this.segmentData.yAxis[key].concat(yAxisFillArr);

            // x軸填入上一段數據後，開始填充下一段數據
            if (_index === 0) {
              this.segmentData.xAxis.push(range * divideIndex);
              this.segmentData.xAxis.concat(xAxisFillArr);
            }

            // 若數據不在分段邊界上
            if (range * divideIndex !== refXAxisData[i]) {
              // 下一個分段的數值加上該比例數值
              if (i !== dataLength - 1) {
                const nextScale = (refXAxisData[i] - (nextBoundaryIdx - 1)) / range;
                segmentTotal[key] = refYAxisData[apiKey][i] * nextScale;
              } else {
                this.segmentData.yAxis[key].push(refYAxisData[apiKey][i]);
                if (_index === 0) {
                  this.segmentData.xAxis.push(range * nextBoundaryIdx);
                }
              }
            } else {
              segmentTotal[key] = 0;
            }

          });

          divideIndex = nextBoundaryIdx;
        } else {
          // 判斷數據是否在分段邊界上或為最後一個數據
          if (range * divideIndex !== refXAxisData[i] && i !== dataLength - 1) {
            countList.forEach((_list, _index) => {
              const key = _list[0],
                    apiKey = _list[1];

              segmentTotal[key] += refYAxisData[apiKey][i] * scale;
              this.segmentData.yAxis[key].push(+segmentTotal[key].toFixed(1));
              if (_index === 0) {
                this.segmentData.xAxis.push(range * divideIndex);
              }

              // 下一個分段的數值加上該比例數值
              const nextScale = (refXAxisData[i] - range * divideIndex) / range;
              segmentTotal[key] = refYAxisData[apiKey][i] * nextScale;
            });
 
          } else {
            countList.forEach(_list => {
              const key = _list[0],
                    apiKey = _list[1];

              segmentTotal[key] += refYAxisData[apiKey][i] * scale;
              this.segmentData.yAxis[key].push(+(segmentTotal[key].toFixed(1))); 
              segmentTotal[key] = 0;
            });
            
            this.segmentData.xAxis.push(range * divideIndex);
          }

          divideIndex++;
        }

      }

    }
console.log('segment', this.segmentData);
  }

  /**
   * 初始化分段數據
   * @author kidin-1100204
   */
  initSegmentData() {
    this.segmentData = {
      xAxis: <Array<number>>[0],
      yAxis: {
        hr: <Array<number>>[0],
        speed: <Array<number>>[0],
        altitude: <Array<number>>[0],
        cadence: <Array<number>>[0],
        power: <Array<number>>[0],
        temperature: <Array<number>>[0],
        gforceX: <Array<number>>[0],
        gforceY: <Array<number>>[0],
        gforceZ: <Array<number>>[0]
      }
    }

  }

  /**
   * 建立分段x軸數據
   * @param maxXaxis {number}-該筆運動檔案最大距離或秒數
   * @param range {number}-分段範圍
   * @author kidin-1100204
   */
  createSegmentXAxisData(maxXaxis: number, range: number): Array<number> {
    const length = Math.ceil(maxXaxis / range) + 1, // 含x = 0
          xAxisDataArr = new Array(length);

    return xAxisDataArr.map((_x, index) => _x * index);
  }

  /**
   * 取消rxjs訂閱，並將highchart卸除
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
