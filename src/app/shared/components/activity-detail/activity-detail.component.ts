import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { UserLevel } from '../../models/weight-train';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../message-box/message-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShareGroupInfoDialogComponent } from '../share-group-info-dialog/share-group-info-dialog.component';
import { PrivacyCode } from '../../models/user-privacy';
import { EditIndividualPrivacyComponent } from '../edit-individual-privacy/edit-individual-privacy.component';

const errMsg = `Error! Please try again later.`,
      Highcharts: any = _Highcharts; // 不檢查highchart型態

type DisplayTag = 'summary' | 'detail' | 'segmentation' | 'chart';
type SegmentType = 'pointSecond' | 'distanceMeters';
type SegmentSecond = 60 | 300 | 600 | 1800;
type SegmentMeter = 100 | 500 | 1000 | 10000;
type FooterDesc = 'classDesc' | 'teacherDesc';

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
  @ViewChild('classDesc') classDesc: ElementRef;
  @ViewChild('teacherDesc') teacherDesc: ElementRef;

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
    showSegmentRangeList: false,
    weightTrainLevel: <UserLevel>'novice',
    showLevelSelector: false,
    classDescOverflow: false,
    teacherDescOverflow: false,
    editNameMode: false,
    isFileOwner: false,
    imageLoaded: false
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
   * 原始數據（供下載用）
   */
  rawData: any;

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
    defaultHrInfo: <HrZoneRange>{
      hrBase: 0,
      z0: <number>0,
      z1: <number>0,
      z2: <number>0,
      z3: <number>0,
      z4: <number>0,
      z5: <number>0
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
    haveDistanceChoice: true,
    yAxisDataRef: null,
    xAxisDataRef: null
  }

  fileTime: string;
  sceneryImg: string;
  pageResize: Subscription;
  clickEvent: Subscription;
  muscleTranslate = {};
  newFileName = '';
  printDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
  previewUrl = '';
  progress = 0;
  compareChartQueryString = '';
  filePrivacy: Array<PrivacyCode> = [1];
  cloudrunMapId: number;

  constructor(
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private router: Router,
    private qrcodeService: QrcodeService,
    private groupService: GroupService,
    private translate: TranslateService,
    private muscleName: MuscleNamePipe,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getFileId(location.pathname);
    this.checkQueryString(location.search);
    this.checkScreenSize();
    this.handlePageResize();
    this.getActivityDetail();
  }

  ngAfterViewInit() {
    this.switchTag(this.uiFlag.currentTag);
    this.getOtherInfo(this.fileInfo);
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
      this.createUserProfile();
    }

    const pathArr = path.split('/');
    this.fileInfo.fileId = pathArr[pathArr.length - 1];
    this.progress = 10;
  }

  /**
   * 確認是否為 debug mode 或 preview mode
   * @param searchStr {string}-url query string
   * @author kidin-1100104
   */
  checkQueryString(searchStr: string) {
    const queryString = searchStr.split('?')[1];
    if (queryString && queryString.length > 0) {
      const queryArr = queryString.split('&');
      queryArr.forEach(_query => {
        const query = _query.split('='),
              key = query[0],
              value = query[1];
        switch (key) {
          case 'debug':
            this.uiFlag.isDebug = true;
            break;
          case 'ipm':
            this.uiFlag.isPreviewMode = true;
            break;
          case 'weightTrainLevel':
            this.uiFlag.weightTrainLevel = value as UserLevel;
            break;
          case 'xAxisType':
            this.trendChartOpt.xAxisType = value as SegmentType;
            break;
          case 'segmentMode':
            this.trendChartOpt.segmentMode = value === 'true';
            break;
          case 'segmentRange':
            this.trendChartOpt.segmentRange = +value as (SegmentSecond | SegmentMeter);
            break;
        }

      })

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
      this.checkScreenSize();
      this.switchTag(this.uiFlag.currentTag);
    });

  }

  /**
   * 確認瀏覽器畫面大小以給予合適畫面
   * @author kidin-1100222
   */
  checkScreenSize() {
    if (window.innerWidth < 768) {
      this.uiFlag.currentTag = this.uiFlag.tagChanged ? this.uiFlag.currentTag : 'summary';
      this.uiFlag.pcView = false;
    } else {
      this.uiFlag.currentTag = this.uiFlag.currentTag === 'segmentation' ? 'segmentation' : 'detail';
      this.uiFlag.pcView = true;
    }

  }

  /**
   * 根據登入與否取得userProfile或建立訪客userProfile
   * @author kidin-1100220
   */
  createUserProfile() {
    if (this.utils.getToken()) {
      this.getRxUserProfile();
    } else {
      this.userProfile = {
        systemAccessRight: [99],
        autoTargetStep: 5000,
        avatarUrl: null,
        basalMetabolic: null,
        birthday: null,
        bodyAge: 30,
        bodyHeight: 175,
        bodyWeight: 70,
        description: '',
        email: '',
        fatRate: null,
        gender: 0,
        groupAccessRightList: null,
        handedness: null,
        heartRateBase: 0,
        heartRateMax: 195,
        heartRateResting: 60,
        lastBodyTimestamp: null,
        moistureRate: null,
        muscleRate: null,
        nickname: 'Visitors',
        normalBedTime: null,
        normalWakeTime: null,
        proteinRate: null,
        skeletonRate: null,
        strideLengthCentimeter: null,
        unit: 0,
        userId: -1,
        visceralFat: null,
        weightTrainingStrengthLevel: 100,
        wheelSize: 600,
      }

    }

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
    this.progress = 30;
    if (this.uiFlag.isPortal) {
      body = {
        token: this.utils.getToken() || '',
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
          this.progress = 100;
          console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
          this.router.navigateByUrl('/404');
          break;
        case 403: // 無權限觀看該運動檔案
          this.progress = 100;
          this.router.navigateByUrl('/403');
          break;
        case 200:
          this.progress = 70;
          this.handleActivityDetail(res);
          break;
        default:
          this.progress = 100;
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
    this.rawData = data;
    this.handleFileInfo(data.fileInfo);
    this.activityInfoLayer = data.activityInfoLayer;
    this.handleSceneryImg(+this.activityInfoLayer.type, +this.activityInfoLayer.subtype);
    this.handleHrZoneData(this.activityInfoLayer);
    if (+this.activityInfoLayer.type === 2) this.handleFtpZoneData(this.activityInfoLayer);

    this.activityLapLayer = data.activityLapLayer;
    this.handleActivityPoint(data.activityPointLayer);
    if(this.activityInfoLayer.type == 3) {
      if (!this.uiFlag.isPreviewMode) this.getUserWeightTrainLevel();
      this.createMuscleTranslate();
    }

    this.progress = 100;
  }

  /**
   * 確認運動檔案是否為使用者所持
   * @param fileInfo {any}-api 2103的fileInfo
   * @author kiidn-1100104
   */
  handleFileInfo(fileInfo: any) {
    this.fileInfo = fileInfo;
    const { cloudRunMapId } = this.fileInfo;
    if (cloudRunMapId) {
      this.cloudrunMapId = cloudRunMapId.includes('=') ? +cloudRunMapId.split('?mapId=')[1] : +cloudRunMapId;
    }
    this.handleFileCreateDate(this.fileInfo.creationDate);

    const targetUserId = +this.fileInfo.author.split('=')[1];
    if (!this.uiFlag.isPortal) {
      
      if (this.userProfile.userId === targetUserId) {
        this.uiFlag.isFileOwner = true;
      }

    }

    if (!this.uiFlag.isFileOwner) {
      const body = {
        targetUserId: targetUserId
      };

      this.userProfileService.getUserProfile(body).subscribe(res => {
        if (res.processResult && res.processResult.resultCode === 200) {
          const {userProfile} = res;
          this.ownerProfile = {
            icon: userProfile.avatarUrl,
            name: userProfile.nickname
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
    
    const userAge = this.uiFlag.isFileOwner ? moment().diff(this.userProfile.birthday, 'years') : null,
          userHRBase = this.userProfile.heartRateBase,
          userMaxHR = this.userProfile.heartRateMax,
          userRestHR = this.userProfile.heartRateResting;
    this.chartData.hrInfo = this.utils.getUserHrRange(userHRBase, userAge, userMaxHR, userRestHR);
    this.chartData.defaultHrInfo = this.utils.getUserHrRange(0, 30, 190, 60); // 預設的心率區間
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
    if (fileInfo.author) {

      if (fileInfo.class) {
        const groupId = fileInfo.class.split('=')[1] || fileInfo.class.split('=')[0];
        if (groupId.includes('-')) this.getClassInfo(groupId);  // 確認是否抓到正確的groupId
        this.getTeacherInfo(+fileInfo.teacher.split('=')[1]);
      }

      if (fileInfo.equipmentSN.length !== 0) {
        this.getProductInfo(fileInfo.equipmentSN);
      }

    } else {
      // 待頁面皆生成再取頁尾資訊
      setTimeout(() => {
        this.getOtherInfo(this.fileInfo);
      }, 2000);

    }

  }

  /**
   * 從userProfile取得使用者設定的重訓程度
   * @author kidin-1100218
   */
  getUserWeightTrainLevel() {
    switch(`${this.userProfile.weightTrainingStrengthLevel}%`) {
      case '200%':
        this.uiFlag.weightTrainLevel = 'asept';
        break;
      case '50%':
        this.uiFlag.weightTrainLevel = 'novice';
        break;
      default:
        this.uiFlag.weightTrainLevel = 'metacarpus';
        break;
    }

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

        this.checkGroupResLength('classDesc');
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
          icon: userProfile[0].avatarUrl,
          name: userProfile[0].nickname,
          desc: userProfile[0].description
        };

        this.checkGroupResLength('teacherDesc');
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
          icon: `/app/public_html/products${productInfo[0].modelImg}`,
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
    const pointLen = point.length;
    // 若最後兩點時間相同，則將最後兩點進行均化
    if (point[pointLen - 1].pointSecond === point[pointLen - 2].pointSecond) {
      const repeatPoint = point.splice(pointLen - 1, pointLen)[0],
            newPointLen = point.length,
            lastPoint = point[newPointLen - 1];
      for (let key in lastPoint) {

        if (lastPoint.hasOwnProperty(key) && repeatPoint.hasOwnProperty(key)) {

          if (key !== 'pointSecond' && lastPoint[key] && repeatPoint[key]) {
            lastPoint[key] = (+lastPoint[key] + (+repeatPoint[key])) / 2;
          }

        }

      }

    }

    // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    Highcharts.charts.length = 0;

    this.activityPointLayer = {};
    // this.uiFlag.resolution = this.handleResolution(point.length); (預埋)

    // 距離為0或第一點的距離為null則趨勢圖表設定框分段解析不顯示距離選項
    this.trendChartOpt.haveDistanceChoice = (this.activityInfoLayer.totalDistanceMeters && point[0]['distanceMeters']) ? true : false;

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

    if (this.uiFlag.isPreviewMode) {
      this.changeXAxisType(this.trendChartOpt.xAxisType);
      if (this.trendChartOpt.segmentMode) {
        this.countSegmentData();
      }
  
      this.changeSegmentRange(this.trendChartOpt.segmentRange);
    } else {
      this.assignDataRef();
    }
    

    // 若所有座標皆為無效點，則不顯示地圖
    if (!haveEffectiveCoordinates) {
      this.uiFlag.isNormalCoordinate = false;
    } else {
      Object.assign(this.activityPointLayer, {'latitudeDegrees': convertDegree.latitudeDegrees});
      Object.assign(this.activityPointLayer, {'longitudeDegrees': convertDegree.longitudeDegrees});
      this.uiFlag.isNormalCoordinate = true;
    }

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
   * 顯示重訓圖表訓練程度選項
   * @param e {MouseEvent}
   * @author kidin-1100114
   */
  handleShowWeightTrainOptMenu(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showWeightTrainingOpt = !this.uiFlag.showWeightTrainingOpt;
    this.uiFlag.showWeightTrainingOpt ? this.subscribeClick() : this.ngUnsubscribeClick();
  }

  /**
   * 顯示重訓程度選擇清單
   * @param e {MouseEvent}
   * @author kidin-1100218
   */
  handleShowLevelSelector(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showLevelSelector = !this.uiFlag.showLevelSelector;
  }

  /**
   * 變更重訓程度
   * @param level {UserLevel}-重訓程度
   * @author kidin-1100218
   */
  changeLevel(level: UserLevel) {
    this.uiFlag.weightTrainLevel = level;
    this.uiFlag.showLevelSelector = false;
    this.uiFlag.showWeightTrainingOpt = false;
    this.ngUnsubscribeClick();
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
      this.uiFlag.showWeightTrainingOpt = false;
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

    this.assignDataRef();
  }

  /**
   * 切換x軸依據類型
   * @param type {SegmentType}-分段類型
   * @author kidin-1100203
   */
  changeXAxisType(type: SegmentType) {
    if (!this.uiFlag.isPreviewMode) {
      this.trendChartOpt.segmentRange = type === 'pointSecond' ? 60 : 100;
    }
    
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

    this.assignDataRef();
  }

  /**
   * 根據使用者所選之設定，指定圖表輸入的數據
   * @author kidin-1100222
   */
  assignDataRef() {
    if (!this.trendChartOpt.segmentMode) {

      if (this.trendChartOpt.xAxisType === 'pointSecond') {
        this.trendChartOpt.xAxisDataRef = this.activityPointLayer['pointSecond'];
        this.trendChartOpt.yAxisDataRef = this.activityPointLayer;
      } else {
        this.trendChartOpt.xAxisDataRef = this.trendChartData.xAxis;
        this.trendChartOpt.yAxisDataRef = this.trendChartData.yAxis;
      }

    } else {
      this.trendChartOpt.xAxisDataRef = this.segmentData.xAxis;
      this.trendChartOpt.yAxisDataRef = this.segmentData.yAxis;
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
    this.assignDataRef();
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
          } else if (refYAxisData[apiKey]) {
            Object.assign(segmentTotal, {[key]: refYAxisData[apiKey][i] * scale});
          }

          // 確認是否為最後一個數據
          if (i === dataLength - 1 && segmentTotal.hasOwnProperty(key)) {
            this.segmentData.yAxis[key].push(+segmentTotal[key].toFixed(1));

            if (_index === 0) {
              this.segmentData.xAxis.push(range * divideIndex);
            }
          }

        });

      } else {
        const scale = (range * divideIndex - (refXAxisData[i - 1] || 0)) / range;  // 數據在該分段佔比
        // 當x軸數據大於目前分段範圍兩段以上時
        if ((refXAxisData[i] / range) >= divideIndex + 1) {
          const nextBoundaryIdx = Math.ceil(refXAxisData[i] / range);
          countList.forEach((_list, _index) => {

            if (refYAxisData[_list[1]]) {
              const key = _list[0],
                    apiKey = _list[1],
                    fillLen = (nextBoundaryIdx - 1) - divideIndex ,  // 填充的array長度
                    fillArr = new Array(fillLen),
                    xAxisFillArr = Array.from(fillArr, (value, index) => range * ((divideIndex + 1) + index)),
                    yAxisFillArr = fillArr.fill(refYAxisData[apiKey][i], 0, fillLen);

              // y軸填入上一段數據後，再開始填充下一段數據
              segmentTotal[key] += refYAxisData[apiKey][i] * scale;
              this.segmentData.yAxis[key].push(+segmentTotal[key].toFixed(1));
              this.segmentData.yAxis[key] = this.segmentData.yAxis[key].concat(yAxisFillArr);

              // x軸填入上一段數據後，再開始填充下一段數據
              if (_index === 0) {
                this.segmentData.xAxis.push(range * divideIndex);
                this.segmentData.xAxis = this.segmentData.xAxis.concat(xAxisFillArr);
              }

              // 若數據不在分段邊界上
              if (range * divideIndex !== refXAxisData[i]) {
                // 下一個分段的數值加上該比例數值
                if (i !== dataLength - 1) {
                  const nextScale = (refXAxisData[i] - ((nextBoundaryIdx - 1) * range)) / range;
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

            }

          });

          divideIndex = nextBoundaryIdx;
        } else {
          // 判斷數據是否在分段邊界上或為最後一個數據
          if (range * divideIndex !== refXAxisData[i] && i !== dataLength - 1) {
            countList.forEach((_list, _index) => {
              if (refYAxisData[_list[1]]) {
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

              }

            });
 
          } else {
            countList.forEach(_list => {
              if (refYAxisData[_list[1]]) {
                const key = _list[0],
                      apiKey = _list[1];

                segmentTotal[key] += refYAxisData[apiKey][i] * scale;
                this.segmentData.yAxis[key].push(+(segmentTotal[key].toFixed(1))); 
                segmentTotal[key] = 0;
              }

            });
            
            this.segmentData.xAxis.push(range * divideIndex);
          }

          divideIndex++;
        }

      }

    }

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
   * 確認群組介紹是否過長
   * @author kidin-1091204
   */
  checkGroupResLength(type: FooterDesc) {

    setTimeout(() => {
      const descSection = this[type].nativeElement,
            descStyle = window.getComputedStyle(descSection, null),
            descLineHeight = +descStyle.lineHeight.split('px')[0],
            descHeight = +descStyle.height.split('px')[0];

      if (descHeight / descLineHeight > 5) {
        this.uiFlag[`${type}Overflow`] = true;
      } else {
        this.uiFlag[`${type}Overflow`] = false;
      }

    });

  }

  /**
   * 展開介紹區塊
   * @param type {}-欲展開的區塊
   * @author kidin-1100219
   */
  handleShowMore(type: FooterDesc) {
    this.uiFlag[`${type}Overflow`] = false;
  }

  /**
   * 若該筆運動檔案未開放隱私權則顯示隱私權提示
   * @author kidin-1100302
   */
  showPrivacyAlert() {
    if (this.userProfile.systemAccessRight[0] <= 29 && !this.uiFlag.isFileOwner) {
      this.showShareBox();
    } else {
      
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: `${this.translate.instant('universal_privacy_usingSharing')}`,
          confirmText: this.translate.instant(
            'universal_operating_confirm'
          ),
          cancelText: this.translate.instant(
            'universal_operating_cancel'
          ),
          onCancel: () => {
            return false;
          },
          onConfirm: this.openFilePrivacy.bind(this)
        }
      });

    }

  }

  /**
   * 開放該筆運動檔案隱私權
   * @author kidin-1100302
   */
  openFilePrivacy() {
    this.filePrivacy = [99];
    this.editFilePrivacy(true);
  }

  /**
   * 編輯該筆運動檔案隱私權
   * @param willShare {boolean}-是否顯示分享框
   * @author kidin-1100302
   */
  editFilePrivacy(willShare: boolean = false) {
    const body = {
      token: this.utils.getToken() || '',
      fileId: this.fileInfo.fileId,
      fileInfo: {
        privacy: this.filePrivacy
      }
    };

    this.activityService.fetchEditActivityProfile(body).subscribe(res => {
      if (res.resultCode === 200) {
        
        if (willShare) {
          this.showShareBox();
        } else {
          this.snackBar.open(
            `${this.translate.instant(
              'universal_operating_edit'
            )}
            ${this.translate.instant(
              'universal_status_success'
            )}`,
            'OK',
            { duration: 2000 }
          );

        }

      } else {
        this.utils.openAlert(errMsg);
      }

    });

  }

  /**
   * 顯示分享框
   * @author kidin-1100220
   */
  showShareBox() {
    const url = this.uiFlag.isPortal ? location.href : `${location.origin}${location.pathname.split('/dashboard')[1]}`,
          debugUrl = this.uiFlag.isPortal ? `${location.origin}/dashboard${location.pathname}?debug=` : `${location.href.split('?')[0]}?debug=`;

    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url,
        title: this.translate.instant('universal_operating_share'),
        shareName: this.fileInfo.dispName,
        cancelText: this.translate.instant('universal_operating_cancel'),
        debugUrl: this.userProfile.systemAccessRight[0] <= 29 ? debugUrl : ''
      }

    });

  }

  /**
   * 下載raw data
   * @author kidin-1100220
   */
  downloadRawData() {
    const CSVName = `${this.rawData.fileInfo.dispName}${this.rawData.fileInfo.creationDate}.csv`,
          data = this.switchCSVFile(this.rawData),
          blob = new Blob(['\ufeff' + data], {  // 加上bom（\ufeff）讓excel辨識編碼
            type: 'text/csv;charset=utf8'
          }),
          href = URL.createObjectURL(blob),  // 建立csv檔url
          link = document.createElement('a');  // 建立連結供csv下載使用

    document.body.appendChild(link);
    link.href = href;
    link.download = CSVName;
    link.click();
  }

  /**
   * 將所需資料轉換為csv格式
   * @param rawData {any}-活動賽事檔案內容
   * @author kidin-1090928
   */
  switchCSVFile(rawData: any) {
    let csvData = '';
    const [finalObj, finalLength] = this.flattenObj(rawData);
    csvData += '\n';
    for (let i = -1; i < finalLength; i++) {

      for (let key in finalObj) {
        
        if (i === -1) {
          csvData += `${key},`;
        } else {
          csvData += finalObj[key][i] !== undefined ? `${finalObj[key][i]},` : ',';
        }
        
      }
      
      csvData += '\n';
    }

    return csvData;
  }

  /**
   * 攤平物件
   * @param rawData {any}-api 2103 的內容
   * @author kidin-1100126
   */
  flattenObj(rawData: any): Array<any> {
    // csv排除以下資訊
    const excludeData = [
            'alaFormatVersionName',
            'apiCode',
            'msgCode',
            'resultCode',
            'resultMessage',
            'fileInfo'
          ],
          finalObj = {};
    let maxLength = 0;

    for (let key in rawData) {

      if (!excludeData.includes(key)) {

        // 純陣列
        if (Array.isArray(rawData[key]) && typeof rawData[key][0] !== 'object') {
          maxLength = rawData[key].length > maxLength ? rawData[key].length : maxLength;
          // 同key則將數據整合至一個array中
          if (finalObj.hasOwnProperty(key)) {
            finalObj[key] = finalObj[key].concat(rawData[key]);
          } else {
            Object.assign(finalObj, {[key]: rawData[key]});
          }

        // 為陣列，且其元素為物件 
        } else if (Array.isArray(rawData[key]) && typeof rawData[key][0] === 'object') {
          maxLength = rawData[key].length > maxLength ? rawData[key].length : maxLength;
          rawData[key].forEach(_rawData => {
            const [childObj, childMaxLength] = this.flattenObj(_rawData);
            maxLength = childMaxLength > maxLength ? childMaxLength : maxLength;
            for (let childKey in childObj) {
              const mergeKey = `${key}.${childKey}`;
              // 同key則將數據整合至一個array中
              if (finalObj.hasOwnProperty(mergeKey)) {

                if (Array.isArray(childObj[childKey])) {
                  finalObj[mergeKey] = finalObj[mergeKey].concat(childObj[childKey]);
                } else {
                  finalObj[mergeKey].push(childObj[childKey]);
                }

              } else {
                Array.isArray(childObj[childKey]) ?
                  Object.assign(finalObj, {[mergeKey]: childObj[childKey]}) : Object.assign(finalObj, {[mergeKey]: [childObj[childKey]]});;
              }
              
            }

          });

        // 物件
        } else if (rawData[key] !== null && typeof rawData[key] === 'object') {
          const [childObj, childMaxLength] = this.flattenObj(rawData[key]);
          maxLength = childMaxLength > maxLength ? childMaxLength : maxLength;
          for (let childKey in childObj) {

            // 同key則將數據整合至一個array中
            const mergeKey = `${key}.${childKey}`;
            if (finalObj.hasOwnProperty(mergeKey)) {
              Array.isArray(childObj[childKey]) ? 
                finalObj[mergeKey].push(childObj[childKey][0]) : finalObj[mergeKey].push(childObj[childKey]);
            } else {
              Array.isArray(childObj[childKey]) ? 
                Object.assign(finalObj, {[mergeKey]: childObj[childKey]}) : Object.assign(finalObj, {[mergeKey]: [childObj[childKey]]});
            }
            
          }

        // 純值
        } else {
          // 同key則將數據整合至一個array中
          if (finalObj.hasOwnProperty(key)) {
            finalObj[key].push(rawData[key][0]);
          } else {
            Object.assign(finalObj, {[key]: rawData[key]});
          }
          
        }

      }

    }

    return [finalObj, maxLength];
  }

  /**
   * 開新分頁預覽列印頁面
   * @author kidin-1100220
   */
  printPreview() {
    this.getPreviewUrl();
    window.open(this.previewUrl, '_blank', 'noopener=yes,noreferrer=yes');
  }

  /**
   * 根據使用者圖表設定取得預覽列印網址
   * @author kidin-1100225
   */
  getPreviewUrl() {
    let queryStringArr = ['ipm=s'];
    if (this.activityInfoLayer.type == 3) queryStringArr.push(`weightTrainLevel=${this.uiFlag.weightTrainLevel}`);
    if ([1, 2, 4, 6, 7].includes(+this.activityInfoLayer.type)) queryStringArr.push(this.compareChartQueryString);

    let trendChartQueryString = `xAxisType=${this.trendChartOpt.xAxisType}&segmentMode=${this.trendChartOpt.segmentMode}`;
    if (this.trendChartOpt.segmentMode) trendChartQueryString += `&segmentRange=${this.trendChartOpt.segmentRange}`;
    queryStringArr.push(trendChartQueryString);

    if (this.uiFlag.isDebug) queryStringArr.push('debug=true');

    this.previewUrl = `${location.origin}${location.pathname}?${queryStringArr.join('&')}`;
  }

  /**
   * 列印
   * @author kidin-1100220
   */
  printPage() {
    window.print();
  }

  /**
   * 顯示刪除警告視窗
   * @author kidin-1100220
   */
  showDeleteAlert() {
    return this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: `${this.translate.instant(
          'universal_activityData_file'
        )} ${this.translate.instant(
          'universal_popUpMessage_confirmDelete'
        )}`,
        confirmText: this.translate.instant(
          'universal_operating_confirm'
        ),
        cancelText: this.translate.instant(
          'universal_operating_cancel'
        ),
        onCancel: () => {
          return false;
        },
        onConfirm: this.deleteFile.bind(this)
      }
    });

  }

  /**
   * 刪除運動檔案後導回運動列表
   * @author kidin-1100220
   */
  deleteFile () {
    const body = {
      token: this.utils.getToken() || '',
      fileId: [this.fileInfo.fileId]
    };

    this.activityService.deleteActivityData(body).subscribe(res => {
      if (+res.resultCode === 200) {
        this.snackBar.open(
          `${this.translate.instant(
            'universal_operating_delete'
          )}
          ${this.translate.instant(
            'universal_status_success'
          )}`,
          'OK',
          { duration: 2000 }
        );

        setTimeout(() => {
          this.router.navigateByUrl('/dashboard/activity-list');
        }, 2000);
      } else {
        this.snackBar.open(
          `${this.translate.instant(
            'universal_operating_delete'
          )}
          ${this.translate.instant(
            'universal_status_failure'
          )}`,
          'OK',
          { duration: 2000 }
        );
      }
    });

  }

  /**
   * 返回運動列表
   * @author kidin-1100220
   */
  returnList() {
    window.history.back();
  }

  /**
   * 編輯檔案名稱
   * @author kidin-1100220
   */
  editFileName() {
    this.newFileName = this.fileInfo.dispName;
    this.uiFlag.editNameMode = true;
  }

  /**
   * 若使用者點擊Enter，則上傳新檔案名稱
   * @param e {KeyboardEvent}
   * @author kidin-1100220
   */
  handleKeypress(e: KeyboardEvent) {
    const oldFileName = this.fileInfo.dispName;
    if ((e.key === 'Enter' && this.newFileName === oldFileName)) {
      this.uiFlag.editNameMode = false;
    } else if (e.key === 'Enter' && this.newFileName.trim() === '') {
      this.newFileName = oldFileName;
      this.uiFlag.editNameMode = false;
    } else if (e.key === 'Enter' && this.newFileName !== oldFileName) {
      this.handleNewProfileName();
    }

  }

  /**
   * 關閉編輯活動檔案名稱模式
   * @author kidin-1100220
   */
  cancelEdit() {
    this.uiFlag.editNameMode = false;
    this.newFileName = this.fileInfo.dispName;
  }

  /**
   * 確認修改檔案名稱
   * @author kidin-1100220
   */
  confirmEdit() {
    const oldFileName = this.fileInfo.dispName;
    if (this.newFileName !== oldFileName) {
      this.handleNewProfileName();
    } else {
      this.uiFlag.editNameMode = false;
    }
    
  }

  /**
   * 上傳新名稱
   * @author kidin-1100220
   */
  handleNewProfileName() {
    const body = {
      token: this.utils.getToken() || '',
      fileId: this.fileInfo.fileId,
      fileInfo: {
        dispName: this.newFileName,
        editDate: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
      }
    };

    this.activityService.fetchEditActivityProfile(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.uiFlag.editNameMode = false;
        this.fileInfo.dispName = this.newFileName;
      } else {
        this.utils.openAlert(errMsg);
      }

    });

  }

  /**
   * 圖片載入完成
   * @author kidin-1100224
   */
  sceneryImgLoaded() {
    this.uiFlag.imageLoaded = true;
  }

  /**
   * 取得使用者地圖比較圖之設定，用來設定預覽列印頁面url querystring
   * @param e {string}-由子組件傳回之url querystring
   * @author kidin-1100225
   */
  getChartSetting(e: string) {
    this.compareChartQueryString = e;
  }

  /**
   * 編輯該運動檔案隱私權
   * @author kidin-1100302
   */
  openPrivacySetting() {
    this.dialog.open(EditIndividualPrivacyComponent, {
      hasBackdrop: true,
      data: {
        editType: 1,
        fileId: this.fileInfo.fileId,
        openObj: this.fileInfo.privacy.map(_privacy => +_privacy),
        onConfirm: this.editPrivacy.bind(this)
      }

    });

  }

  /**
   * 修改隱私權設定成功後替換fileInfo的privacy
   * @param privacy {Array<PrivacyCode>}-該筆運動檔案隱私權設定
   * @author kidin-1100302
   */
  editPrivacy(privacy: Array<PrivacyCode>) {
    this.fileInfo.privacy = privacy;
  }

  /**
   * 取消rxjs訂閱，並將highchart卸除
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
