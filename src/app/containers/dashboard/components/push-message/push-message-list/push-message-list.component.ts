import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService, NodejsApiService, AuthService } from '../../../../../core/services';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { PushMessageService } from '../../../services/push-message.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import dayjs from 'dayjs';
import { AccessRight } from '../../../../../core/enums/common';
import { appPath } from '../../../../../app-path.const';
import { QueryString } from '../../../../../core/enums/common';

@Component({
  selector: 'app-push-message-list',
  templateUrl: './push-message-list.component.html',
  styleUrls: ['./push-message-list.component.scss'],
})
export class PushMessageListComponent implements OnInit, OnDestroy {
  @ViewChild('paginator', { static: true })
  paginator: MatPaginator;
  ngUnsubscribe = new Subject();
  timeout: any;

  uiFlag = {
    isTableLoading: false,
    noTableData: true,
    cancelIndex: null,
    totalCount: 0,
    haveReservation: false,
  };

  pushCondition = ['地區', '系統', '應用', '群組', '會員'];
  currentTime = dayjs().valueOf();
  filterCondition = {
    startTimeStamp: dayjs().subtract(6, 'month').valueOf(),
    endTimeStamp: dayjs().subtract(-6, 'month').valueOf(),
    pushState: [],
    countryRegion: [],
    system: [],
    app: [],
    groupId: [],
    userId: [],
  };

  systemAccessright = this.userService.getUser().systemAccessright;

  req = {
    token: this.authService.token,
    filter: {},
    page: {
      index: 1,
      counts: 10,
    },
  };

  res: Array<any> = [];
  totalCount: number;
  currentPage: PageEvent;
  pushList: any;

  readonly AccessRight = AccessRight;
  readonly createPushLink = `/${appPath.dashboard.home}/${appPath.adminManage.home}/${appPath.adminManage.createPush}`;

  constructor(
    private pushMessageService: PushMessageService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private router: Router,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkCurrentPage();
    this.getPushMessage();
    this.createClock();
  }

  /**
   * 確認當前分頁
   */
  checkCurrentPage() {
    this.currentPage = {
      pageIndex: 0,
      pageSize: 10,
      length: null,
    };

    // 分頁切換時，重新取得資料
    this.paginator.page.pipe(takeUntil(this.ngUnsubscribe)).subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getPushMessage();
    });
  }

  /**
   * 刷新列表
   * @author kidin-1090922
   */
  refreshList() {
    this.getPushMessage();
  }

  /**
   * 取得訊息列表
   */
  getPushMessage() {
    this.uiFlag.isTableLoading = true;

    for (const key in this.filterCondition) {
      if (Object.prototype.hasOwnProperty.call(this.filterCondition, key)) {
        if (this.filterCondition[key].length !== 0) {
          Object.assign(this.req.filter, { [key]: this.filterCondition[key] / 1000 });
        }
      }
    }

    this.req.page.index = this.currentPage.pageIndex;
    this.req.page.counts = this.currentPage.pageSize;

    this.pushMessageService
      .getPushMessageList(this.req)
      .pipe(
        switchMap((res) => {
          if (res.processResult.resultCode !== 200) {
            console.error(`${res.processResult.apiCode}：${res.processResult.apiReturnMessage}`);
          } else {
            // 取得發送者暱稱
            const userIdArr = [];
            res.notificationList.forEach((_list) => {
              userIdArr.push(_list.createUser);
            });

            const body = {
              userIdList: userIdArr,
            };

            return this.nodejsApiService.getUserList(body).pipe(
              map((resp) => {
                if (resp.resultCode !== 200) {
                  console.error(`${resp.apiCode}：${resp.resultMessage}`);
                } else {
                  resp.nickname.forEach((_user, index) => {
                    Object.assign(res.notificationList[index], { creatorName: _user.nickname });
                  });
                }

                return res;
              })
            );
          }
        })
      )
      .subscribe((response) => {
        this.res = (response as any).notificationList;
        this.uiFlag.totalCount = (response as any).page.totalCounts;

        if (this.uiFlag.totalCount === 0) {
          this.uiFlag.noTableData = true;
        } else {
          this.uiFlag.noTableData = false;
        }

        this.uiFlag.isTableLoading = false;
        this.checkHaveReservation();
      });
  }

  /**
   * 確認是否有未發送的推播
   */
  checkHaveReservation() {
    this.uiFlag.haveReservation = false;
    for (let i = 0; i < this.res.length; i++) {
      if (this.res[i].pushStatus === 1 && this.res[i].pushTimeStamp > dayjs().unix()) {
        this.uiFlag.haveReservation = true;
        break;
      }
    }
  }

  /**
   * 建立時鐘，若有預約中的推播並且到了推播發送時間時，自動刷新列表
   */
  createClock() {
    this.timeout = setTimeout(() => {
      this.currentTime = this.currentTime + 1000;

      if (this.uiFlag.haveReservation) {
        this.checkPushTime();
      }

      this.createClock();
    }, 1000);
  }

  /**
   * 確認現在時間是否到了推播發送時間，已到時間則刷新列表
   */
  checkPushTime() {
    for (let i = 0; i < this.res.length; i++) {
      if (
        dayjs(this.res[i].pushTimeStamp * 1000).format('YYYYMMDDHHmmss') ===
        dayjs(this.currentTime).format('YYYYMMDDHHmmss')
      ) {
        this.getPushMessage();
        break;
      }
    }
  }

  /**
   * 取得選取的時間
   * @param e {event}
   */
  getSelectDate(e: any) {
    this.filterCondition.startTimeStamp = dayjs(e.startDate).valueOf();
    this.filterCondition.endTimeStamp = dayjs(e.endDate).valueOf();
  }

  /**
   * 確認是否取消推播
   * @event click
   * @param e {KeyboardEvent}
   * @param index {number}
   */
  checkCancelPush(e: KeyboardEvent, index: number) {
    e.stopPropagation();
    this.uiFlag.cancelIndex = index;
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: '取消預約發送',
        body: `是否取消預約此訊息？<br>${dayjs(this.res[index].pushTimeStamp * 1000).format(
          'YYYY-MM-DD HH:mm:ss'
        )}<br>標題：${this.res[index].title}`,
        jusCon: 'space-between',
        confirmText: '確定取消發送',
        cancelText: '關閉',
        onConfirm: this.cancelPush.bind(this),
      },
    });
  }

  /**
   * 取消未發送的推播
   */
  cancelPush() {
    const body = {
      token: this.authService.token,
      pushNotifyId: [this.res[this.uiFlag.cancelIndex].pushNotifyId],
    };

    this.pushMessageService.cancelPushMessage(body).subscribe((res) => {
      if (res.processResult.resultCode !== 200) {
        console.error(`${res.processResult.apiCode}：${res.processResult.apiReturnMessage}`);
      } else {
        this.snackbar.open('已取消發送', 'OK', { duration: 2000 });
        setTimeout(() => {
          this.getPushMessage();
        }, 2000);
      }
    });
  }

  /**
   * 導向該則推播
   * @param index {number}
   */
  navigatePushDetail(index: number) {
    const { dashboard, adminManage } = appPath;
    this.router.navigateByUrl(
      `/${dashboard.home}/${adminManage.home}/${adminManage.pushDetail}?${QueryString.pushId}=${this.res[index].pushNotifyId}`
    );
  }

  /**
   * 取消訂閱和clearTimeout
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
    clearTimeout(this.timeout);
  }
}
