import {
  Component,
  OnInit,
  Input,
  HostListener,
  ElementRef,
  EventEmitter,
  Output
} from '@angular/core';
import { GroupService } from '../../../containers/dashboard/services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { RightSettingWinComponent } from '../../../containers/dashboard/group/right-setting-win/right-setting-win.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-member-capsule',
  templateUrl: './member-capsule.component.html',
  styleUrls: ['./member-capsule.component.css']
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
  @Output() onWaittingMemberInfoChange = new EventEmitter();
  @Output() onRemoveAdmin = new EventEmitter();
  @Output() onAssignAdmin = new EventEmitter();

  active = false;
  width = '100%';
  height = 'auto';
  token: string;
  public elementRef;
  constructor(
    myElement: ElementRef,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    public dialog: MatDialog
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
    this.active = !this.active;
  }
  handleJoinStatus(_type: number) {
    const body = {
      token: this.token,
      groupId: this.groupId,
      joinUserId: this.userId,
      joinStatus: _type
    };
    this.groupService.updateJoinStatus(body).subscribe(res => {
      if (res.resultCode === 200) {
        return this.onWaittingMemberInfoChange.emit(this.userId);
      }
    });
  }
  handleRemoveAdmin() {
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
    });
  }
  handleAssignAdmin() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      userId: this.userId,
      accessRight: '60'
    };
    this.dialog.open(RightSettingWinComponent, {
      hasBackdrop: true,
      data: {
        name: this.name,
        groupId: this.groupId,
        userId: this.userId
      }
    });
  }
  goToManage() {
    this.router.navigateByUrl(`/dashboard/group-info/${this.groupId}/edit`);
  }
  handleDeleteMember() {
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
}
