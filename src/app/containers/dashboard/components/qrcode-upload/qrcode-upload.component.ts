import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { UtilsService } from '@shared/services/utils.service';
import { ActivityService } from '../../../../shared/services/activity.service';
import { A3FormatPipe } from '../../../../shared/pipes/a3-format.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../shared/services/auth.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import md5 from 'md5';

@Component({
  selector: 'app-qrcode-upload',
  templateUrl: './qrcode-upload.component.html',
  styleUrls: ['./qrcode-upload.component.scss']
})
export class QrcodeUploadComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  loadingUserData = true;
  uploading = false;
  translatedInfo: any = {};
  displayInfo: any = {
    type: '2',
    totalTime: '--',
    calories: '--',
    avgSpeed: '--',
    createdTime: '--'
  };
  userInfo: any;

  constructor(
    private router: Router,
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private translate: TranslateService,
    private a3Format: A3FormatPipe
  ) { }

  ngOnInit() {

    // 未登入則導至登入頁，接著導至dashboard以取得user infomation-kidin-1090525
    const token = this.utils.getToken() || '';
    if (token.length === 0) {
      this.auth.backUrl = location.href;
      this.router.navigateByUrl('/signIn-web');
    } else if (location.pathname.indexOf('dashboard') < 0) {
      this.router.navigateByUrl(
        `/dashboard${location.pathname}${location.search}`
      );
    } else {
      this.getUserInfo();

      const content = location.search.replace('?', '').split('&'),
            info = this.baseDecodeUnicode(content[1].split('base64,')[1]);
      if (content[0].split('=')[1] === 'a3') {
        this.translatedInfo = this.a3Translate(JSON.parse(info));

      } else {
        this.translatedInfo = this.a3Translate(info);
      }

      this.displayData(this.translatedInfo);
    }

  }

  // 取得個人資訊-kidin-1090420
  getUserInfo () {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userInfo = res;
      this.loadingUserData = false;
    });

  }

  // 解碼base64成utf-8-kidin-1090420
  baseDecodeUnicode (str) {
    return decodeURIComponent(atob(decodeURIComponent(str)).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  // 轉譯a3格式-kidin-1090420
  a3Translate (a3Obj) {
    const newObj = new Object;
    for (const a3Key in a3Obj) {

      if (a3Obj.hasOwnProperty(a3Key)) {

        if (!Array.isArray(a3Obj[a3Key]) && typeof(a3Obj[a3Key]) === 'object') {
          newObj[this.a3Format.transform(a3Key)] = this.a3Translate(a3Obj[a3Key]);
        } else {
          newObj[this.a3Format.transform(a3Key)] = a3Obj[a3Key];
        }

      }

    }

    return newObj;
  }

  // 根據格式顯示數據-kidin-1090420
  displayData (data) {
    this.displayInfo = {
      type: data.activityInfoLayer.type,
      totalTime: this.timeFormat(+data.activityInfoLayer.totalSecond, 'activity'),
      calories: data.activityInfoLayer.calories,
      avgSpeed: data.activityInfoLayer.avgSpeed,
      createdTime: this.timeFormat(data.fileInfo.creationDate, 'file')
    };
  }

  // 上傳運動檔案-kidin-1090420
  uploadFile () {
    this.uploading = true;
    this.createMd5File(this.translatedInfo);
  }

  // 用md5編碼運動檔案內容並產生檔案-kidin-1090420
  createMd5File (data) {

    const token = this.utils.getToken() || '';
    const body = {
      token: token,
      userId: this.userInfo.nameId,
      data: data,
      fileName: `${md5(JSON.stringify(data))}.at`,
      hostname: location.hostname
    };

   this.activityService.uploadSportFile(body).subscribe(res => {
      if (+res.resultCode === 200) {
        this.snackbar.open(
          this.translate.instant(
            'universal_popUpMessage_uploadSuccess'
          ),
          'OK',
          { duration: 2000 }
        );

        setTimeout(() => {
          this.uploading = false;
          this.router.navigateByUrl('/dashboard/activity-list');
        }, 2000);
      } else {
        this.uploading = false;
        this.snackbar.open(
          this.translate.instant(
            'universal_popUpMessage_uploadFailed'
          ),
          'OK',
          { duration: 2000 }
        );
      }

    });

  }

  // 轉換時間格式-kidin-1090420
  timeFormat (time, type) {
    switch (type) {
      case 'activity':

        if (time < 60) {
          return `00:${this.fillTwoDigits(time)}`;
        } else if ( time < 3600) {
          const minute = Math.floor((time) / 60);
          const second = time % 60;
          return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}"`;
        } else {
          const hour = Math.floor((time) / 3600);
          const minute = Math.floor((time % 3600) / 60);
          const second = time - (hour * 3600) - (minute * 60);
          return `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}"`;
        }

      case 'file':
        return moment(time).format('MM/DD hh:mm');
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits (num) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.substr(-2);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
