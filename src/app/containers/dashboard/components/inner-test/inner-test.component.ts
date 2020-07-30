import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../services/group.service';
import { HttpParams } from '@angular/common/http';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { HashIdService } from '@shared/services/hash-id.service';
import { debounce } from '@shared/utils/';
import { UserProfileService } from '@shared/services/user-profile.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'rxjs/operators';

const errorMsg = 'Server Error!<br />Please try again later.';

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
    private userProfileService: UserProfileService,
    private auth: AuthService,
    private router: Router,
    private translate: TranslateService
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
  flag = 402;

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
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: true
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
      const body = {
        groupId: this.groupId,
        token: this.utils.getToken() || '',
        avatarType: 2
      };
      this.groupService.fetchGroupListDetail(body).subscribe(res => {
        this.groupInfo = res.info;
        const { groupIcon, groupId } = this.groupInfo;
        this.groupLevel = this.utils.displayGroupLevel(groupId);
        this.groupImg =
          groupIcon && groupIcon.length > 0
            ? groupIcon
            : '/assets/images/group-default.svg';
      });
    }
  }

  fetchUserProfile() {
    if (this.userId || this.hashUserId) {

      const body = {
        targetUserId: this.userId || this.hashIdService.handleUserIdDecode(this.hashUserId)
      };

      this.userProfileService.getUserProfile(body).pipe(
        last()
      ).subscribe(res => {
        if (res.processResult.resultCode !== 200) {
          console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`)
        } else {
          const response: any = res.userProfile;
          const { nickname, avatarUrl, description } = response;
          this.description = description;
          this.userName = nickname;
          this.userImg = avatarUrl ? avatarUrl : '/assets/images/user.png';
        }

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

  // 顯示彈跳視窗訊息-kidin-1090518
  showMsgBox (msg: string, navigate: boolean) {

    if (navigate) {

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        disableClose: true,
        data: {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant(
            'universal_operating_confirm'
          ),
          onConfirm: this.router.navigateByUrl('/signIn-web')
        }
      });

    } else {

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        disableClose: true,
        data: {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant(
            'universal_operating_confirm'
          )
        }
      });

    }

  }

}
