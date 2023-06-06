import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import {
  HashIdService,
  Api10xxService,
  AuthService,
  Api11xxService,
  NodejsApiService,
} from '../../../../core/services';
import { debounce, buildBase64ImgString, displayGroupLevel } from '../../../../core/utils';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'rxjs/operators';
import dayjs from 'dayjs';
import { AccountType } from '../../../../core/enums/personal';
import { appPath } from '../../../../app-path.const';

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
  styleUrls: ['./inner-test.component.scss'],
})
export class InnerTestComponent implements OnInit {
  userInfo: UserInfo = {
    userName: '',
    accountType: AccountType.email,
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
    lastResetPwd: '',
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
  readonly accountType = AccountType;

  constructor(
    private api11xxService: Api11xxService,
    private nodejsApiService: NodejsApiService,
    public dialog: MatDialog,
    private hashIdService: HashIdService,
    private api10xxService: Api10xxService,
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService
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
      token: this.authService.token,
      userId: userId,
    };

    this.nodejsApiService.fetchUserAvartar(body).subscribe((res) => {
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
        largeIcon,
      } = res as any;
      if (resultCode === 200) {
        let lastResetPasswordd: string;
        if (lastResetPwd !== null && lastResetPwd !== '') {
          lastResetPasswordd = dayjs.unix(+lastResetPwd).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        } else {
          lastResetPasswordd = '未重設';
        }

        const { hostname } = location;
        const {
          dashboard,
          adminManage: { home: adminManageHome, deviceLog },
          personal,
        } = appPath;
        const deviceLogUrl = `https://${hostname}/${dashboard.home}/${adminManageHome}/${deviceLog.home}/${deviceLog.detail}/${userId}`;
        const hashUserId = this.hashIdService.handleUserIdEncode(userId.toString());
        this.userInfo = {
          userName,
          accountType,
          userId: userId,
          userPageLink: `https://${hostname}/${personal.home}/${hashUserId}`,
          userDeviceLog: deviceLogUrl,
          smallIcon: buildBase64ImgString(smallIcon),
          middleIcon: buildBase64ImgString(middleIcon),
          largeIcon: buildBase64ImgString(largeIcon),
          email,
          countryCode,
          phone,
          enableStatus,
          lastLogin: dayjs.unix(+lastLogin).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          lastResetPwd: lastResetPasswordd,
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
        isInnerAdmin: true,
      },
    });
  }

  /**
   * 點選確認後送出查詢
   * @param _lists {array}
   * @author kidin-1090806
   */
  handleConfirm(type: number, _lists: Array<any>): void {
    const userIds = _lists.map((_list) => _list[type === 1 ? 'userId' : 'user_id']);
    this.getUserAvartar(userIds[0]);
  }

  fetchGroupInfo() {
    if (
      this.groupId === this.hashIdService.handleGroupIdDecode(this.hashGroupId) &&
      this.hashGroupId === this.hashIdService.handleGroupIdEncode(this.groupId)
    ) {
      const body = {
        groupId: this.groupId,
        token: this.authService.token,
        avatarType: 2,
      };
      this.api11xxService.fetchGroupListDetail(body).subscribe((res) => {
        this.groupInfo = res.info;
        const { groupIcon, groupId } = this.groupInfo;
        this.groupLevel = displayGroupLevel(groupId);
        this.groupImg =
          groupIcon && groupIcon.length > 0 ? groupIcon : '/assets/images/group-default.svg';
      });
    }
  }

  fetchUserProfile() {
    if (this.userId || this.hashUserId) {
      const body = {
        targetUserId: this.userId || this.hashIdService.handleUserIdDecode(this.hashUserId),
      };

      this.api10xxService
        .fetchGetUserProfile(body)
        .pipe(last())
        .subscribe((res) => {
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

  // 顯示彈跳視窗訊息
  showMsgBox(msg: string, navigate: boolean) {
    if (navigate) {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        disableClose: true,
        data: {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant('universal_operating_confirm'),
          onConfirm: this.router.navigateByUrl(`/${appPath.portal.signInWeb}`),
        },
      });
    } else {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        disableClose: true,
        data: {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant('universal_operating_confirm'),
        },
      });
    }
  }
}
