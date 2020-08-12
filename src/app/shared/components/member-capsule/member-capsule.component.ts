import {
  Component,
  OnInit,
  Input,
  HostListener,
  ElementRef,
  EventEmitter,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { GroupService } from '../../../containers/dashboard/services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { RightSettingWinComponent } from '../../../containers/dashboard/group/right-setting-win/right-setting-win.component';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '../message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-member-capsule',
  templateUrl: './member-capsule.component.html',
  styleUrls: ['./member-capsule.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MemberCapsuleComponent implements OnInit {
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
  @Output() onWaittingMemberInfoChange = new EventEmitter();
  @Output() onRemoveAdmin = new EventEmitter();
  @Output() onRemoveGroup = new EventEmitter();
  @Output() onAssignAdmin = new EventEmitter();

  i18n = {
    teacher: '',
    coach: '',
    leagueAdministrator: '',
    departmentAdministrator: ''
  };
  active = false;
  width = '100%';
  height = 'auto';
  token: string;
  updateImgQueryString = '';
  public elementRef;
  constructor(
    myElement: ElementRef,
    private groupService: GroupService,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private hashIdService: HashIdService
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

    this.groupService.getImgUpdatedStatus().subscribe(response => {
      this.updateImgQueryString = response;
    });
    this.icon = `${this.icon}${this.updateImgQueryString}`;
    this.listenImage(this.icon);
    this.token = this.utils.getToken() || '';
  }

  // 待套件載好再取得多國語系翻譯-kidin-1090622
  getTranslate () {
    this.translate.get('hollow world').subscribe(() => {
      this.i18n = {
        teacher: this.translate.instant('universal_group_teacher'),
        coach: this.translate.instant('universal_group_coach'),
        leagueAdministrator: this.translate.instant('universal_group_administrator'),
        departmentAdministrator: this.translate.instant('universal_group_departmentAdmin')
      };

    });

  }

  listenImage(link) {
    // Set the image height and width
    const image = new Image();
    image.addEventListener('load', this.handleImageLoad.bind(this));
    image.src = link;
  }
  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    const radio = width / height;
    if (radio > 1.6) {
      this.width = '180%';
      this.height = 'auto';
    } else if (radio < 0.6) {
      this.width = 'auto';
      this.height = '180%';
    } else if (radio < 1.6 && radio > 1.3) {
      this.width = '150%';
      this.height = 'auto';
    } else {
      this.width = '100%';
      this.height = 'auto';
    }
  }
  toggleMenu() {
    if (this.isSubGroupInfo && !this.isHadMenu) {
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.groupId)}`);
    } else {
      this.active = !this.active;
    }
  }
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
  handleRemoveAdmin() {
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
  handleAssignAdmin(type) {
    let accessRight = '';
    if (type === 2) {
      accessRight = '60';
    } else if (type === 1) {
      accessRight = '50';
    } else {
      accessRight = this.groupLevel + '';
    }
    // if (this.groupLevel === 80 || this.groupLevel === 60) {
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
    // } else {
    // this.dialog.open(RightSettingWinComponent, {
    //   hasBackdrop: true,
    //   data: {
    //     name: this.name,
    //     groupId: this.groupId,
    //     userId: this.userId,
    //     groupLevel: this.groupLevel
    //   }
    // });
    // }
  }
  goToManage() {
    this.router.navigateByUrl(`/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.groupId)}/edit`);
  }
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
  goToUserProfileInGroupInfo() {
    if (!this.isSubGroupInfo && !this.isHadMenu) {
      this.router.navigateByUrl(`/user-profile/${this.hashIdService.handleUserIdEncode(this.userId)}`);
    }
  }
  goToUserProfileInEditGroupInfo() {
    this.router.navigateByUrl(`/user-profile/${this.hashIdService.handleUserIdEncode(this.userId)}`);
  }
}
