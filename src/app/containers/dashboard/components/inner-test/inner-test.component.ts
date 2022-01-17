import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../../shared/services/group.service';
import { HttpParams } from '@angular/common/http';
import { UtilsService } from '../../../../shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import { debounce } from '../../../../shared/utils/';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'rxjs/operators';
import moment from 'moment';
import { AccountTypeEnum } from '../../../dashboard/models/userProfileInfo';

const errorMsg = 'Error!<br />Please try again later.';

interface UserInfo {
  userName: string;
  userId: number;
  userPageLink: string;
  userDeviceLog: string;
  smallIcon: string;
  middleIcon: string;
  largeIcon: string;
  email: string;
  countryCode: string;
  phone: string;
  enableStatus: string;
  lastLogin: string;
  lastResetPwd: string;
  accountType: number;
}

@Component({
  selector: 'app-inner-test',
  templateUrl: './inner-test.component.html',
  styleUrls: ['./inner-test.component.scss']
})
export class InnerTestComponent implements OnInit {
  userInfo: UserInfo = {
    userName: '',
    accountType: AccountTypeEnum.email,
    userId: null,
    userPageLink: '',
    userDeviceLog: '',
    smallIcon: '',
    middleIcon: '',
    largeIcon: '',
    email: '',
    countryCode: '',
    phone: '',
    enableStatus: '',
    lastLogin: '',
    lastResetPwd: ''
  };

  nickname: string;
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
  userImg = '/assets/images/user2.png';
  description: string;
  userId: string;
  hashUserId: string;
  groupLevel: number;
  flag = 402;
  readonly accountType = AccountTypeEnum;

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

  ngOnInit() {}

  /**
   * 使用userId或帳號查詢使用者資訊
   * @param userId {string}- userId或帳號
   * @author kidin-1090806
   */
  getUserAvartar(userId: number): void {

    const body = {
      token: this.utils.getToken(),
      userId: userId
    };

    this.groupService.fetchUserAvartar(body).subscribe(res => {
      const {
        resultCode,
        lastResetPwd,
        userName,
        accountType,
        email,
        countryCode,
        phone,
        enableStatus,
        lastLogin,
        smallIcon,
        middleIcon,
        largeIcon
      } = res as any;
      if (resultCode === 200) {

        let lastResetPasswordd: string;
        if (lastResetPwd !== null && lastResetPwd !== '') {
          lastResetPasswordd = moment.unix(+lastResetPwd).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        } else {
          lastResetPasswordd = '未重設';
        }

        this.userInfo = {
          userName,
          accountType,
          userId: userId,
          userPageLink: `https://${location.hostname}/user-profile/${this.hashIdService.handleUserIdEncode(userId.toString())}`,
          userDeviceLog: `https://${location.hostname}/dashboard/system/device_log/detail/${userId}`,
          smallIcon: this.utils.buildBase64ImgString(smallIcon),
          middleIcon: this.utils.buildBase64ImgString(middleIcon),
          largeIcon: this.utils.buildBase64ImgString(largeIcon),
          email,
          countryCode,
          phone,
          enableStatus,
          lastLogin: moment.unix(+lastLogin).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          lastResetPwd: lastResetPasswordd
        };

        this.handleAvartarInfo(this.userInfo.smallIcon, 1);
        this.handleAvartarInfo(this.userInfo.middleIcon, 2);
        this.handleAvartarInfo(this.userInfo.largeIcon, 3);
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

  /**
   * 根據類別開啟選擇器頁面
   * @param type {number}- 1: userId 2:帳號
   * @param e {MouseEvent}
   * @author kidin-1090806
   */
  openSelectorWin(type: number, e: MouseEvent): void {
    const adminLists = [];
    e.preventDefault();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `人員選擇`,
        type,
        adminLists,
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: true
      }

    });

  }

  /**
   * 點選確認後送出查詢
   * @param _lists {array}
   * @author kidin-1090806
   */
  handleConfirm(type: number, _lists: Array<any>): void {
    let userIds: Array<number>;
    if (type === 1) {
      userIds = _lists.map(_list => _list.userId);
    } else {
      userIds = _lists.map(_list => _list.user_id);
    }

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
          console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
        } else {
          const response: any = res.userProfile;
          const { nickname, avatarUrl, description } = response;
          this.description = description;
          this.nickname = nickname;
          this.userImg = avatarUrl ? avatarUrl : '/assets/images/user2.png';
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
