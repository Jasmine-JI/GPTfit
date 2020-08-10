import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../people-selector-win/people-selector-win.component';
import { GroupService } from '../../services/group.service';
import * as _ from 'lodash';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inner-settings',
  templateUrl: './inner-settings.component.html',
  styleUrls: ['./inner-settings.component.css']
})
export class InnerSettingsComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  systemDevelopers = [];
  systemMaintainers = [];
  marketingDevelopers = [];
  isLoading = false;
  userId: number;
  maxAccessRight: number;
  chooseType: number;
  constructor(
    private dialog: MatDialog,
    private groupService: GroupService,
    private router: Router,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    this.fetchInnerAdmin();
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userId = res['userId'];
      this.maxAccessRight = res['systemAccessRight'][0];
    });
  }

  fetchInnerAdmin() {
    this.groupService.getInnerAdmin().subscribe(_result => {
      this.isLoading = false;
      const isCanUse =
        _result.findIndex(_res => _res.userId === this.userId) > -1;
      if (isCanUse) {
        this.systemDevelopers = _result.filter(
          _res => _res.accessRight === '10'
        );
        this.systemMaintainers = _result.filter(
          _res => _res.accessRight === '20'
        );
        this.marketingDevelopers = _result.filter(
          _res => _res.accessRight === '29'
        );
      }

    });

  }

  handleConfirm(type, _lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.isLoading = true;
    const body = { targetRight: this.chooseType, userIds };
    this.groupService.updateInnerAdmin(body).subscribe(res => {
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

    if (_type === 10) {
      targetAdminName = '系統開發員(10)';
      adminLists = _.cloneDeep(this.systemDevelopers); // 深拷貝，避免win修改先影響settings table
      isCanOpen = this.maxAccessRight < 20 ? true : false;
    } else if (_type === 20) {
      targetAdminName = '系統維護員(20)';
      adminLists = _.cloneDeep(this.systemMaintainers); // 深拷貝，避免win修改先影響settings table
      isCanOpen = this.maxAccessRight < 20 ? true : false;
    } else {
      targetAdminName = '行銷與企劃員(29)';
      adminLists = _.cloneDeep(this.marketingDevelopers); // 深拷貝，避免win修改先影響settings table
      isCanOpen = this.maxAccessRight < 30 ? true
          : false;
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
          isInnerAdmin: this.maxAccessRight < 30 ? true : false
        }
      });
    } else {
      this.dialog.open(MsgDialogComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: '您的權限不足，請跟系統相關管理者聯繫'
        }

      });

    }

  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
