import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  UserService,
  AuthService,
  NodejsApiService,
  HintDialogService,
} from '../../../../core/services';
import { A3FormatPipe } from '../../../../core/pipes/a3-format.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import md5 from 'md5';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { appPath } from '../../../../app-path.const';
import { SpeedSibsPipe } from '../../../../core/pipes/speed-sibs.pipe';
import { SafeHtmlPipe } from '../../../../core/pipes/safe-html.pipe';
import { NgIf } from '@angular/common';

const timeFormat = 'YYYY-MM-DD HH:mm';

@Component({
  selector: 'app-qrcode-upload',
  templateUrl: './qrcode-upload.component.html',
  styleUrls: ['./qrcode-upload.component.scss'],
  standalone: true,
  imports: [NgIf, TranslateModule, SafeHtmlPipe, SpeedSibsPipe],
})
export class QrcodeUploadComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  loadingUserData = true;
  uploading = false;
  translatedInfo: any = {};
  displayInfo = {
    type: '2',
    totalTime: '--',
    calories: '--',
    avgSpeed: '--',
    createdTime: '--',
  };

  userInfo: any;
  coverTimestamp: number;
  dataBroken = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private hintDialogService: HintDialogService,
    private nodejsApiService: NodejsApiService,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private translate: TranslateService,
    private a3Format: A3FormatPipe,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // 未登入則導至登入頁，接著導至dashboard以取得user infomation
    const token = this.authService.token;
    const { portal, dashboard } = appPath;
    const { href, pathname, search } = location;
    if (token.length === 0) {
      this.auth.backUrl = href;
      this.router.navigateByUrl(portal.signInWeb);
    } else if (pathname.indexOf(dashboard.home) < 0) {
      this.router.navigateByUrl(`/${dashboard.home}${pathname}${search}`);
    } else {
      this.getUserInfo();
      const content = search.replace('?', '').split('&'),
        info = this.baseDecodeUnicode(content[1].split('base64,')[1]);
      if (info) {
        if (content[0].split('=')[1] === 'a3') {
          this.translatedInfo = this.a3Translate(JSON.parse(info));
        } else {
          this.translatedInfo = this.a3Translate(info);
        }

        this.displayData(this.translatedInfo);
      }
    }
  }

  // 取得個人資訊
  getUserInfo() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.userInfo = res;
        this.loadingUserData = false;
      });
  }

  // 解碼base64成utf-8
  baseDecodeUnicode(str) {
    try {
      return decodeURIComponent(
        atob(decodeURIComponent(str))
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch {
      const msg = 'Data broken!';
      this.hintDialogService.openAlert(msg);
      this.dataBroken = true;
      return false;
    }
  }

  // 轉譯a3格式
  a3Translate(a3Obj) {
    const newObj = new Object();
    for (const a3Key in a3Obj) {
      if (Object.prototype.hasOwnProperty.call(a3Obj, a3Key)) {
        if (!Array.isArray(a3Obj[a3Key]) && typeof a3Obj[a3Key] === 'object') {
          newObj[this.a3Format.transform(a3Key)] = this.a3Translate(a3Obj[a3Key]);
        } else {
          newObj[this.a3Format.transform(a3Key)] = a3Obj[a3Key];
        }
      }
    }

    return newObj;
  }

  // 根據格式顯示數據
  displayData(data) {
    this.displayInfo = {
      type: data.activityInfoLayer.type,
      totalTime: this.timeFormat(+data.activityInfoLayer.totalSecond, 'activity'),
      calories: data.activityInfoLayer.calories,
      avgSpeed: data.activityInfoLayer.avgSpeed,
      createdTime: this.timeFormat(data.fileInfo.creationDate, 'file'),
    };
  }

  // 上傳運動檔案
  uploadFile() {
    const { createdTime } = this.displayInfo,
      fileTimestamp = dayjs(createdTime, timeFormat).valueOf(),
      { totalSecond } = this.translatedInfo.activityInfoLayer,
      totalUnix = totalSecond * 1000;
    this.coverTimestamp = dayjs().valueOf() - totalUnix;
    // 運動時間距離現在時間超過一天即跳出彈跳視窗確認是否覆蓋時間（避免裝置沒電或忘記設定日期）
    if (this.coverTimestamp - fileTimestamp > 24 * 60 * 60 * 1000) {
      const coverTime = dayjs(this.coverTimestamp).format(timeFormat);
      this.translate
        .get('hellow world')
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(() => {
          const msg = `${this.translate.instant(
            'universal_activityData_updateDataTime'
          )}<br>${this.translate.instant(
            'universal_activityData_old'
          )}：${createdTime}<br>${this.translate.instant(
            'universal_activityData_new'
          )}：<span class="cover__heighlight">${coverTime}</span>
        `;
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'Message',
              body: msg,
              confirmBtnColor: '#23a0da',
              cancelText: this.translate.instant('universal_operating_no'),
              onCancel: this.createMd5File.bind(this),
              confirmText: this.translate.instant('universal_operating_yes'),
              onConfirm: this.coverFileTime.bind(this),
            },
          });
        });
    } else {
      this.createMd5File();
    }
  }

  /**
   * 覆蓋運動檔案開始時間
   * @author kidin-1100426
   */
  coverFileTime() {
    const date = dayjs(this.coverTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    this.translatedInfo.activityInfoLayer.startTime = date;
    this.translatedInfo.fileInfo.editDate = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    this.createMd5File();
  }

  /**
   * 根據userProfile補上author欄位，並用md5編碼運動檔案內容並產生檔案
   */
  createMd5File() {
    this.uploading = true;
    const { pluginAntSensorName } = this.translatedInfo.activityInfoLayer;
    const { userId, nickname } = this.userInfo;
    this.translatedInfo.fileInfo.author = `${nickname}?userId=${userId}`;
    if (pluginAntSensorName && !Array.isArray(pluginAntSensorName)) {
      this.translatedInfo.activityInfoLayer.pluginAntSensorName = [pluginAntSensorName];
    }

    const data = this.translatedInfo;
    const token = this.authService.token;
    const body = {
      token: token,
      userId: this.userInfo.userId,
      data: data,
      fileName: `${md5(JSON.stringify(data))}.at`,
      hostname: location.hostname,
    };

    this.nodejsApiService.uploadSportFile(body).subscribe((res) => {
      const { errMsg, resultCode, nodejsApiCode } = res;
      if (res.resultCode == 200) {
        this.snackbar.open(this.translate.instant('universal_popUpMessage_uploadSuccess'), 'OK', {
          duration: 2000,
        });

        setTimeout(() => {
          this.uploading = false;
          const { dashboard, personal } = appPath;
          this.router.navigateByUrl(`/${dashboard.home}/${personal.activityList}`);
        }, 2000);
      } else {
        console.error(`${resultCode}: Api ${nodejsApiCode} ${errMsg || 'Upload file failed.'}`);
        this.uploading = false;
        this.snackbar.open(this.translate.instant('universal_popUpMessage_uploadFailed'), 'OK', {
          duration: 2000,
        });
      }
    });
  }

  // 轉換時間格式
  timeFormat(time, type) {
    switch (type) {
      case 'activity':
        if (time < 60) {
          return `00:${this.fillTwoDigits(time)}`;
        } else if (time < 3600) {
          const minute = Math.floor(time / 60);
          const second = time % 60;
          return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}"`;
        } else {
          const hour = Math.floor(time / 3600);
          const minute = Math.floor((time % 3600) / 60);
          const second = time - hour * 3600 - minute * 60;
          return `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}"`;
        }

      case 'file':
        return dayjs(time).format(timeFormat);
    }
  }

  // 時間補零
  fillTwoDigits(num) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.slice(-2);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
