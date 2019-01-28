import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../services/group.service';
import { HttpParams } from '@angular/common/http';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { HashIdService } from '@shared/services/hash-id.service';
import { debounce } from '@shared/utils/';
import { UserProfileService } from '@shared/services/user-profile.service';

@Component({
  selector: 'app-inner-test',
  templateUrl: './inner-test.component.html',
  styleUrls: ['./inner-test.component.scss']
})
export class InnerTestComponent implements OnInit {
  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    public dialog: MatDialog,
    private hashIdService: HashIdService,
    private userProfileService: UserProfileService
  ) {
    this.onGroupEncode = debounce(this.onGroupEncode, 1000);
    this.onGroupDecode = debounce(this.onGroupDecode, 1000);
  }
  userName: string;
  smallIcon: string;
  middleIcon: string;
  largeIcon: string;
  smallIconWidth: number;
  smallIconHeight: number;
  middleIconWidth: number;
  middleIconHeight: number;
  largeIconWidth: number;
  largeIconHeight: number;
  isWrong = false;
  smallFileSize: number;
  middleFileSize: number;
  largeFileSize: number;
  groupId: string;
  hashGroupId: string;
  groupInfo: any;
  groupImg = '/assets/images/group-default.svg';
  userImg = '/assets/images/user.png';
  description: string;
  userId: string;
  hashUserId: string;
  groupLevel: string;
  ngOnInit() {}
  getUserAvartar(userId) {
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    this.groupService.fetchUserAvartar(params).subscribe(res => {
      if (res.resultCode === 200) {
        this.userName = res.userName;
        this.smallIcon = this.utils.buildBase64ImgString(res.smallIcon);
        this.middleIcon = this.utils.buildBase64ImgString(res.middleIcon);
        this.largeIcon = this.utils.buildBase64ImgString(res.largeIcon);
        this.handleAvartarInfo(this.smallIcon, 1);
        this.handleAvartarInfo(this.middleIcon, 2);
        this.handleAvartarInfo(this.largeIcon, 3);
      } else {
        this.isWrong = true;
      }
    });
  }
  handleAvartarInfo(icon, type) {
    const image = new Image();
    image.src = icon;
    const head = 'data:image/jpg; base64';
    const imgFileSize = Math.round(((icon.length - head.length) * 3) / 4);

    setTimeout(() => {
      const width = image.width;
      const height = image.height;
      if (type === 1) {
        this.smallIconWidth = width;
        this.smallIconHeight = height;
        this.smallFileSize = imgFileSize;
      } else if (type === 2) {
        this.middleIconWidth = width;
        this.middleIconHeight = height;
        this.middleFileSize = imgFileSize;
      } else {
        this.largeIconWidth = width;
        this.largeIconHeight = height;
        this.largeFileSize = imgFileSize;
      }
    }, 500);
  }
  openSelectorWin(e) {
    const adminLists = [];
    e.preventDefault();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `人員選擇`,
        adminLists,
        onConfirm: this.handleConfirm.bind(this)
      }
    });
  }
  handleConfirm(_lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.getUserAvartar(userIds[0]);
  }
  fetchGroupInfo() {
    if (
      this.groupId ===
        this.hashIdService.handleGroupIdDecode(this.hashGroupId) &&
      this.hashGroupId === this.hashIdService.handleGroupIdEncode(this.groupId)
    ) {
      const body = { groupId: this.groupId, token: this.utils.getToken() };
      this.groupService.fetchGroupListDetail(body).subscribe(res => {
        this.groupInfo = res.info;
        const { groupIcon, groupId } = this.groupInfo;
        this.groupLevel = this.utils.displayGroupLevel(groupId);
        this.groupImg =
          groupIcon && groupIcon.length > 0
            ? this.utils.buildBase64ImgString(groupIcon)
            : '/assets/images/group-default.svg';
      });
    }
  }
  fetchUserProfile() {
    if (
      this.userId === this.hashIdService.handleUserIdDecode(this.hashUserId) &&
      this.hashUserId === this.hashIdService.handleUserIdEncode(this.userId)
    ) {
      const body = {
        token: this.utils.getToken(),
        targetUserId: this.userId || ''
      };
      this.userProfileService.getUserProfile(body).subscribe(res => {
        const response: any = res;
        const { name, nameIcon, description } = response.info;
        this.description = description;
        this.userName = name;
        this.userImg = nameIcon
          ? this.utils.buildBase64ImgString(nameIcon)
          : '/assets/images/user.png';
      });
    }
  }
  onGroupEncode(e) {
    this.hashGroupId = this.hashIdService.handleGroupIdEncode(e.target.value);
    this.fetchGroupInfo();
  }
  onGroupDecode(e) {
    this.groupId = this.hashIdService.handleGroupIdDecode(e.target.value);
    this.fetchGroupInfo();
  }
  onUserEncode(e) {
    this.hashUserId = this.hashIdService.handleUserIdEncode(e.target.value);
    this.fetchUserProfile();
  }
  onUserDecode(e) {
    this.userId = this.hashIdService.handleUserIdDecode(e.target.value);
    this.fetchUserProfile();
  }
}
