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
  @Input() role: any;
  @Input() isSubGroupInfo = false;
  @Input() isAdminInfo = false;
  @Input() isNormalMemberInfo = false;
  @Input() isWaittingMemberInfo = false;
  @Input() groupId: string;
  @Input() userId: string;
  @Input() groupLevel: string;
  @Input() isHadMenu = false;
  @Input() coachType: string;
  @Output() onWaittingMemberInfoChange = new EventEmitter();
  @Output() onRemoveAdmin = new EventEmitter();
  @Output() onRemoveGroup = new EventEmitter();
  @Output() onAssignAdmin = new EventEmitter();

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
    this.groupService.getImgUpdatedStatus().subscribe(response => {
      this.updateImgQueryString = response;
    });
    this.icon = `${this.icon}${this.updateImgQueryString}`;
    this.listenImage(this.icon);
    this.token = this.utils.getToken();
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
      groupLevel: this.groupLevel
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
        body: `${this.translate.instant('Dashboard.Group.GroupInfo.removeAdmin')}?`,
        confirmText: this.translate.instant('SH.determine'),
        cancelText: this.translate.instant('SH.cancel'),
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
      accessRight = this.groupLevel;
    }
    // if (this.groupLevel === '80' || this.groupLevel === '60') {
    const body = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      accessRight
    };
    this.groupService.editGroupMember(body).subscribe(res => {
      if (res.resultCode === 200) {
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
        body: this.translate.instant('Dashboard.Group.confirmRemovalMembers'),
        confirmText: this.translate.instant('SH.determine'),
        cancelText: this.translate.instant('SH.cancel'),
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
    const targetName = this.translate.instant('Dashboard.Group.group');
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: this.translate.instant('Dashboard.Group.confirmDissolution', {
          target: targetName
        }),
        confirmText: this.translate.instant('SH.determine'),
        cancelText: this.translate.instant('SH.cancel'),
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
