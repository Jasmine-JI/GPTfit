import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import dayjs from 'dayjs';
import { AlaApp } from '../../../../core/enums/common/app-id.enum';
import { InnerSystemService } from '../../services/inner-system.service';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { MatDialog } from '@angular/material/dialog';
import { Api10xxService, AuthService, ApiCommonService } from '../../../../core/services';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { SelectDate } from '../../../../core/models/common';
import { AppIdPipe } from '../../../../core/pipes/app-id.pipe';
import { DateRangePickerComponent } from '../../../../shared/components/date-range-picker/date-range-picker.component';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { LoadingBarComponent } from '../../../../components/loading-bar/loading-bar.component';

type Serverity = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
type TargetType = 'user' | 'equipment';
const apiDateFormat = 'YYYY-MM-DD HH:mm:ss';

@Component({
  selector: 'app-system-log',
  templateUrl: './system-log.component.html',
  styleUrls: ['./system-log.component.scss'],
  standalone: true,
  imports: [
    LoadingBarComponent,
    NgIf,
    FormsModule,
    DateRangePickerComponent,
    MatPaginatorModule,
    NgFor,
    AppIdPipe,
  ],
})
export class SystemLogComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  clickSubscription: Subscription;

  @ViewChild('paginatorA', { static: true }) paginatorA: MatPaginator;
  @ViewChild('paginatorB', { static: true }) paginatorB: MatPaginator;

  /**
   * ui上會用到的各個flag
   */
  uiFlag = {
    notChoiceTarget: false,
    showServeritySelector: false,
    showAppSelector: false,
    targetType: <TargetType>'user',
    currentTargetType: <TargetType>'user',
  };

  /**
   * 搜尋條件
   */
  searchCondition = {
    token: this.authService.token,
    targetUserId: <number>null,
    targetEquipmentSN: <string>null,
    serverity: <Serverity>null,
    appId: <AlaApp>null,
    apiCode: <string>null,
    startTime: dayjs().subtract(3, 'month').format(apiDateFormat),
    endTime: dayjs().format(apiDateFormat),
    page: 0,
    pageCounts: 30,
  };

  /**
   * 日期顯示和暫存用
   */
  selectedDate = {
    startTimeStamp: dayjs().subtract(3, 'month').valueOf(),
    endTimeStamp: dayjs().valueOf(),
    startDate: null,
    endDate: null,
  };

  /**
   * 目標使用者
   */
  targetUser = {
    id: null,
    name: null,
    account: null,
  };

  progress = 100;
  sysLog: Array<any>;
  currentPage: PageEvent;
  totalCounts = 0;
  readonly AlaApp = AlaApp;

  constructor(
    private apiCommonService: ApiCommonService,
    private innerSystemService: InnerSystemService,
    private dialog: MatDialog,
    private api10xxService: Api10xxService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscribePageChange();
  }

  subscribePageChange() {
    // 分頁切換時，重新取得資料
    this.paginatorA.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.searchCondition.page = this.currentPage.pageIndex;
      this.searchCondition.pageCounts = this.currentPage.pageSize;
      this.submit(false);
    });

    // 分頁切換時，重新取得資料
    this.paginatorB.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.searchCondition.page = this.currentPage.pageIndex;
      this.searchCondition.pageCounts = this.currentPage.pageSize;
      this.submit(false);
    });
  }

  /**
   * 根據類別開啟選擇器頁面
   * @param type {number}- 1: userId 2:帳號
   * @param e {MouseEvent}
   * @author kidin-1100303
   */
  openSelectorWin(type: number, e: MouseEvent): void {
    const adminLists = [];
    e.preventDefault();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `人員選擇`,
        type,
        adminLists,
        onConfirm: this.targetConfirm.bind(this),
        isInnerAdmin: true,
      },
    });
  }

  /**
   * 若手動輸入user id，則將其餘資訊初始化
   * @param e {Event}
   * @author kidin-1100303
   */
  changeUserId(e: Event) {
    this.targetUser.id = (e as any).target.value;
    if (this.targetUser.id.trim().length !== 0) {
      const body = {
        token: this.authService.token,
        targetUserId: this.targetUser.id,
      };

      this.api10xxService.fetchGetUserProfile(body).subscribe((res) => {
        if (res.processResult && res.processResult.resultCode === 200) {
          this.targetUser.name = res.userProfile.nickname;
          this.targetUser.account = null;
        } else {
          const result = res.processResult ?? res;
          this.apiCommonService.handleError(
            result.resultCode,
            result.apiCode,
            result.resultMessage
          );
        }
      });
    } else {
      this.targetUser.name = null;
      this.targetUser.account = null;
    }
  }

  /**
   * 儲存使用者
   * @param _lists {array}
   * @author kidin-1100303
   */
  targetConfirm(type: number, _lists: Array<any>): void {
    if (type === 1) {
      const userInfo = _lists[0];
      this.targetUser = {
        id: userInfo.userId,
        name: userInfo.userName,
        account: null,
      };
    } else {
      const userInfo = _lists[0];
      this.targetUser = {
        id: userInfo.user_id,
        name: userInfo.login_acc,
        account: userInfo.e_mail || userInfo.phone,
      };
    }
  }

  /**
   * 變更目標類別
   * @author kidin-1100413
   */
  changeTargetType() {
    this.initTarget();
    this.uiFlag.targetType = this.uiFlag.targetType === 'user' ? 'equipment' : 'user';
  }

  /**
   * 顯示serverity的下拉式選單
   * @param e {MouseEvent}
   * @author kidin-1100303
   */
  showServeritySelector(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showAppSelector = false;
    if (this.uiFlag.showServeritySelector) {
      this.uiFlag.showServeritySelector = false;
      this.clickUnsubscribe();
    } else {
      this.uiFlag.showServeritySelector = true;
      this.clickSubscribe();
    }
  }

  /**
   * 顯示下拉式選單
   * @param e {MouseEvent}
   * @author kidin-1100303
   */
  showAppSelector(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.showServeritySelector = false;
    if (this.uiFlag.showAppSelector) {
      this.uiFlag.showAppSelector = false;
      this.clickUnsubscribe();
    } else {
      this.uiFlag.showAppSelector = true;
      this.clickSubscribe();
    }
  }

  /**
   * 全域監聽click事件
   * @author kidin-1100303
   */
  clickSubscribe() {
    const clickEvent = fromEvent(document, 'click');
    this.clickSubscription = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.clickUnsubscribe();
    });
  }

  /**
   * 解除監聽click事件
   * @author kidin-1100303
   */
  clickUnsubscribe() {
    this.uiFlag.showServeritySelector = false;
    this.uiFlag.showAppSelector = false;
    this.clickSubscription.unsubscribe();
  }

  /**
   * 儲存使用者所選日誌類別
   * @param e {MouseEvent}
   * @param serverity {Serverity}
   * @author kidin-1100303
   */
  saveServerity(e: MouseEvent, serverity: Serverity) {
    e.stopPropagation();
    this.searchCondition.serverity = serverity;
    this.clickUnsubscribe();
  }

  /**
   * 儲存使用者所選app id
   * @param e {MouseEvent}
   * @param id {AlaApp}
   * @author kidin-1100303
   */
  saveAppId(e: MouseEvent, id: AlaApp) {
    e.stopPropagation();
    this.searchCondition.appId = id;
    this.clickUnsubscribe();
  }

  /**
   * 儲存使用者所選日期
   * @param e {SelectDate}
   * @author kidin-1103030
   */
  saveDate(e: SelectDate) {
    this.selectedDate.startDate = e.startDate;
    this.selectedDate.endDate = e.endDate;
  }

  /**
   * 送出搜尋
   * @author kidin-1100303
   */
  submit(initPage = true) {
    if (initPage) {
      this.searchCondition.page = 0;
      if (this.currentPage) {
        this.currentPage.pageIndex = 0;
      }
    }

    const { targetType } = this.uiFlag;
    if (
      (targetType === 'user' && this.targetUser.id) ||
      (targetType === 'equipment' && this.searchCondition.targetEquipmentSN)
    ) {
      this.progress = 0;
      this.uiFlag.notChoiceTarget = false;
      this.searchCondition.targetUserId = targetType === 'user' ? +this.targetUser.id : null;
      this.searchCondition.startTime = dayjs(this.selectedDate.startDate).format(apiDateFormat);
      this.searchCondition.endTime = dayjs(this.selectedDate.endDate).format(apiDateFormat);
      const body = {};
      for (const key in this.searchCondition) {
        if (Object.prototype.hasOwnProperty.call(this.searchCondition, key)) {
          const value = this.searchCondition[key];
          if (value !== null && (typeof value === 'number' || value.trim().length !== 0)) {
            Object.assign(body, { [key]: value });
          }
        }
      }

      this.progress = 30;
      this.innerSystemService.getSystemLog(body).subscribe((res) => {
        if (res.resultCode === 200) {
          this.sysLog = res.info.content;
          this.totalCounts = res.info.totalCounts;
          this.uiFlag.currentTargetType = this.uiFlag.targetType;
        } else {
          this.totalCounts = 0;
          this.apiCommonService.handleError(res.resultCode, res.apiCode, res.resultMessage);
        }

        this.progress = 100;
      });
    } else {
      this.uiFlag.notChoiceTarget = true;
    }
  }

  /**
   * 初始化條件
   * @author kidin-1100303
   */
  initCondition() {
    this.searchCondition = {
      token: this.authService.token,
      targetUserId: <number>null,
      targetEquipmentSN: <string>null,
      serverity: <Serverity>null,
      appId: <AlaApp>null,
      apiCode: <string>null,
      startTime: dayjs().subtract(3, 'month').format(apiDateFormat),
      endTime: dayjs().format(apiDateFormat),
      page: 0,
      pageCounts: 30,
    };

    this.selectedDate = {
      startTimeStamp: dayjs().subtract(3, 'month').valueOf(),
      endTimeStamp: dayjs().valueOf(),
      startDate: null,
      endDate: null,
    };

    this.targetUser = {
      id: null,
      name: null,
      account: null,
    };
  }

  /**
   * 初始化查詢目標
   * @author kidin-1100413
   */
  initTarget() {
    this.targetUser = {
      id: null,
      name: null,
      account: null,
    };

    this.searchCondition.targetEquipmentSN = null;
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1090722
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
