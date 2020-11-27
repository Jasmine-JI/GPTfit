import { Component, OnInit, Inject, EventEmitter, ViewEncapsulation } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../shared/services/user-profile.service';

@Component({
  selector: 'app-right-setting-win',
  templateUrl: './right-setting-win.component.html',
  styleUrls: ['./right-setting-win.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RightSettingWinComponent implements OnInit {
  i18n = {
    brandAdministrator: '',
    branchAdministrator: '',
    classAdministrator: ''
  };
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
  get groupLevel() {
    return this.data.groupLevel;
  }
  get onChange() {
    return this.data.onDelete;
  }
  constructor(
    private dialog: MatDialog,
    private groupService: GroupService,
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.getTranslate();
    this.token = this.utils.getToken() || '';
    this.getGroupMemberList(1);
  }

  // 待多國語系套件載入完成後再產生翻譯-kidin-1090622
  getTranslate () {
    this.translate.get('hollow world').subscribe(() => {
      this.i18n = {
        brandAdministrator: this.translate.instant('universal_group_brandAdministrator'),
        branchAdministrator: this.translate.instant('universal_group_branchAdministrator'),
        classAdministrator: `${this.translate.instant('universal_group_class')
          } ${this.translate.instant('universal_group_administrator')
        }`
      };

    });

  }

  confirm() {
    this.onConfirm.emit();
    if (this.chooseItem !== '') {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: this.translate.instant(
            'universal_group_assignAdministrator',
            {
              'name': this.name,
              'group': this.chooseGroupName
            }
          ),
          confirmText: this.translate.instant('universal_operating_confirm'),
          cancelText: this.translate.instant('universal_operating_cancel'),
          onConfirm: this.handleConfirm.bind(this)
        }
      });
    }
  }
  handleConfirm() {
    const body2 = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      accessRight: this.manageType
    };
    if (this.groupId !== this.chooseGroupId) {
      body2.groupId = this.chooseGroupId;
      this.groupService.addGroupMember(body2).subscribe(res => {
        if (res.resultCode === 200) {
          this.dialog.closeAll();
        } else {
          this.groupService.editGroupMember(body2).subscribe(response => {
            if (response.resultCode === 200) {
              const body = {
                token: this.token
              };
              this.userProfileService.refreshUserProfile(body);
              this.dialog.closeAll();
            }
          });
        }
      });
    } else {
      this.groupService.editGroupMember(body2).subscribe(res => {
        if (res.resultCode === 200) {
          const body = {
            token: this.token
          };
          this.userProfileService.refreshUserProfile(body);
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
      infoType: _type,
      avatarType: 3
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        const {
          info: { groupMemberInfo, subGroupInfo }
        } = res;
        if (_type === 1) {
          this.subGroupInfo = subGroupInfo;
          if (this.groupLevel === '40') {
            this.subBranchInfo = this.subGroupInfo.branches.filter(
              _branch => {
                if (_branch.groupStatus !== 4 && _branch.groupId === this.groupId) {
                  return {
                    ..._branch,
                    groupIcon: _branch.groupIcon
                  };
                }
              }
            );
            this.subCoachInfo = this.subGroupInfo.coaches.filter(
              _coach => {
                if (_coach.groupStatus !== 4) {
                  return {
                    ..._coach,
                    groupIcon: _coach.groupIcon
                  };
                }
              }
            );
          } else if (this.groupLevel === '60') {
            this.subCoachInfo = this.subGroupInfo.coaches.filter(
              _coach => {
                if (_coach.groupStatus !== 4 && _coach.groupId === this.groupId) {
                  return {
                    ..._coach,
                    groupIcon: _coach.groupIcon
                  };
                }
              }
            );
          } else {
            this.subBrandInfo = this.subGroupInfo.brands.filter(_brand => {
              if (_brand.groupStatus !== 4) {
                return {
                  ..._brand,
                  groupIcon: _brand.groupIcon
                };
              }
            });
            this.subBranchInfo = this.subGroupInfo.branches.filter(_branch => {
              if (_branch.groupStatus !== 4) {
                return {
                  ..._branch,
                  groupIcon: _branch.groupIcon
                };
              }
            });
            this.subCoachInfo = this.subGroupInfo.coaches.filter(_coach => {
              if (_coach.groupStatus !== 4) {
                return {
                  ..._coach,
                  groupIcon: _coach.groupIcon
                };
              }
            });
          }
        }
      }
    });
  }
}
