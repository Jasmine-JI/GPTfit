import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../people-selector-win/people-selector-win.component';
import cloneDeep from 'lodash/cloneDeep';
import { UserService, NodejsApiService } from '../../../../core/services';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccessRight } from '../../../../shared/enum/accessright';

@Component({
  selector: 'app-inner-settings',
  templateUrl: './inner-settings.component.html',
  styleUrls: ['./inner-settings.component.scss'],
})
export class InnerSettingsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  systemDevelopers = [];
  systemMaintainers = [];
  systemAuditor = [];
  systemPushners = [];
  marketingDevelopers = [];
  isLoading = false;
  userId: number;
  maxAccessRight: number;
  chooseType: number;
  readonly AccessRight = AccessRight;

  constructor(
    private dialog: MatDialog,
    private nodejsApiService: NodejsApiService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.fetchInnerAdmin();
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const { userId, systemAccessright } = this.userService.getUser();
        this.userId = userId;
        this.maxAccessRight = systemAccessright;
      });
  }

  fetchInnerAdmin() {
    this.nodejsApiService.getInnerAdmin().subscribe((_result) => {
      this.isLoading = false;
      const isCanUse = _result.findIndex((_res) => _res.userId === this.userId) > -1;
      if (isCanUse) {
        this.systemDevelopers = _result.filter((_res) => _res.accessRight == AccessRight.god);
        this.systemMaintainers = _result.filter(
          (_res) => _res.accessRight == AccessRight.maintainer
        );
        this.systemAuditor = _result.filter((_res) => _res.accessRight == AccessRight.auditor);
        this.systemPushners = _result.filter((_res) => _res.accessRight == AccessRight.pusher);
        this.marketingDevelopers = _result.filter(
          (_res) => _res.accessRight == AccessRight.marketing
        );
      }
    });
  }

  handleConfirm(type, _lists) {
    const userIds = _lists.map((_list) => _list.userId);
    this.isLoading = true;
    const body = { targetRight: this.chooseType, userIds };
    this.nodejsApiService.updateInnerAdmin(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.fetchInnerAdmin();
        this.dialog.closeAll();
      } else {
        this.router.navigateByUrl(`/403`);
      }
    });
  }

  openSelectorWin(_type: number) {
    let targetAdminName = '';
    let adminLists = [];
    let isCanOpen = false;
    this.chooseType = _type;

    switch (_type) {
      case AccessRight.god:
        targetAdminName = `系統開發員(${_type})`;
        adminLists = cloneDeep(this.systemDevelopers); // 深拷貝，避免win修改先影響settings table
        isCanOpen = this.maxAccessRight === AccessRight.god;
        break;
      case AccessRight.maintainer:
        targetAdminName = `系統維護員(${_type})`;
        adminLists = cloneDeep(this.systemMaintainers);
        isCanOpen = this.maxAccessRight <= AccessRight.maintainer;
        break;
      case AccessRight.auditor:
        targetAdminName = `系統審核員(${_type})`;
        adminLists = cloneDeep(this.systemAuditor);
        isCanOpen = this.maxAccessRight === AccessRight.god;
        break;
      case AccessRight.pusher:
        targetAdminName = `系統推播員(${_type})`;
        adminLists = cloneDeep(this.systemPushners);
        isCanOpen = this.maxAccessRight === AccessRight.god;
        break;
      case AccessRight.marketing:
        targetAdminName = `系統行銷企劃員(${_type})`;
        adminLists = cloneDeep(this.marketingDevelopers);
        isCanOpen = this.maxAccessRight <= AccessRight.maintainer;
        break;
    }

    if (isCanOpen) {
      this.dialog.open(PeopleSelectorWinComponent, {
        hasBackdrop: true,
        data: {
          title: `${targetAdminName}選擇設定`,
          adminLevel: `${_type}`,
          adminLists,
          type: 1,
          onConfirm: this.handleConfirm.bind(this),
          isInnerAdmin: this.maxAccessRight < AccessRight.marketing,
        },
      });
    } else {
      this.dialog.open(MsgDialogComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: '您的權限不足，請跟系統相關管理者聯繫',
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
