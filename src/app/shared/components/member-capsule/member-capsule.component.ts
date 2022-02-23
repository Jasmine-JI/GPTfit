import {
  Component,
  OnInit,
  OnChanges,
  Input,
  HostListener,
  ElementRef,
  EventEmitter,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '../../services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '../message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../services/hash-id.service';
import { UserProfileService } from '../../services/user-profile.service';
import { LongTextPipe } from '../../pipes/long-text.pipe';

@Component({
  selector: 'app-member-capsule',
  templateUrl: './member-capsule.component.html',
  styleUrls: ['./member-capsule.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MemberCapsuleComponent implements OnInit, OnChanges {
  @Input() memberInfo: any;
  @Input() icon: string;
  @Input() name: string;
  @Input() title: string;
  @Input() isSubGroupInfo = false;
  @Input() isAdminInfo = false;
  @Input() isNormalMemberInfo = false;
  @Input() isWaittingMemberInfo = false;
  @Input() groupId: string;
  @Input() userId: string;
  @Input() groupLevel: number;
  @Input() isHadMenu = false;
  @Input() canDisband = false;
  @Input() coachType: string;
  @Input() brandType: number;
  @Input() accessRight: string;
  @Input() parentsName: string;
  @Input() isLocked: boolean;
  @Input() adminList: Array<any>;

  @Output() onWaittingMemberInfoChange = new EventEmitter();
  @Output() onRemoveAdmin = new EventEmitter();
  @Output() onRemoveGroup = new EventEmitter();
  @Output() onAssignAdmin = new EventEmitter();

  i18n = {
    teacher: '',
    coach: '',
    leagueAdministrator: '',
    departmentAdministrator: '',
    onlyOneAdmin: '',
    confirmText: ''
  };
  active = false;
  width = '100%';
  height = 'auto';
  token: string;
  updateImgQueryString = '';
  displayParentsName: string;
  public elementRef;

  constructor(
    myElement: ElementRef,
    private groupService: GroupService,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private hashIdService: HashIdService,
    private longTextPipe: LongTextPipe
  ) {
    this.elementRef = myElement;
  }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.elementRef.nativeElement.contains(event.target)) {
    } else {
      this.active = false;
    }
  }

  handleClick() {}

  ngOnInit() {
    this.getTranslate();
    this.token = this.utils.getToken();
  }

  ngOnChanges() {
    this.checkParentsLength();
  }

  /**
   * 待套件載好再取得多國語系翻譯
   * @author kidin-1090622
   */
  getTranslate () {
    this.translate.get('hellow world').subscribe(() => {
      this.i18n = {
        teacher: this.translate.instant('universal_group_teacher'),
        coach: this.translate.instant('universal_group_coach'),
        leagueAdministrator: this.translate.instant('universal_group_administrator'),
        departmentAdministrator: this.translate.instant('universal_group_departmentAdmin'),
        onlyOneAdmin: this.translate.instant('universal_group_addAdministrator'),
        confirmText: this.translate.instant('universal_operating_confirm')
      };

    });

  }

  /**
   * 若父群組名稱過長，則將之裁切
   * @author kidin-1091201
   */
  checkParentsLength() {
    if (this.parentsName && this.parentsName.length > 11) {
      
      if (this.parentsName.indexOf('/') > -1) {
        const groupName = this.parentsName.split('/'),
              branchName = groupName[0],
              coachName = groupName[1];
        this.displayParentsName = `${this.longTextPipe.transform(branchName, 2)}/${this.longTextPipe.transform(coachName, 8)}`;
      } else {
        this.displayParentsName = `${this.longTextPipe.transform(this.parentsName, 8)}`;
      }

    } else {
      this.displayParentsName = this.parentsName;
    }

  }

  /**
   * 選單開關
   */
  toggleMenu() {
    if (this.isSubGroupInfo && !this.isHadMenu) {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.groupId)}/group-introduction`
      );
    } else {
      this.active = !this.active;
    }
  }
  
  /**
   * 更改成員加入群組狀態
   * @param _type {number}-加入狀態
   */
  handleJoinStatus(_type: number) {
    const body = {
      token: this.token,
      groupId: this.groupId,
      joinUserId: this.userId,
      joinStatus: _type,
      groupLevel: this.groupLevel,
      brandType: this.brandType
    };

    this.groupService.updateJoinStatus(body).subscribe(res => {
      if (res.resultCode === 200) {
        return this.onWaittingMemberInfoChange.emit(this.userId);
      }
    });

  }

  /**
   * 移除管理員
   */
  handleEditGroupMember() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      accessRight: '90'
    };

    this.groupService.editGroupMember(body).subscribe(res => {
      if (res.resultCode === 200) {
        const refreshBody = {
          token: this.token
        };
        this.userProfileService.refreshUserProfile(refreshBody);
        return this.onRemoveAdmin.emit(this.userId);
      }

      if (res.resultCode === 400) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: res.resultMessage
          }
        });
      }

    });

  }

  /**
   * 跳出移除管理員提示框
   */
  handleRemoveAdmin() {
    const adminLength = this.adminList.filter(_admin => _admin.groupId === this.groupId).length;
    if (adminLength <= 1) {

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: this.i18n.onlyOneAdmin,
          confirmText: this.i18n.confirmText
        }
      });

    } else {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `${this.translate.instant('universal_group_removeAdmin')}?`,
          confirmText: this.translate.instant('universal_operating_confirm'),
          cancelText: this.translate.instant('universal_operating_cancel'),
          onConfirm: this.handleEditGroupMember.bind(this)
        }

      });

    }

  }

  /**
   * 指派一般成員為管理員
   * @param type (number)-群組類型
   */
  handleAssignAdmin(type: number) {
    let accessRight = '';
    if (type === 2) {
      accessRight = '60';
    } else if (type === 1) {
      accessRight = '50';
    } else {
      accessRight = this.groupLevel + '';
    }

    const body = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      accessRight
    };
    
    this.groupService.editGroupMember(body).subscribe(res => {
      if (res.resultCode === 200) {
        const refreshBody = {
          token: this.token
        };
        this.userProfileService.refreshUserProfile(refreshBody);
        this.onAssignAdmin.emit(this.userId);
        this.dialog.closeAll();
      }

      if (res.resultCode === 400) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: res.resultMessage
          }
        });
      }
    });

  }

  /**
   * 移除一般成員
   */
  handleDeleteGroupMember() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      groupLevel: this.groupLevel
    };
    this.groupService.deleteGroupMember(body).subscribe(res => {
      if (res.resultCode === 200) {
        return this.onRemoveAdmin.emit(this.userId);
      }
    });
  }

  /**
   * 跳出移除成員提示框
   */
  handleDeleteMember() {
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: this.translate.instant('universal_group_removeMember'),
        confirmText: this.translate.instant('universal_operating_confirm'),
        cancelText: this.translate.instant('universal_operating_cancel'),
        onConfirm: this.handleDeleteGroupMember.bind(this)
      }
    });
  }

  /**
   * 解散群組
   */
  handleDeleteGroup() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      changeStatus: '4',
      groupLevel: this.groupLevel
    };
    this.groupService.changeGroupStatus(body).subscribe(res => {
      if (res.resultCode === 200) {
        return this.onRemoveGroup.emit(this.groupId);
      }
    });
  }

  /**
   * 開啟解散群組提示框
   */
  openDeleteGroupWin() {
    const targetName = this.translate.instant('universal_group_group');
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: this.translate.instant('universal_group_confirmDissolution', {
          groupName: targetName
        }),
        confirmText: this.translate.instant('universal_operating_confirm'),
        cancelText: this.translate.instant('universal_operating_cancel'),
        onConfirm: this.handleDeleteGroup.bind(this)
      }
    });
  }

  /**
   * 轉導至個人頁面
   */
  goToUserProfileInGroupInfo() {
    if (!this.isSubGroupInfo && !this.isHadMenu) {
      this.goToUserProfileInEditGroupInfo();
    }
  }


  goToUserProfileInEditGroupInfo() {
    this.router.navigateByUrl(`/user-profile/${this.hashIdService.handleUserIdEncode(this.userId)}`);
  }

  /**
   * 若圖片下載失敗則使用預設圖片
   */
  handleImgIconError() {
    if (this.isSubGroupInfo) {
      this.icon = '/assets/images/group.jpg';
    } else {
      this.icon = '/assets/images/user2.png';
    }

  }

}
