import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, fromEvent, Subscription, of, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { UserProfileInfo } from '../../models/user-profile-info';
import { HrBase } from '../../enum/personal';
import { UtilsService } from '../../services/utils.service';
import { ActivityService } from '../../services/activity.service';
import { Router } from '@angular/router';
import { QrcodeService } from '../../../containers/portal/services/qrcode.service';
import { GroupService } from '../../services/group.service';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import { TranslateService } from '@ngx-translate/core';
import { MuscleNamePipe } from '../../pipes/muscle-name.pipe';
import { mi, lb } from '../../models/bs-constant';
import { charts } from 'highcharts';
import { HrZoneRange } from '../../models/chart-data';
import { SportType } from '../../enum/sports';
import { UserLevel } from '../../models/weight-train';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../message-box/message-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShareGroupInfoDialogComponent } from '../share-group-info-dialog/share-group-info-dialog.component';
import { PrivacyObj } from '../../models/user-privacy';
import { EditIndividualPrivacyComponent } from '../edit-individual-privacy/edit-individual-privacy.component';
import { AlbumType } from '../../models/image';
import { v5 as uuidv5 } from 'uuid';
import { ImageUploadService } from '../../../containers/dashboard/services/image-upload.service';
import { getPaceUnit, getUserHrRange } from '../../utils/sports';
import { getFileInfoParam } from '../../utils/index';
import { AuthService } from '../../../core/services/auth.service';
import { AccessRight } from '../../enum/accessright';
import { Api10xxService } from '../../../core/services/api-10xx.service';

dayjs.extend(weekday);


const errMsg = `Error! Please try again later.`;

type DisplayTag = 'summary' | 'detail' | 'segmentation' | 'chart';
type SegmentType = 'pointSecond' | 'distanceMeters';
type SegmentSecond = 60 | 300 | 600 | 1800;
type SegmentMeter = 100 | 500 | 1000 | 10000;
type FooterDesc = 'classDesc' | 'teacherDesc';

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    imageLoaded: false,
    openImgSelector: false,
    deviceIndex: 0
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
      hrBase: HrBase.max,
      z0: <number | string>0,
      z1: <number | string>0,
      z2: <number | string>0,
      z3: <number | string>0,
      z4: <number | string>0,
      z5: <number | string>0
    },
    defaultHrInfo: <HrZoneRange>{
      hrBase: HrBase.max,
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

  /**
   * 管理編輯頭像或佈景
   */
  editImage = {
    edited: false,
    origin: null,
    base64: null
  }

  fileTime: string;
  sceneryImg: string;
  pageResize: Subscription;
  clickEvent: Subscription;
  muscleTranslate = {};
  newFileName = '';
  printDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  previewUrl = '';
  progress = 0;
  compareChartQueryString = '';
  filePrivacy: Array<PrivacyObj> = [1];
  cloudrunMapId: number;
  systemAccessright = AccessRight.guest;
  
  readonly AlbumType = AlbumType;
  readonly AccessRight = AccessRight;

  // 頁面所需資訊
  readonly needKey = [
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

  constructor(
    private userService: UserService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private router: Router,
    private qrcodeService: QrcodeService,
    private groupService: GroupService,
    private translate: TranslateService,
    private muscleName: MuscleNamePipe,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,
    private api10xxService: Api10xxService
  ) { }

  ngOnInit(): void {
    this.checkUrlPath();
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
   * 取得userProfile
   */
  checkUrlPath() {
    this.uiFlag.isPortal = location.pathname.indexOf('dashboard') > -1;
  }

  /**
   * 確認是否為 debug mode 或 preview mode
   * @param searchStr {string}-url query string
   * @author kidin-1100104
   */
  checkQueryString(searchStr: string) {
    const queryString = searchStr.split('?')[1];
    if (queryString) {
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
      this.changeDetectorRef.markForCheck();
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
    const token = this.authService.token;
    if (token) {
      return this.userService.getUser().rxUserProfile;
    } else {
      const fakeUserProfile = {
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
        heartRateBase: HrBase.max,
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

      return of(fakeUserProfile);
    }

  }

  /**
   * 取得個人資訊
   * @author kidin-1100104
   */
  getRxUserProfile() {
    return this.userService.getUser().rxUserProfile.pipe(
      takeUntil(this.ngUnsubscribe)
    );

  }

  /**
   * 取得運動詳細資料
   * @author kidin-1100104
   */
  getActivityDetail() {
    this.progress = 30;
    const { pathname } = location;
    const pathArr = pathname.split('/');
    const fileId = pathArr[pathArr.length - 1];
    this.fileInfo.fileId = fileId;
    let body: any = {
      token: this.authService.token,
      fileId: fileId,
      // displayDetailField: 3  // 新api回傳格式
    };

    if (this.uiFlag.isDebug) {
      body = {debug: 'true', ...body};
    }

    combineLatest([
      this.getRxUserProfile(),
      this.activityService.fetchSportListDetail(body)
    ]).subscribe(resArr => {
      const [userProfile, activityDetail] = resArr;
      this.userProfile = userProfile;
      const { resultCode, apiCode, resultMessage } = activityDetail;
      switch (resultCode) {
        case 400:  // 找不到該筆運動檔案或其他
          this.progress = 100;
          console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
          this.router.navigateByUrl('/404');
          break;
        case 403: // 無權限觀看該運動檔案
          this.progress = 100;
          this.router.navigateByUrl('/403');
          break;
        case 200:
          this.progress = 70;
          this.handleActivityDetail(activityDetail);
          break;
        default:
          this.progress = 100;
          console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
          this.utils.openAlert(errMsg);
          break;
      }

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 處理運動詳細資料
   * @param data {any}-api 2103回傳的內容
   * @author kidin-1100104
   */
  handleActivityDetail(data: any) {
    this.rawData = data;
    const { fileInfo, activityInfoLayer, activityLapLayer, activityPointLayer } = data,
          { type, subtype } = activityInfoLayer;
    this.activityInfoLayer = activityInfoLayer;
    this.sceneryImg = this.handleScenery(fileInfo.photo, +type, +subtype); 
    this.handleFileInfo(fileInfo);
    this.handleHrZoneData(activityInfoLayer);
    if (+type === 2) this.handleFtpZoneData(activityInfoLayer);
    this.activityLapLayer = activityLapLayer;
    if (activityPointLayer.length === 0) {
      this.handleActivityPoint(this.handleEmptyPoint());
    } else {
      this.handleActivityPoint(activityPointLayer);
    }

    if(type == 3) {
      if (!this.uiFlag.isPreviewMode) this.getUserWeightTrainLevel();
      this.createMuscleTranslate();
    }

    this.progress = 100;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 確認檔案代表圖是否存在，不存在則根據運動主副類別給予預設圖片
   * @param photo {string}-代表圖之url
   * @param type {SportType}-運動主類別
   * @param subType {number}-運動副類別
   * @returns string
   */
  handleScenery(photo: string = null, type: SportType, subType: number) {
    if (photo) {
      return photo;
    } else {
      return this.activityService.handleSceneryImg(type, subType);
    }

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
      const cloudrunInfo = getFileInfoParam(cloudRunMapId);
      this.cloudrunMapId = +(cloudrunInfo.mapId ?? cloudrunInfo.origin);
    }

    this.handleFileCreateDate(this.fileInfo.creationDate);
    const targetUserId = this.fileInfo.author ? +getFileInfoParam(this.fileInfo.author).userId : undefined;
    if (!this.uiFlag.isPortal) {
      
      if (this.userProfile.userId === targetUserId) {
        this.uiFlag.isFileOwner = true;
      }

    }

    if (!this.uiFlag.isFileOwner) {

      if (targetUserId) {
        const body = { targetUserId: targetUserId };
        this.api10xxService.fetchGetUserProfile(body).subscribe(res => {
          const { processResult } = res;
          if (processResult) {
            const { resultCode, apiCode, resultMessage } = processResult;
            if (resultCode !== 200) {
              console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
            } else {
              const {userProfile} = res;
              this.ownerProfile = {
                icon: userProfile.avatarUrl,
                name: userProfile.nickname
              };

            } 
          } else {
            console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
          }
    
        });

      } else {
        this.ownerProfile = {
          icon: null,
          name: ''
        };
      }
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
    const dayInWeek = dayjs(date).weekday();
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

      this.fileTime = dayjs(date).format('YYYY-MM-DDTHH:mm').replace('T', ` ${weekDay} `);
    });
    

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
    
    const userAge = this.uiFlag.isFileOwner ? dayjs().diff(this.userProfile.birthday, 'year') : null,
          userHRBase = this.userProfile.heartRateBase,
          userMaxHR = this.userProfile.heartRateMax,
          userRestHR = this.userProfile.heartRateResting;
    this.chartData.hrInfo = getUserHrRange(userHRBase, userAge, userMaxHR, userRestHR);
    this.chartData.defaultHrInfo = getUserHrRange(0, 30, 190, 60); // 預設的心率區間
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
    const { author, class: groupClass, teacher, equipmentSN } = fileInfo;
    if (author) {

      if (groupClass) {
        const classInfo = getFileInfoParam(groupClass);
        const groupId = classInfo.groupId ?? classInfo.origin;
        if (groupId.includes('-')) this.getClassInfo(groupId);  // 確認是否抓到正確的groupId
        this.getTeacherInfo(+getFileInfoParam(teacher).userId);
      }

      if (equipmentSN.length !== 0) {
        this.getProductInfo(equipmentSN);
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
        const muscleName = this.muscleName.transform(_code);
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
      token: this.authService.token,
      groupId,
      avatarType: 3,
      findRoot: 1
    };

    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
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
      
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 取得教練資訊
   * @param userId {number}
   * @author kidin-1100104
   */
  getTeacherInfo(userId: number) {
    const body = {
      token: this.authService.token,
      targetUserId: [userId]
    };

    this.api10xxService.fetchGetUserProfile(body).subscribe(res => {
      const { processResult } = res;
      if (processResult) {
        const { resultCode, apiCode, resultMessage } = processResult;
        if (resultCode !== 200) {
          console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
        } else {
          const { userProfile} = res;
          this.otherInfo.teacherInfo = {
            icon: userProfile[0].avatarUrl,
            name: userProfile[0].nickname,
            desc: userProfile[0].description
          };

          this.checkGroupResLength('teacherDesc');
        }

      } else {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      }

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 取得裝置資訊
   * @param equipmentList {Array<string>}-裝置sn序號列表
   * @author kidin-1100104
   */
  getProductInfo(equipmentList: Array<string>) {
    const body = {
      token: this.authService.token,
      queryType: 1,
      queryArray: equipmentList
    };

    this.qrcodeService.getProductInfo(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.otherInfo.deviceInfo = res.info.productInfo;
      }

      this.changeDetectorRef.markForCheck();
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

      this.changeDetectorRef.markForCheck();
    }, 50);
    
  }

  /**
   * 處理activityPointLayer為空陣列的情況
   * @author kidin-1100413
   */
  handleEmptyPoint() {
    return [{
      pointSecond: null,
      altitudeMeters: null,
      heartRateBpm: null,
      speed: null,
      runCadence: null,
      cycleCadence: null,
      cycleWatt: null,
      swimCadence: null,
      temp: null,
      rowingWatt: null,
      rowingCadence: null,
      gsensorXRawData: null,
      gsensorYRawData: null,
      gsensorZRawData: null,
      moveRepetitions: null,
      distanceMeters: null
    }];

  }

  /**
   * 將activityPointLayer加工以顯示地圖和圖表
   * @param point {any}-api 2103的activityPointLayer
   * @author kidin-1100104
   */
  handleActivityPoint(point: any) {
    const pointLen = point.length,
          { pointSecond } = point[pointLen - 1] || {pointSecond: 0},
          { pointSecond: beforePointSecond } = point[pointLen - 2] || {pointSecond: undefined};
    // 若最後兩點時間相同，則將最後兩點進行均化
    if (pointSecond === beforePointSecond) {
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
    charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    charts.length = 0;

    this.activityPointLayer = {};
    // this.uiFlag.resolution = this.handleResolution(point.length); (預埋)

    // 距離為0或第一點的距離為null則趨勢圖表設定框分段解析不顯示距離選項
    this.trendChartOpt.haveDistanceChoice = (this.activityInfoLayer.totalDistanceMeters && point[0]['distanceMeters']) ? true : false;
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
        this.needKey.forEach(_key => {
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
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 顯示重訓程度選擇清單
   * @param e {MouseEvent}
   * @author kidin-1100218
   */
  handleShowLevelSelector(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showLevelSelector = !this.uiFlag.showLevelSelector;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更重訓程度
   * @param level {UserLevel}-重訓程度
   * @author kidin-1100218
   */
  changeLevel(level: UserLevel) {
    this.uiFlag.weightTrainLevel = level;
    const strengthLevel = this.getStrengthLevel(level);
    if (!this.uiFlag.isPortal || this.uiFlag.isFileOwner) {
      const updateContent = { weightTrainingStrengthLevel: strengthLevel };
      this.userService.updateUserProfile(updateContent).subscribe(res => {
        const { processResult } = res;
        if (processResult && processResult.resultCode === 200) {
          this.userProfile.weightTrainingStrengthLevel = strengthLevel;
        }

      });

    }

    this.uiFlag.showLevelSelector = false;
    this.uiFlag.showWeightTrainingOpt = false;
    this.ngUnsubscribeClick();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取得對應的訓練程度(api用)
   * @param level { UserLevel }-重訓程度
   * @author kidin-1100610
   */
  getStrengthLevel(proficiency: UserLevel) {
    switch (proficiency) {
      case 'novice':
        return 50;
      case 'metacarpus':
        return 100;
      case 'asept':
        return 200;
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
    this.changeDetectorRef.markForCheck();
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
      this.changeDetectorRef.markForCheck();
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
    this.changeDetectorRef.markForCheck();
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
      this.trendChartData = this.handleRepeatXAxis(
        this.activityPointLayer['distanceMeters'],
        this.activityPointLayer,
        apiKeyList
      );

    }

    if (this.trendChartOpt.segmentMode) {
      this.countSegmentData();
    }

    this.assignDataRef();
    this.changeDetectorRef.markForCheck();
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
    this.changeDetectorRef.markForCheck();
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
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 根據運動類別取得趨勢圖表所需顯示的項目
   * @param sportType {SportType}-運動類別
   * @author kidin-1100205
   */
  getCountList(sportType: SportType): Array<Array<string>> {
    let arr: Array<Array<string>>;
    switch (sportType) {
      case SportType.run:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['cadence', 'runCadence'],
          ['speed', 'speed']
        ];
        break;
      case SportType.cycle:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['cadence', 'cycleCadence'],
          ['power', 'cycleWatt'],
          ['speed', 'speed']
        ];
        break;
      case SportType.weightTrain:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['cadence', 'moveRepetitions']
        ];
        break;
      case SportType.swim:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['cadence', 'swimCadence'],
          ['speed', 'speed']
        ];
        break;
      case SportType.aerobic:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp']
        ];
        break;
      case SportType.row:
        arr = [
          ['hr', 'heartRateBpm'],
          ['temperature', 'temp'],
          ['altitude', 'altitudeMeters'],
          ['cadence', 'rowingCadence'],
          ['speed', 'speed'],
          ['power', 'rowingWatt']
        ];
        break;
      case SportType.ball:
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

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 展開介紹區塊
   * @param type {}-欲展開的區塊
   * @author kidin-1100219
   */
  handleShowMore(type: FooterDesc) {
    this.uiFlag[`${type}Overflow`] = false;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 若該筆運動檔案未開放隱私權則顯示隱私權提示
   * @author kidin-1100302
   */
  showPrivacyAlert() {
    const { systemAccessright } = this.userService.getUser();
    if (systemAccessright <= AccessRight.marketing && !this.uiFlag.isFileOwner) {
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

    this.changeDetectorRef.markForCheck();
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
      token: this.authService.token,
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

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 顯示分享框
   * @author kidin-1100220
   */
  showShareBox() {
    const { systemAccessright } = this.userService.getUser();
    const url = this.uiFlag.isPortal ? location.href : `${location.origin}${location.pathname.split('/dashboard')[1]}`;
    const debugUrl = this.uiFlag.isPortal ?
      `${location.origin}/dashboard${location.pathname}?debug=` : `${location.href.split('?')[0]}?debug=`;

    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url,
        title: this.translate.instant('universal_operating_share'),
        shareName: this.fileInfo.dispName,
        cancelText: this.translate.instant('universal_operating_confirm'),
        debugUrl: systemAccessright <= AccessRight.marketing ? debugUrl : ''
      }

    });

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 下載raw data
   * @author kidin-1100220
   */
  downloadRawData() {
    const CSVName = `${this.rawData.fileInfo.dispName}${this.rawData.fileInfo.creationDate}.csv`;
    const data = this.switchCSVFile(this.rawData);
    const blob = new Blob(['\ufeff' + data], {  // 加上bom（\ufeff）讓excel辨識編碼
      type: 'text/csv;charset=utf8'
    });
    const href = URL.createObjectURL(blob);  // 建立csv檔url
    const link = document.createElement('a');  // 建立連結供csv下載使用

    document.body.appendChild(link);
    link.href = href;
    link.download = CSVName;
    link.click();
  }

  /**
   * 將所需資料轉換為csv格式
   * @param rawData {any}-運動檔案內容
   * @author kidin-1090928
   */
  switchCSVFile(rawData: any) {
    let csvData = '';
    const [finalObj, finalLength] = this.flattenObj(rawData);
    csvData += '\n';
    for (let i = -1; i < finalLength; i++) {

      for (let key in finalObj) {
        
        if (i === -1) {
          // 欄位標題
          csvData += `${key},`;
        } else {
          const value = finalObj[key][i];
          csvData += value !== undefined ? `${value},` : ',';
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
    ];
    const finalObj = {};
    let maxLength = 0;
    for (let key in rawData) {

      if (!excludeData.includes(key)) {
        const value = rawData[key];
        const isArray = Array.isArray(value) && typeof value[0] !== 'object';
        const isArrayOfObj = Array.isArray(value) && typeof value[0] === 'object';
        const isObj = value !== null && typeof value === 'object';
        if (isArray) {
          const valueLength = value.length;
          maxLength = valueLength > maxLength ? valueLength : maxLength;
          // 同key則將數據整合至一個array中
          if (finalObj.hasOwnProperty(key)) {
            finalObj[key] = finalObj[key].concat(value);
          } else {
            Object.assign(finalObj, {[key]: value});
          }

        } else if (isArrayOfObj) {
          const valueLength = value.length;
          maxLength = valueLength > maxLength ? valueLength : maxLength;
          value.forEach(_rawData => {
            const [childObj, childMaxLength] = this.flattenObj(_rawData);
            maxLength = childMaxLength > maxLength ? childMaxLength : maxLength;
            for (let childKey in childObj) {
              const mergeKey = `${key}.${childKey}`;
              const childValue = childObj[childKey];
              const childIsArray = Array.isArray(childValue);
              // 同key則將數據整合至一個array中
              if (finalObj.hasOwnProperty(mergeKey)) {
                
                if (childIsArray) {
                  finalObj[mergeKey] = finalObj[mergeKey].concat(childValue);
                } else {
                  finalObj[mergeKey].push(childValue);
                }

              } else {
                Object.assign(finalObj, {[mergeKey]: childIsArray ? childValue : [childValue]});
              }
              
            }

          });

        } else if (isObj) {
          const [childObj, childMaxLength] = this.flattenObj(value);
          maxLength = childMaxLength > maxLength ? childMaxLength : maxLength;
          for (let childKey in childObj) {
            // 同key則將數據整合至一個array中
            const mergeKey = `${key}.${childKey}`;
            const childValue = childObj[childKey];
            const childIsArray = Array.isArray(childValue);
            if (finalObj.hasOwnProperty(mergeKey)) {
              finalObj[mergeKey].push(childIsArray ? childValue[0] : childValue);
            } else {
              Object.assign(finalObj, {[mergeKey]: childIsArray ? childValue : [childValue]});
            }
            
          }

        } else {
          // 同key則將數據整合至一個array中
          if (finalObj.hasOwnProperty(key)) {
            finalObj[key].push(value[0]);
          } else {
            Object.assign(finalObj, {[key]: value});
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

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 刪除運動檔案後導回運動列表
   * @author kidin-1100220
   */
  deleteFile () {
    const body = {
      token: this.authService.token,
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

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 返回運動列表
   * @author kidin-1100220
   */
  returnList() {
    window.close();
    window.history.back();
  }

  /**
   * 編輯檔案名稱
   * @author kidin-1100220
   */
  editFileName() {
    this.newFileName = this.fileInfo.dispName;
    this.uiFlag.editNameMode = true;
    this.changeDetectorRef.markForCheck();
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
    this.changeDetectorRef.markForCheck();
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
    
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 上傳新名稱
   * @author kidin-1100220
   */
  handleNewProfileName() {
    const body = {
      token: this.authService.token,
      fileId: this.fileInfo.fileId,
      fileInfo: {
        dispName: this.newFileName,
        editDate: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
      }
    };

    this.activityService.fetchEditActivityProfile(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.uiFlag.editNameMode = false;
        this.fileInfo.dispName = this.newFileName;
      } else {
        this.utils.openAlert(errMsg);
      }

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 圖片載入完成
   * @author kidin-1100224
   */
  sceneryImgLoaded() {
    this.uiFlag.imageLoaded = true;
    this.changeDetectorRef.markForCheck();
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

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 修改隱私權設定成功後替換fileInfo的privacy
   * @param privacy {Array<PrivacyObj>}-該筆運動檔案隱私權設定
   * @author kidin-1100302
   */
  editPrivacy(privacy: Array<PrivacyObj>) {
    this.fileInfo.privacy = privacy;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 建立gpx檔案
   */
  downloadGpxFile() {
    const { 
            fileInfo: { dispName, creationDate },
            activityPointLayer,
            activityInfoLayer: {startTime}
          } = this.rawData,
          gpxName = `${dispName}${creationDate}.gpx`,
          data = this.switchGpxFile(activityPointLayer, startTime, dispName),
          blob = new Blob([data], {
            type: 'text/csv;charset=utf8'
          }),
          href = URL.createObjectURL(blob),  // 建立gpx檔url
          link = document.createElement('a');  // 建立連結供gpx下載使用

    document.body.appendChild(link);
    link.href = href;
    link.download = gpxName;
    link.click();
  }

  /**
   * 將所需資料轉換為gpx格式
   * @param points {Array<any>}-運動檔案單點資料
   * @param startTime {Array<any>}-運動開始時間
   * @param dispName {string}-運動檔案名稱
   * @author kidin-1090928
   */
  switchGpxFile(points: Array<any>, startTime: string, dispName: string) {
    let content = '';
    const startTimestamp = dayjs(startTime).valueOf();
    points.forEach(_point => {
      const { 
        latitudeDegrees,
        longitudeDegrees,
        altitudeMeters,
        pointSecond,
        heartRateBpm,
        runCadence,
        cycleCadence,
        swimCadence,
        rowingCadence,
        cycleWatt,
        rowingWatt,
        distanceMeters,
        temp
      } = _point;
      let power = null,
          cadence = null;
      switch (+this.activityInfoLayer.type) {
        case SportType.run:
          cadence = runCadence;
          break;
        case SportType.cycle:
          power = cycleWatt;
          cadence = cycleCadence;
          break;
        case SportType.swim:
          cadence = swimCadence;
          break;
        case SportType.row:
          power = rowingWatt;
          cadence = rowingCadence;
      }

      const checkLat = latitudeDegrees && parseFloat(latitudeDegrees) !== 100,
            checkLng = longitudeDegrees && parseFloat(longitudeDegrees) !== 100,
            alt = altitudeMeters || 0,
            pointTime = dayjs(startTimestamp + pointSecond * 1000).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      // if (checkLat && checkLng) {  // 暫不做座標是否有效的判斷
        content += `<trkpt lat="${latitudeDegrees}" lon="${longitudeDegrees}">
            <ele>${alt}</ele>
            <time>${pointTime}</time>
            <extensions>
              <gpxtpx:TrackPointExtension>
                <gpxtpx:hr>${heartRateBpm}</gpxtpx:hr>
                <gpxtpx:cad>${cadence}</gpxtpx:cad>
                <gpxtpx:distance>${distanceMeters}</gpxtpx:distance>
                <gpxtpx:atemp>${temp}</gpxtpx:atemp>
                <gpxtpx:power>${alt}</gpxtpx:power>
              </gpxtpx:TrackPointExtension>
            </extensions>
          </trkpt>
        `;
      // }

    });

    let gpxData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <gpx xmlns="${
        "http://www.topografix.com/GPX/1/1"
      }" xmlns:gpxtpx="${
        "http://www.gptfit.com"
      }" xmlns:xsi="${
        "http://www.w3.org/2001/XMLSchema-instance"
      }" xsi:schemaLocation="${
        "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
    }">
      <trk>
        <name>${dispName}</name>
        <trkseg>
          ${content}
        </trkseg>
      </trk>
    </gpx>
    `;

    return gpxData;
  }

  /**
   * 開啟圖片選擇器
   * @author kidin-1100817
   */
   openImgSelector() {
    this.uiFlag.openImgSelector = true;
  }

  /**
   * 關閉圖片選擇器
   * @param e {any}
   * @author kidin-1100817
   */
  closeSelector(e: any) {
    if (e.action === 'complete') {
      this.editImage.edited = true;
      this.editImage.origin = e.img.origin;
      this.editImage.base64 = e.img.base64;
      this.upLoadImg();
    }

    this.uiFlag.openImgSelector = null;
  }

  /**
   * 上傳圖片
   * @author kidin-1100817
   */
  upLoadImg() {
    const { edited, base64 } = this.editImage;
    if (edited) {
      let imgArr = [];
      const formData = new FormData(),
            { userId } = this.userProfile;
      formData.set('token', this.authService.token);
      formData.set('targetType', '1');
      // 個人icon
      if (base64 !== null) {
        const fileName = this.createFileName(imgArr.length, `${userId}`);
        imgArr.unshift({
          albumType: AlbumType.personalSportFile,
          fileNameFull: `${fileName}.jpg`,
          activityFileId: this.fileInfo.fileId
        })

        formData.append(
          'file',
          this.utils.base64ToFile(base64, fileName)
        );

      }

      formData.set('img', JSON.stringify(imgArr));
      this.sendImgUploadReq(formData);
    }

  }

  /**
   * 先送出api 8002刪除圖片後再送出api 8001上傳圖片
   * @param formData {FormData}-api所需資料
   * @param groupId {string}-group id
   * @author kidin-1100817
   */
  sendImgUploadReq(formData: FormData) {
    const { photo } = this.fileInfo;
    if (photo) {
      const delBody = {
        token: this.authService.token,
        targetType: 1,
        img: [{
          albumType: AlbumType.personalSportFile,
          activityFileId: this.fileInfo.fileId,
          fileNameFull: this.getPhotoName(photo)
        }]
      };

      this.imageUploadService.deleteImg(delBody).pipe(
        switchMap(resp => {
          const { resultCode, apiCode, resultMessage, processResult } = resp;
          if (!processResult || processResult.resultCode !== 200) {
            const errRes = processResult ? { processResult } : { resultCode, apiCode, resultMessage };
            return of(errRes).pipe(
              map(response => response)
            );
          } else {
            return this.imageUploadService.addImg(formData).pipe(
              map(response => response)
            );
          }

        })
      ).subscribe(res => {
        this.handleUploadRes(res);
      });

    } else {
      this.imageUploadService.addImg(formData).subscribe(res => {
        this.handleUploadRes(res);
      });

    }

  }

  /**
   * 
   * @param res 
   */
  handleUploadRes(res: any) {
    const { resultCode, apiCode, resultMessage, processResult, img } = res;
    if (!processResult) {
      console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
      this.snackBar.open(
        `${this.translate.instant('universal_popUpMessage_uploadFailed')}`,
        'OK',
        { duration: 2000 }
      );

    } else {
      const { resultCode, apiCode, resultMessage } = processResult;
      if (resultCode !== 200) {
        console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
        this.snackBar.open(
          `${this.translate.instant('universal_popUpMessage_uploadFailed')}`,
          'OK',
          { duration: 2000 }
        );
      } else {
        this.initImgSetting();
        const { url } = img[0],
              normalSizeUrl = url.replace('_128', '');
        this.fileInfo.photo = normalSizeUrl;
        this.sceneryImg = normalSizeUrl;
        this.snackBar.open(
          `${this.translate.instant('universal_popUpMessage_uploadSuccess')}`,
          'OK',
          { duration: 2000 }
        );

      }

    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 建立圖片名稱
   * @param length {number}-檔案序列
   * @param userId {string}-使用者id
   * @author kidin-1100817
   */
  createFileName(length: number, userId: string) {
    const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL),
          keyword = `${dayjs().valueOf().toString()}${length}${userId.split('-').join('')}`;
    return uuidv5(keyword, nameSpace);
  }

  /**
   * 將圖片設定初始化
   * @author kidin-1091201
   */
  initImgSetting() {
    this.editImage = {
      edited: false,
      origin: null,
      base64: null
    };

  }

  /**
   * 從url中取得file name
   * @param url {string}
   * @author kidin-1100817
   */
  getPhotoName(url: string) {
    const pathArr = url.split('/');
    return pathArr[pathArr.length - 1];
  }

  /**
   * 根據運動類別與使用者使用單位取得對應配速單位
   */
  getPaceUnit() {
    const sportType = +this.activityInfoLayer.type;
    const { unit } = this.userProfile;
    return getPaceUnit(sportType, unit);
  }

  /**
   * 切至前一個裝置資訊
   */
  switchPreviewDevice() {
    const { deviceInfo } = this.otherInfo;
    if (deviceInfo) {
      const { deviceIndex } = this.uiFlag;
      if (deviceIndex !== 0) this.uiFlag.deviceIndex--;
    }

  }

  /**
   * 切至下一個裝置資訊
   */
  switchNextDevice() {
    const { deviceInfo } = this.otherInfo;
    if (deviceInfo) {
      const { deviceIndex } = this.uiFlag;
      if (deviceIndex < deviceInfo.length - 1) this.uiFlag.deviceIndex++;
    }

  }

  /**
   * 切換至指定裝置資訊
   * @param index {number}-指定之裝置資訊序列
   */
  switchAssignDeviceInfo(index: number) {
    const { deviceIndex } = this.uiFlag;
    if (deviceIndex !== index) {
      this.uiFlag.deviceIndex = index;
    }

  }

  /**
   * 將相同的x軸的數據合併，並均化相對應的y軸數據
   * @param xData {Array<number>}-x軸數據
   * @param yData {Array<Array<number>>}-y軸數據
   * @author kidin-1100205
   */
  handleRepeatXAxis(
    xData: Array<number>, yData: Array<Array<number>>, handleList: Array<string>
  ): {xAxis: Array<number>, yAxis: object} {

    const finalData = {
            xAxis: [],
            yAxis: {}
          };
    let repeatTotal = {},
        repeatLen = 0;

    for (let i = 0, xAxisLen = xData.length; i < xAxisLen; i++) {

      // 當前x軸數據與前一項x軸數據相同時，將y軸數據相加
      if ((i === 0 || xData[i] === xData[i -1]) && i !== xAxisLen - 1) {

        if (i === 0) {
          handleList.forEach(_list => {
            if (yData[_list]) {
              Object.assign(finalData.yAxis, {[_list]: []});
              Object.assign(repeatTotal, {[_list]: yData[_list][0]});
            }
            
          });
        } else {
          handleList.forEach(_list => {
            if (yData[_list]) repeatTotal[_list] += yData[_list][i];
          });

        }

        repeatLen++;

      // 當前x軸數據與前一項x軸數據不同
      } else {

        if (repeatLen) {
          finalData.xAxis.push(xData[i - 1]);
          handleList.forEach(_list => {
            if (finalData.yAxis[_list]) finalData.yAxis[_list].push(+(repeatTotal[_list] / repeatLen).toFixed(1));
          });

        }
        
        if (i !== xAxisLen - 1) {
          handleList.forEach(_list => {
            if (yData[_list]) repeatTotal[_list] = yData[_list][i];
          });

          repeatLen = 1;
        } else {
          finalData.xAxis.push(xData[i]);
          handleList.forEach(_list => {
            if (finalData.yAxis[_list]) finalData.yAxis[_list].push(yData[_list][i]);
          });

        }

      }

    }

    return finalData;
  }

  /**
   * 取消rxjs訂閱，並將highchart卸除
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
