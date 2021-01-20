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

const errMsg = `Error! Please try again later.`;
type DisplayTag = 'summary' | 'detail' | 'segmentation' | 'chart';

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
    showQuadrantOpt: false,
    showChartOpt: false,
    pcView: true,
    currentTag: <DisplayTag>'detail',
    tagChanged: false,
    resolution: 1
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

  fileTime: string;
  sceneryImg: string;
  pageResize: Subscription;
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
        fileId: this.fileInfo.fileId
      };

    } else {
      body = {
        token: this.utils.getToken(),
        fileId: this.fileInfo.fileId,
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
    this.handleSceneryImg(+this.activityInfoLayer.type, +this.activityInfoLayer.subtype);
    this.activityLapLayer = data.activityLapLayer;
    this.getOtherInfo(this.fileInfo);
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
      'moveRepetitions'
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
   * 取消rxjs訂閱，並將highchart卸除
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
