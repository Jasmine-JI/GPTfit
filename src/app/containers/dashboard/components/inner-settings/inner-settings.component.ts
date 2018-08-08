import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InnerSelectorWinComponent } from '../inner-selector-win/inner-selector-win.component';
import { GroupService } from '../../services/group.service';
import * as _ from 'lodash';
import { UserInfoService } from '../../services/userInfo.service';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';

@Component({
  selector: 'app-inner-settings',
  templateUrl: './inner-settings.component.html',
  styleUrls: ['./inner-settings.component.css']
})
export class InnerSettingsComponent implements OnInit {
  systemDevelopers = [];
  systemMaintainers = [];
  marketingDevelopers = [];
  role = {
    isSupervisor: false,
    isSystemDeveloper: false,
    isSystemMaintainer: false,
    isMarketingDeveloper: false
  };
  userId: number;
  constructor(
    private dialog: MatDialog,
    private groupService: GroupService,
    private userInfoService: UserInfoService
  ) { }

  ngOnInit() {
    this.groupService.getInnerAdmin().subscribe(_result => {
      this.systemDevelopers = _result.filter(_res => _res.accessRight === '10');
      this.systemMaintainers = _result.filter(_res => _res.accessRight === '20');
      this.marketingDevelopers = _result.filter(_res => _res.accessRight === '29');
    });
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.role.isSupervisor = res;
      console.log('%c this.isSupervisor', 'color: #ccc', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.role.isSystemDeveloper = res;
      console.log('%c this.isSystemDeveloper', 'color: #ccc', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.role.isSystemMaintainer = res;
      console.log('%c this.isSystemMaintainer', 'color: #ccc', res);
    });
    this.userInfoService.getMarketingDeveloperStatus().subscribe(res => {
      this.role.isMarketingDeveloper = res;
      console.log('%c this.isMarketingDeveloper', 'color: #ccc', res);
    });
    this.userInfoService.getUserId().subscribe(res => this.userId = res);
  }
  handleConfirm() {
    this.groupService.getInnerAdmin().subscribe(_result => {
      const isCanUse = _result.findIndex(_res => _res.userId === this.userId) > -1;
      if (isCanUse) {
        this.systemDevelopers = _result.filter(_res => _res.accessRight === '10');
        this.systemMaintainers = _result.filter(_res => _res.accessRight === '20');
        this.marketingDevelopers = _result.filter(_res => _res.accessRight === '29');
      } else {
        location.href = '/dashboard';
      }
    });
  }
  openSelectorWin(_type: number) {
    let targetAdminName = '';
    let adminLists = [];
    let isCanOpen = false;
    const {
      isSupervisor,
      isSystemDeveloper,
      isSystemMaintainer,
      isMarketingDeveloper
    } = this.role;
    if (_type === 10) {
      targetAdminName = '系統開發員(10)';
      adminLists = _.cloneDeep(this.systemDevelopers); // 深拷貝，避免win修改先影響settings table
      isCanOpen = (isSupervisor || isSystemDeveloper) ? true : false;
    } else if (_type === 20) {
      targetAdminName = '系統維護員(20)';
      adminLists = _.cloneDeep(this.systemMaintainers); // 深拷貝，避免win修改先影響settings table
      isCanOpen = (isSupervisor || isSystemDeveloper || isSystemMaintainer) ? true : false;
    } else {
      targetAdminName = '行銷與企劃員(29)';
      adminLists = _.cloneDeep(this.marketingDevelopers); // 深拷貝，避免win修改先影響settings table
      isCanOpen = (isSupervisor || isSystemDeveloper || isSystemMaintainer || isMarketingDeveloper) ? true : false;
    }
    if (isCanOpen) {
      this.dialog.open(InnerSelectorWinComponent, {
        hasBackdrop: true,
        data: {
          title: `${targetAdminName}選擇設定`,
          adminLevel: `${_type}`,
          adminLists,
          onConfirm: this.handleConfirm.bind(this)
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
}
