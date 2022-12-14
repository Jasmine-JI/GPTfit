import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { Router } from '@angular/router';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { PeopleSelectorWinComponent } from '../../people-selector-win/people-selector-win.component';
import { Component, OnInit } from '@angular/core';
import dayjs from 'dayjs';
import { PushMessageService } from '../../../services/push-message.service';
import { NodejsApiService, AuthService } from '../../../../../core/services';

@Component({
  selector: 'app-edit-push-message',
  templateUrl: './edit-push-message.component.html',
  styleUrls: ['./edit-push-message.component.scss'],
})
export class EditPushMessageComponent implements OnInit {
  uiFlag = {
    readonly: true,
    timeError: false,
    titleEmpty: null,
    contentEmpty: null,
    minTime: null,
    showLinkSelector: null,
    deepLinkType: 0,
    pushStatus: 1,
  };

  condition = ['countryRegion', 'system', 'app', 'groupId', 'userId', 'language'];
  linkType = ['宣傳頁面', '單筆活動檔案'];
  pushNotifyId = null;
  creator = {
    createUser: '',
    createTimeStamp: null,
  };

  // 儲存未被選擇的條件
  notAssignCondition = {
    countryRegion: ['TW', 'CN', 'US'],
    system: [1, 2],
    app: [1, 2, 3, 4],
    groupId: [],
    userId: [],
    language: ['es-ES', 'de-DE', 'fr-FR', 'it-IT', 'pt-PT'],
  };

  // api 9002所需request
  req = {
    token: this.authService.token,
    pushMode: {
      type: 2,
      timeStamp: null,
      objectType: [1],
      countryRegion: [],
      system: [],
      app: [],
      groupId: [],
      userId: [],
    },
    message: [
      {
        language: 'zh',
        countryRegion: 'TW',
        title: '',
        content: '',
        deepLink: '',
      },
      {
        language: 'zh',
        countryRegion: 'CN',
        title: '',
        content: '',
        deepLink: '',
      },
      {
        language: 'en',
        countryRegion: 'US',
        title: '',
        content: '',
        deepLink: '',
      },
    ],
  };

  reservation = {
    date: null,
    time: null,
    timeFormat: dayjs().format('HH:mm'),
  };

  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private pushMessageService: PushMessageService,
    private router: Router,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.uiFlag.readonly = this.checkPage(location.pathname);
  }

  /**
   * 取得目前路徑決定顯示的內容
   * @param pathname {string} url路徑
   * @return boolean
   * @author kidin-1090916
   */
  checkPage(pathname: string) {
    if (pathname.indexOf('push-detail') > -1) {
      this.pushNotifyId = +location.search.split('?')[1].split('=')[1];
      this.getPushMessageDetail();
      return true;
    } else {
      this.reservation.time = this.getTimeUnix(dayjs().format('HH:mm'));
      return false;
    }
  }

  /**
   * 取得指定推播訊息
   * @author kidin-1090916
   */
  getPushMessageDetail() {
    const body = {
      token: this.authService.token,
      pushNotifyId: this.pushNotifyId,
    };

    this.pushMessageService
      .getPushMessageDetail(body)
      .pipe(
        switchMap((res) => {
          if (res.processResult.resultCode !== 200) {
            console.error(`${res.processResult.apiCode}：${res.processResult.apiReturnMessage}`);
          } else {
            if (res.pushMode.userId && res.pushMode.userId.length !== 0) {
              // 取得發送者暱稱
              const userIdArr = [];
              res.pushMode.userId.forEach((_list) => {
                userIdArr.push(+_list);
              });

              const ubody = {
                userIdList: userIdArr,
              };

              return this.nodejsApiService.getUserList(ubody).pipe(
                map((resp) => {
                  if (resp.resultCode !== 200) {
                    console.error(`${resp.apiCode}：${resp.resultMessage}`);
                  } else {
                    res.pushMode.userId = resp.nickname;
                  }

                  return res;
                })
              );
            } else {
              return of(res);
            }
          }
        })
      )
      .subscribe((response) => {
        this.creator = {
          createUser: response.createUser,
          createTimeStamp: response.createTimeStamp,
        };

        this.req.pushMode = response.pushMode;
        this.req.message = response.message;
        this.uiFlag.pushStatus = response.pushStatus;
      });
  }

  /**
   * 切換發送類型
   * @param type {number}- 1:立即發送 2.預約發送
   * @author kidin-1090916
   */
  changeSendType(type: number) {
    this.req.pushMode.type = type;
  }

  /**
   * 切換指定對象類別
   * @param type {number}- 1:所有人 2.條件式
   * @author kidin-1090916
   */
  changeObjType(type: number) {
    this.req.pushMode.objectType.length = 0;

    if (type !== null) {
      this.req.pushMode.objectType.push(type);
    }
  }

  /**
   * 取得選擇日期
   * @param e {any}
   * @author kidin-1090917
   */
  getSelectDate(e: any) {
    this.reservation.date = dayjs(e.startDate).unix();

    // 若日期選擇今日，則時間必須大於10分鐘以上
    if (dayjs(e.startDate).unix() === dayjs().unix()) {
      this.uiFlag.minTime = dayjs(dayjs().unix() + 10 * 60).format('HH:mm');
    } else {
      this.uiFlag.minTime = null;
    }
  }

  /**
   * 取得選擇時間
   * @param e {any}
   * @author kidin-1090917
   */
  getSelectTime(e: any) {
    this.reservation.timeFormat = e.target.value;
    this.reservation.time = this.getTimeUnix(this.reservation.timeFormat);
  }

  /**
   * 取得unix
   * @param timeStr {string}
   * @author kidin-1090917
   */
  getTimeUnix(timeStr: string) {
    return +timeStr.split(':')[0] * 3600 + +timeStr.split(':')[1] * 60;
  }

  /**
   * 刪除條件
   * @param type {string} 條件類別
   * @param index {number} 條件順位
   * @author kidin-1090916
   */
  deleteCondition(type: string, index: number) {
    const [delCondition] = this.req.pushMode[type].splice(index, 1);
    if (type !== 'groupId' && type !== 'userId') {
      this.notAssignCondition[type].push(delCondition);
    }
  }

  /**
   * 開啟條件選擇器
   * @param type {number} 條件類別
   * @author kidin-1090916
   */
  openSelector(type: number) {
    const pushSetting = this.req,
      notAssignCondition = this.notAssignCondition;
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: this.condition,
        titleIdx: type,
        type: 3,
        pushSetting,
        notAssignCondition,
        onConfirm: this.saveCondition.bind(this),
        isInnerAdmin: true,
      },
    });
  }

  /**
   * 儲存條件
   * @author kidin-1090916
   */
  saveCondition(newReq: any, remainCondition: any) {
    this.req = newReq;
    this.notAssignCondition = remainCondition;

    // 清空未被選擇的群組或使用者清單
    this.notAssignCondition.groupId.length = 0;
    this.notAssignCondition.userId.length = 0;
  }

  /**
   * 儲存輸入內容
   * @param e {Event}
   * @param index {number}
   * @param item {string}
   * @author kidin-1090921
   */
  saveContext(e: Event, index: number, item: string) {
    this.req.message[index][item] = (e as any).target.value;
  }

  /**
   * 開啟深度連結類別選單
   * @param index {number}
   * @author kidin-1090922
   */
  openLinkSelector(index: number) {
    if (this.uiFlag.showLinkSelector === null || this.uiFlag.showLinkSelector !== index) {
      this.uiFlag.showLinkSelector = index;
    } else {
      this.uiFlag.showLinkSelector = null;
    }
  }

  /**
   * 切換深度連結類型
   * @param type {number}
   * @author kidin-1090922
   */
  switchDeepLinkType(type: number) {
    this.uiFlag.deepLinkType = type;
  }

  /**
   * 送出推播
   * @author kidin-1090917
   */
  sendPush() {
    if (this.checkMessage()) {
      if (this.req.pushMode.type === 2) {
        this.checkTimeStamp();
      }

      let msg: string;
      if (this.req.pushMode.type === 1) {
        msg = '立即發送';
      } else {
        msg = `預約時間${this.getRelativeTime()}送出`;
      }

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `您選擇的發送方式為${msg}，請確認內容無誤後送出。`,
          jusCon: 'space-between',
          confirmText: '送出推播',
          cancelText: '返回檢查內容',
          onConfirm: this.sendReq.bind(this),
        },
      });
    }
  }

  /**
   * 送出req前將req修正和補齊
   * @author kidin-1090921
   */
  remedyReq() {
    for (let i = 0; i < this.condition.length - 1; i++) {
      // 確認使用者增加哪些條件
      if (this.req.pushMode[this.condition[i]].length !== 0) {
        this.req.pushMode.objectType.push(i + 2);

        // 去除groupId或userId以外的資訊
        if (this.condition[i] === 'groupId' || this.condition[i] === 'userId') {
          this.req.pushMode[this.condition[i]] = this.req.pushMode[this.condition[i]].map(
            (_condition) => _condition[this.condition[i]]
          );
        }
      } else {
        // 刪除使用者未設定的條件物件
        delete this.req.pushMode[this.condition[i]];
      }
    }

    // 使用者選擇條件式但沒新增任何條件，則視為推播所有人
    if (this.req.pushMode.objectType.length === 0) {
      this.req.pushMode.objectType = [1];
    }

    // 將連結依據類型修改為app深度連結
    this.req.message = this.req.message.map((_message) => {
      if (_message.deepLink.trim() !== '') {
        switch (this.uiFlag.deepLinkType) {
          case 0:
            _message.deepLink = `alatechApp://webBrowser?url=${_message.deepLink}`;
            break;
          case 1:
            _message.deepLink = `alatechApp://viewActivity?fileId=${_message.deepLink}`;
            break;
          default:
            _message.deepLink = `alatechApp://webBrowser?url=${_message.deepLink}`;
            break;
        }
      } else {
        _message.deepLink = '';
      }

      return _message;
    });
  }

  /**
   * 取得完整相對時間
   * @author kidin-1090922
   */
  getRelativeTime() {
    const relativeTimeStamp = this.req.pushMode.timeStamp - dayjs().unix(),
      day = 60 * 60 * 24,
      hour = 60 * 60;

    return `${Math.floor(relativeTimeStamp / day)}天${Math.floor(
      (relativeTimeStamp % day) / hour
    )}小時內`;
  }

  /**
   * 發出請求
   * @author kidin-1090922
   */
  sendReq() {
    this.remedyReq();
    this.pushMessageService.createPushMessage(this.req).subscribe((res) => {
      if (res.processResult.resultCode === 200) {
        this.snackbar.open('推播成功', 'OK', { duration: 5000 });
        setTimeout(() => {
          this.router.navigateByUrl(`/dashboard/system/push-list`);
          this.checkPage(location.pathname);
        }, 2000);
      } else {
        this.snackbar.open('推播失敗', 'OK', { duration: 5000 });
        console.error(`${res.precessResult.apiCode}：${res.precessResult.apiReturnMessage}`);
      }
    });
  }

  /**
   * 確認繁中/簡中/英文，及新增的語言其標題和內容是否皆已輸入
   * @returns boolean
   * @author kidin-1090921
   */
  checkMessage() {
    for (let i = 0; i < this.req.message.length; i++) {
      if (this.req.message[i].title.trim() === '') {
        this.uiFlag.titleEmpty = i;
        const element = document.querySelectorAll('.lan__input__title')[i];
        element.scrollIntoView();
        return false;
      } else if (this.req.message[i].content.trim() === '') {
        this.uiFlag.contentEmpty = i;
        const element = document.querySelectorAll('.lan__input__content')[i];
        element.scrollIntoView();
        return false;
      } else {
        this.uiFlag.titleEmpty = null;
        this.uiFlag.contentEmpty = null;
      }
    }

    return true;
  }

  /**
   * 將日期時間轉換成timeStamp，並檢查時間是否大於五分鐘以上
   * @returns timestamp {number}
   * @author kidin-1090921
   */
  checkTimeStamp() {
    const setTimeStamp = dayjs(this.reservation.date) + this.reservation.time;
    if (setTimeStamp < dayjs().unix() + 5 * 60) {
      this.req.pushMode.timeStamp = setTimeStamp + 6 * 60;
    } else {
      this.req.pushMode.timeStamp = setTimeStamp;
      this.uiFlag.timeError = false;
    }
  }

  /**
   * 取消未發送的推播
   * @author kidin-1090923
   */
  cancelPush() {
    const body = {
      token: this.authService.token,
      pushNotifyId: this.pushNotifyId,
    };

    this.pushMessageService.cancelPushMessage(body).subscribe((res) => {
      if (res.processResult.resultCode !== 200) {
        console.error(`${res.processResult.apiCode}：${res.processResult.apiReturnMessage}`);
      } else {
        this.snackbar.open('已取消發送', 'OK', { duration: 2000 });
        setTimeout(() => {
          this.getPushMessageDetail();
        }, 2000);
      }
    });
  }
}
