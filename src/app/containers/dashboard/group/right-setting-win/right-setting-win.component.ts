import { Component, OnInit, Inject, EventEmitter, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

@Component({
  selector: 'app-right-setting-win',
  templateUrl: './right-setting-win.component.html',
  styleUrls: ['./right-setting-win.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RightSettingWinComponent implements OnInit {
  onConfirm = new EventEmitter();
  searchWord = '';
  placeholder = '搜尋';
  chooseItem = '';
  token: string;
  subGroupInfo: any;
  subBrandInfo: any;
  subBranchInfo: any;
  subCoachInfo: any;
  dispalyCoachInfo: any;
  chooseGroupId: string;
  chooseGroupName: string;
  manageType: string; // 30: brand, 40: branch, 60: coach
  get name() {
    return this.data.name;
  }

  get body() {
    return this.data.body;
  }

  get groupId() {
    return this.data.groupId;
  }
  get userId() {
    return this.data.userId;
  }
  get onChange() {
    return this.data.onDelete;
  }
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private groupService: GroupService,
    private utils: UtilsService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.token = this.utils.getToken();
    this.getGroupMemberList(1);
  }
  confirm() {
    this.onConfirm.emit();
    if (this.chooseItem !== '') {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: `是否要指派${this.name}為${this.chooseGroupName}的管理員`,
          confirmText: '確定',
          cancelText: '取消',
          onConfirm: this.handleConfirm.bind(this)
        }
      });
    }
  }
  handleConfirm() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      accessRight: this.manageType
    };
    if (this.groupId !== this.chooseGroupId) {
      body.groupId = this.chooseGroupId;
      this.groupService.addGroupMember(body).subscribe(res => {
        if (res.resultCode === 200) {
          this.groupService.editGroupMember(body).subscribe(response => {
            if (response.resultCode === 200) {
              this.dialog.closeAll();
            }
          });
        }
      });
    } else {
      this.groupService.editGroupMember(body).subscribe(res => {
        if (res.resultCode === 200) {
          this.dialog.closeAll();
        }
      });
    }
  }
  handlechooseBrandItem(item: string, id: string, name: string) {
    this.chooseGroupId = id;
    this.chooseGroupName = name;
    this.manageType = '30';
    if (item === this.chooseItem) {
      this.chooseItem = '';
    } else {
      this.chooseItem = item;
    }
  }
  handlechooseBranchItem(item: string, id: string, name: string) {
    this.chooseGroupId = id;
    this.chooseGroupName = name;
    this.manageType = '40';
    if (item === this.chooseItem) {
      this.chooseItem = '';
    } else {
      this.chooseItem = item;
    }
    this.dispalyCoachInfo = this.subCoachInfo.filter(
      _info => _info.groupId.slice(0, 7) === this.chooseGroupId.slice(0, 7)
    );
  }
  handlechooseLessonItem(item: string, id: string, name: string) {
    this.chooseGroupId = id;
    this.chooseGroupName = name;
    this.manageType = '60';
    if (item === this.chooseItem) {
      this.chooseItem = '';
    } else {
      this.chooseItem = item;
    }
  }
  getGroupMemberList(_type) {
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: '30',
      infoType: _type
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        const {
          info: { groupMemberInfo, subGroupInfo }
        } = res;
        if (_type === 1) {
          this.subGroupInfo = subGroupInfo;
          this.subBrandInfo = this.subGroupInfo.brands.map(_brand => {
            return {
              ..._brand,
              groupIcon: this.utils.buildBase64ImgString(_brand.groupIcon)
            };
          });
          this.subBranchInfo = this.subGroupInfo.branches.map(_branch => {
            return {
              ..._branch,
              groupIcon: this.utils.buildBase64ImgString(_branch.groupIcon)
            };
          });
          this.subCoachInfo = this.subGroupInfo.coaches.map(_coach => {
            return {
              ..._coach,
              groupIcon: this.utils.buildBase64ImgString(_coach.groupIcon)
            };
          });
        }
      }
    });
  }
}
