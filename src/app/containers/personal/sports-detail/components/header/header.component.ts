import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  Api2103Response,
  SportsFileInfo,
  ActivityInfo,
  ActivityLap,
  ActivityPoint,
} from '../../../../../core/models/api/api-21xx';
import {
  SportTypeIconPipe,
  WeekDayKeyPipe,
  SportTypePipe,
  ProductTypePipe,
} from '../../../../../core/pipes';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, fromEvent, of, merge } from 'rxjs';
import { takeUntil, debounceTime, tap, switchMap } from 'rxjs/operators';
import { getFileInfoParam } from '../../../../../core/utils';
import {
  AuthService,
  UserService,
  GlobalEventsService,
  Api10xxService,
  Api11xxService,
  Api70xxService,
} from '../../../../../core/services';
import { Api1010Response } from '../../../../../core/models/api/api-10xx';
import { Api1102Response } from '../../../../../core/models/api/api-11xx';
import { ProductInfo } from '../../../../../core/models/api/api-70xx';
import {
  professionalIconSubstitudePath,
  personalIconSubstitudePath,
  unknownDeviceImagePath,
  productsImageFolderPath,
} from '../../../../../core/models/const';
import { AccessRight } from '../../../../../core/enums/common';
import { LoadingMaskComponent } from '../../../../../components';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SportTypeIconPipe,
    WeekDayKeyPipe,
    SportTypePipe,
    ProductTypePipe,
    LoadingMaskComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnChanges, OnDestroy {
  private _ngUnsubscribe = new Subject();
  private _closeScription = new Subscription();

  /**
   * 基準檔案數據
   */
  @Input() file: Api2103Response;

  /**
   * 比較檔案數據ㄕ
   */
  @Input() compareFile: Api2103Response;

  /**
   * 是否為大螢幕尺寸
   */
  @Input() isLargeScreen = true;

  /**
   * 瀏覽器畫面寬度
   */
  screenSize = window.innerWidth;

  /**
   * 是否正在載入資訊
   */
  isLoading = false;

  /**
   * 是否顯示其他資訊
   */
  displayOtherInfo = false;

  /**
   * 現在顯示資訊的檔案Id
   */
  currentInfoFileId: number;

  /**
   * 課程詳細資料
   */
  classInfo?: Api1102Response;

  /**
   * 教練資訊
   */
  teacherInfo?: Api1010Response;

  /**
   * 裝置資訊
   */
  productInfo?: ProductInfo;

  /**
   * 裝置照片前置路徑
   */
  readonly productsImageFolderPath = productsImageFolderPath;

  /**
   * 系統權限
   */
  readonly AccessRight = AccessRight;

  /**
   * 組件唯一碼，
   * 用來即使點擊頁面取消冒泡的其他下拉選單元素而無法偵測到點擊事件，
   * 亦可再透過全域下拉事件取得組件唯一碼後觸發
   */
  private readonly componentId = this.globalEventsService.getComponentUniqueId();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private globalEventsService: GlobalEventsService,
    private api10xxService: Api10xxService,
    private api11xxService: Api11xxService,
    private api70xxService: Api70xxService
  ) {}

  /**
   * 取得檔案持有人名稱
   */
  get author() {
    return this.file?.fileInfo.author.split('?')[0];
  }

  /**
   * 取得比較檔案持有人名稱
   */
  get compareAuthor() {
    return this.compareFile?.fileInfo.author.split('?')[0];
  }

  /**
   * 取得系統權限
   */
  get systemAccessRight() {
    return this.userService.getUser().systemAccessright;
  }

  /**
   * 取得活動開始日期與時間
   */
  get startDateTime() {
    return this.file?.activityInfoLayer.startTime;
  }

  /**
   * 取得活動開始日期
   */
  get startDate() {
    return this.startDateTime.split('T')[0];
  }

  /**
   * 取得活動開始時間(HH:mm)
   */
  get startTime() {
    return this.startDateTime.split('T')[1].slice(0, 5);
  }

  /**
   * 取得比較活動開始日期
   */
  get compareStartDate() {
    return this.compareFile?.activityInfoLayer.startTime.split('T')[0];
  }

  /**
   * 取得課程所屬父群組
   */
  get classRoot() {
    const [, , brand, branch] = (this.classInfo as Api1102Response).info.groupRootInfo;
    return `${brand.brandName}/${branch.branchName}`;
  }

  ngOnInit() {
    this.subscribeResizeEvent();
  }

  ngOnChanges(): void {}

  /**
   * 訂閱視窗寬度大小改變事件
   */
  subscribeResizeEvent() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(100), takeUntil(this._ngUnsubscribe))
      .subscribe(() => {
        this.screenSize = window.innerWidth;
      });
  }

  /**
   * 處理群組照片載入錯誤事件
   * @param e 錯誤事件
   */
  handleGroupIconError(e: ErrorEvent) {
    (e.target as any).src = professionalIconSubstitudePath;
  }

  /**
   * 處理個人照片載入錯誤事件
   * @param e 錯誤事件
   */
  handleUserIconError(e: ErrorEvent) {
    (e.target as any).src = personalIconSubstitudePath;
  }

  /**
   * 處理裝置照片載入錯誤事件
   * @param e 錯誤事件
   */
  handleProductImageError(e: ErrorEvent) {
    (e.target as any).src = unknownDeviceImagePath;
  }

  /**
   * 顯示檔案其他資訊
   */
  showOtherInfo(isCompareFile = false) {
    this.displayOtherInfo = true;
    const file = isCompareFile ? this.compareFile : this.file;
    const { fileId } = file.fileInfo;
    if (fileId !== this.currentInfoFileId) {
      this.isLoading = true;
      this.initInfo();
      this.currentInfoFileId = fileId;

      const { class: groupClass, teacher, equipmentSN } = file.fileInfo;
      of('')
        .pipe(
          switchMap(() => (groupClass ? this.getClassInfo(groupClass) : of(''))),
          switchMap(() => (teacher ? this.getTeacherInfo(teacher) : of(''))),
          switchMap(() => (equipmentSN.length !== 0 ? this.getProductInfo(equipmentSN) : of('')))
        )
        .subscribe(() => {
          this.isLoading = false;
        });
    }

    this.globalEventsService.setRxCloseDropList(this.componentId);
    this.subscribeCloseEvent();
  }

  /**
   * 初始化已儲存的資訊
   */
  initInfo() {
    this.classInfo = undefined;
    this.teacherInfo = undefined;
    this.productInfo = undefined;
  }

  /**
   * 取得課程相關資訊
   * @param nameId 課程名稱與id
   */
  getClassInfo(nameId: string) {
    const { origin, groupId } = getFileInfoParam(nameId);
    const id = groupId ?? origin;

    // 確認是否抓到正確的groupId
    if (id.includes('-')) {
      const body = {
        token: this.authService.token,
        groupId,
        avatarType: 3,
        findRoot: 1,
      };
      return this.api11xxService.fetchGroupListDetail(body).pipe(
        tap((res) => {
          this.classInfo = res;
        })
      );
    }

    return of('');
  }

  /**
   * 取得教練資訊
   * @param nameId 教練名稱與id
   */
  getTeacherInfo(nameId: string) {
    const { userId } = getFileInfoParam(nameId);
    if (userId) {
      const body = {
        token: this.authService.token,
        targetUserId: [userId],
      };
      return this.api10xxService.fetchGetUserProfile(body).pipe(
        tap((res) => {
          this.teacherInfo = res;
        })
      );
    }

    return of('');
  }

  /**
   * 取得裝置資訊
   * @param list 裝置序號清單
   */
  getProductInfo(list: Array<string>) {
    const body = {
      token: this.authService.token,
      queryType: 1,
      queryArray: list,
    };

    return this.api70xxService.fetchGetProductInfo(body).pipe(
      tap((res) => {
        this.productInfo = res?.info?.productInfo;
      })
    );
  }

  /**
   * 訂閱全域點擊事件及其他下拉事件以關閉下拉資訊
   */
  subscribeCloseEvent() {
    const clickEvent = fromEvent(window, 'click');
    this._closeScription = merge(clickEvent, this.globalEventsService.getRxCloseDropList())
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((id) => {
        if (id !== this.componentId) this.closeOtherInfo();
      });
  }

  /**
   * 關閉其他資訊
   */
  closeOtherInfo() {
    this.displayOtherInfo = false;
    if (this._closeScription) this._closeScription.unsubscribe();
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this._ngUnsubscribe.next(null);
    this._ngUnsubscribe.complete();
  }
}
