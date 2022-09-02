import { Injectable } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Observable, BehaviorSubject, ReplaySubject, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageBoxComponent } from '../components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import dayjs from 'dayjs';
import { ft, inch } from '../models/bs-constant';
import { GroupLevel } from '../../containers/dashboard/models/group-detail';
import { version } from '../version';
import { v5 as uuidv5 } from 'uuid';
import { setLocalStorageObject, getLocalStorageObject } from '../utils/index';

type Point = {
  x: number;
  y: number;
  color?: string;
};

@Injectable()
export class UtilsService {
  isResetPassword$ = new BehaviorSubject<boolean>(false);
  imgSelected$ = new BehaviorSubject<boolean>(false);
  hideNavbar$ = new BehaviorSubject<boolean>(false);
  darkMode$ = new BehaviorSubject<boolean>(false);
  loadingProgress$ = new ReplaySubject<number>(1);

  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private translate: TranslateService
  ) {}

  str_cut(str, max_length) {
    let m = 0,
      str_return = '';
    const a = str.split('');
    for (let i = 0; i < a.length; i++) {
      if (a[i].charCodeAt(0) < 299) {
        m++;
      } else {
        m += 2;
      }
      if (m > max_length) {
        break;
      }
      str_return += a[i];
    }
    return str_return;
  }

  isStringEmpty(string) {
    if (typeof string !== 'string') {
      return true;
    }
    return string.trim().length === 0;
  }

  isObjectEmpty(object) {
    if (!object) {
      return true;
    }
    return Object.keys(object).length === 0 && object.constructor === Object;
  }

  displayGroupId(_id: string) {
    if (_id) {
      const arr = _id.split('-').splice(2, 3);
      const isNormalGroup = !arr.some((_num) => +_num > 0);
      if (isNormalGroup) {
        const _arr = _id.split('-').splice(2, 4);
        const id = _arr.join('-');
        return id;
      } else {
        const id = arr.join('-');
        return id;
      }
    }
  }

  /**
   * 根據群組id取得該群組階層
   * @param _id {string}-group id
   * @returns {GroupLevel}-群組階層
   * @author kidin-1100512
   */
  displayGroupLevel(_id: string): GroupLevel {
    if (_id) {
      const arr = _id.split('-').splice(2, 4);
      if (+arr[3] > 0) {
        return GroupLevel.normal;
      } else if (+arr[2] > 0) {
        return GroupLevel.class;
      } else if (+arr[1] > 0) {
        return GroupLevel.branch;
      } else {
        return GroupLevel.brand;
      }
    }

    return GroupLevel.normal;
  }

  replaceCarriageReturn(string = '', format = '') {
    return string.replace(/(\r\n|\r|\n)/gm, format);
  }

  markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  handleNextUrl(next) {
    const { queryParams, url } = next;
    let finalUrl = '';
    if (url.length > 1) {
      url.forEach((_url) => {
        finalUrl += '/' + _url.path;
      });
    } else {
      finalUrl = '/' + url[0].path;
    }
    if (Object.keys(queryParams).length > 0) {
      const key = Object.keys(queryParams)[0];
      finalUrl = finalUrl + '?' + key + '=' + queryParams[`${key}`];
    }
    return finalUrl;
  }

  detectBrowser() {
    const sUsrAg = navigator.userAgent;
    if (sUsrAg.indexOf('Firefox') > -1) {
      return 'Mozilla Firefox';
    } else if (sUsrAg.indexOf('Opera') > -1) {
      return 'Opera';
    } else if (sUsrAg.indexOf('Trident') > -1) {
      return 'Microsoft Internet Explorer';
    } else if (sUsrAg.indexOf('Edge') > -1) {
      return 'Microsoft Edge';
    } else if (sUsrAg.indexOf('Chrome') > -1 || sUsrAg.indexOf('CriOS') > -1) {
      // CriOS為首機版的
      return 'Google Chrome or Chromium';
    } else if (sUsrAg.indexOf('Safari') > -1) {
      return 'Apple Safari';
    } else {
      return 'unknown';
    }
  }

  diff_array(originalArray: string[], targetArray: string[]) {
    const diffArr = targetArray;
    for (let i = 0; i < originalArray.length; i++) {
      for (let j = 0; j < diffArr.length; j++) {
        if (originalArray[i] === diffArr[j]) {
          diffArr.splice(j, 1);
        }
      }
    }
    return diffArr.filter((v, i, a) => a.indexOf(v) === i);
  }

  isNumber(val: any) {
    const regPos = /^\d+(\.\d+)?$/; // 非負浮點數
    const regNeg =
      /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; // 負浮點數
    if (regPos.test(val) || regNeg.test(val)) {
      return true;
    } else {
      return false;
    }
  }

  formatFloat(num: number, pos: number) {
    // 小數點第N位四捨五入
    const size = Math.pow(10, pos);
    return Math.round(num * size) / size;
  }

  imageToDataUri(img, width, height) {
    // create an off-screen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // set its dimension to target size
    canvas.width = width;
    canvas.height = height;

    // draw source image into the off-screen canvas:
    ctx.drawImage(img, 0, 0, width, height);

    // encode image to data-uri with base64 version of compressed image
    return canvas.toDataURL().replace('data:image/png;base64,', '');
  }

  setResetPasswordStatus(status: boolean) {
    this.isResetPassword$.next(status);
  }

  getResetPasswordStatus(): Observable<boolean> {
    return this.isResetPassword$;
  }

  setImgSelectedStatus(status: boolean) {
    this.imgSelected$.next(status);
  }

  getImgSelectedStatus(): Observable<boolean> {
    return this.imgSelected$;
  }

  setHideNavbarStatus(status: boolean) {
    this.hideNavbar$.next(status);
  }

  getHideNavbarStatus(): Observable<boolean> {
    return this.hideNavbar$;
  }

  /**
   * 設定暗黑模式狀態
   * @param status {boolean}-暗黑模式狀態
   * @author kidin-1101229
   */
  setDarkModeStatus(status: boolean) {
    this.darkMode$.next(status);
  }

  /**
   * 取得暗黑模式狀態
   * @author kidin-1101229
   */
  getDarkModeStatus(): Observable<boolean> {
    return this.darkMode$;
  }

  /**
   * 設定loading進度
   * @param status {number}
   * @author kidin-1100302
   */
  setLoadingProgress(status: number) {
    this.loadingProgress$.next(status);
  }

  /**
   * 取得loading進度
   * @param status {number}
   * @author kidin-1100302
   */
  getLoadingProgress(): Observable<number> {
    return this.loadingProgress$;
  }

  /**
   * 跳出提示視窗
   * @param msg {string}-欲顯示的訊息
   * @author kidin-1090811
   */
  openAlert(msg: string) {
    this.translate.get('hellow world').subscribe(() => {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant('universal_operating_confirm'),
        },
      });
    });
  }

  /**
   * 跳出snackbar
   * @param msg {string}-欲顯示的訊息
   * @author kidin-1101203
   */
  showSnackBar(msg: string) {
    this.snackbar.open(msg, 'OK', { duration: 3000 });
  }

  /**
   * 將base64轉file
   * @param base64 {string}-base64檔案
   * @author kidin-1091125
   */
  dataUriToBlob(base64: string) {
    const byteString = window.atob(base64.split(',')[1]); // 去除base64前綴
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([int8Array], { type: 'image/png' });
    return blob;
  }

  /**
   * 檢查圖片大小，過大就壓縮
   * @param type {AlbumType}-圖片類型
   * @param base64 {string}-base64檔案
   * @author kidin-1091126
   */
  checkImgFormat(base64: string) {
    const image = new Image();
    image.src = base64;
    return fromEvent(image, 'load').pipe(
      map((e) => this.checkDimensionalSize(base64, image)),
      map((checkResult) => this.checkImgSize(checkResult as any))
    );
  }

  /**
   * 確認長寬是否符合格式
   * @param base {string}-base64圖片
   * @param img {HTMLImageElement}-html圖片元素
   * @author kidin-1101119
   */
  checkDimensionalSize(base64: string, img: HTMLImageElement) {
    const limitDimensional = 1080;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const overWidth = imgWidth > limitDimensional;
    const overHeight = imgHeight > limitDimensional;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (overWidth || overHeight) {
      if (imgHeight > imgWidth) {
        canvas.height = limitDimensional;
        canvas.width = imgWidth * (limitDimensional / imgHeight);
      } else {
        canvas.width = limitDimensional;
        canvas.height = imgHeight * (limitDimensional / imgWidth);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const newBase64 = canvas.toDataURL('image/jpeg', 1);
      return [newBase64, canvas.width, canvas.height, canvas, ctx];
    } else {
      const { width, height } = img;
      return [base64, width, height, canvas, ctx];
    }
  }

  /**
   * 確認圖片大小是否符合格式，不符則壓縮圖片
   * @param [base64, width, height, canvas, ctx]-[base64圖片, 圖片寬度, 圖片高度, canvas, ctx]
   * @author kidin-1101103
   */
  checkImgSize([base64, width, height, canvas, ctx]) {
    // 計算base64 size的公式（正確公式要判斷base64的'='數量，這邊直接當作'='數量為1）
    const imageSize = base64.length * (3 / 4) - 1;
    const limitSize = 500000;
    const overSize = imageSize > limitSize;
    if (overSize) {
      ctx.drawImage(canvas, 0, 0, width, height);
      const compressQulity = 0.9;
      // 透過toDataURL漸進式壓縮至所需大小，避免圖片過於失真
      const newBase64 = canvas.toDataURL('image/jpeg', compressQulity);
      return this.checkImgSize([newBase64, width, height, canvas, ctx]);
    } else {
      return base64;
    }
  }

  /********** 以下直接引用源碼 http://mourner.github.io/simplify-js/ ***********/
  /**
   * 取得點至線段距離的平方
   * @param p {Point}
   * @param p1 {Point}
   * @param p2 {Point}
   */
  getSqSegDist(p: Point, p1: Point, p2: Point) {
    let x = p1.x,
      y = p1.y,
      dx = p2.x - x,
      dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
  }

  /**
   * Ramer-Douglas-Peucker 演算法
   * @param points {Array<Point>}
   * @param first {number}-線段第一點
   * @param last {number}-線段最後一點
   * @param sqTolerance {number}-公差平方
   * @param simplified {Array<Point>}-降噪結果
   */
  simplifyDPStep(
    points: Array<Point>,
    first: number,
    last: number,
    sqTolerance: number,
    simplified: Array<Point>
  ) {
    let maxSqDist = sqTolerance;
    let index = 0;

    // 先找出離線最遠的點
    for (let i = first + 1; i < last; i++) {
      const sqDist = this.getSqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    // 如果最遠點大於所設定之公差平方才進行降噪
    if (maxSqDist > sqTolerance) {
      if (index > first + 1) {
        simplified = this.simplifyDPStep(points, first, index, sqTolerance, simplified);
      }

      simplified.push(points[index]);

      if (last > index + 1) {
        simplified = this.simplifyDPStep(points, index, last, sqTolerance, simplified);
      }
    }

    return simplified;
  }

  /**
   * 使用 Ramer-Douglas-Peucker 演算法
   * @param points {Array<Point>}
   * @param sqTolerance {number}-公差平方
   */
  simplifyDouglasPeucker(points: Array<Point>, sqTolerance: number) {
    const last = points.length - 1;
    let simplified = [points[0]];

    simplified = this.simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
  }

  /**
   * points 降噪
   * @param points {Array<Point>}
   * @param tolerance {number}-簡化的公差
   */
  simplify(points: Array<Point>, tolerance: number) {
    if (points.length <= 2) {
      return points;
    }

    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
    points = this.simplifyDouglasPeucker(points, sqTolerance);

    return points;
  }

  /************************************************************************/

  /**
   * 處理api回覆錯誤的情況
   * @param resultCode {number}-api 的resultCode
   * @param apiCode {number}-apiCode
   * @param apiMsg {string}-api resultMessage
   * @author kidin-1100304
   */
  handleError(resultCode: number, apiCode: number, apiMsg: string) {
    console.error(`${resultCode}: Api ${apiCode} ${apiMsg}`);
    const errorMsg = `Error!<br>Please try again later.`;
    this.openAlert(errorMsg);
  }

  /**
   * 將base64的圖片轉為檔案格式
   * @param base64 {string}-base64圖片
   * @param fileName {檔案名稱}
   * @author kidin-1091127
   */
  base64ToFile(base64: string, fileName: string) {
    const blob = this.dataUriToBlob(base64);
    return new File([blob], `${fileName}.jpg`, { type: 'image/jpeg' });
  }

  /**
   * 確認res resultCode是否回傳200(兼容兩個版本的response result)
   * @param res {any}-api response
   * @param showAlert {boolean}-是否顯示錯誤alert
   * @returns {boolean} resultCode是否回傳200
   * @author kidin-1100902
   */
  checkRes(res: any, showAlert = true): boolean {
    const { processResult, resultCode: resCode, apiCode: resApiCode, resultMessage: resMsg } = res;
    if (!processResult) {
      if (resCode !== 200) {
        if (showAlert) this.handleError(resCode, resApiCode, resMsg);

        return false;
      } else {
        return true;
      }
    } else {
      const { resultCode, apiCode, resultMessage } = processResult;
      if (resultCode !== 200) {
        if (showAlert) this.handleError(resultCode, apiCode, resultMessage);

        return false;
      } else {
        return true;
      }
    }
  }

  /**
   * 身高公英制轉換 公分<->吋
   * @param height {number | string}-身高（轉換前）
   * @param convert {boolean}-是否轉換
   * @param forward {boolean}-是否為公制轉英制
   * @author kidin-1100921
   */
  bodyHeightTransfer(height: number | string, convert: boolean, forward: boolean): number | string {
    if (convert) {
      if (forward) {
        // 公分轉吋
        height = height as number;
        const feet = Math.floor(height / 100 / ft);
        const mantissa = parseFloat(((height - feet * 0.3 * 100) / inch).toFixed(0));
        return `${feet}"${mantissa}`;
      } else {
        // 吋轉公分
        const [feet, mantissa] = (height as string).split('"');
        return parseFloat((+feet * 0.3 * 100 + +mantissa * inch).toFixed(1));
      }
    } else {
      return forward ? height : `${height}`;
    }
  }

  /**
   * 確認web版本
   * @return [是否為alpha版, 版本號]
   * @author kidin
   */
  checkWebVersion(): [boolean, string] {
    let isAlphaVersion = true,
      appVersion = version.develop;
    if (
      location.hostname.indexOf('cloud.alatech.com.tw') > -1 ||
      location.hostname.indexOf('www.gptfit.com') > -1
    ) {
      isAlphaVersion = false;
      appVersion = version.master;
    } else if (location.hostname.indexOf('app.alatech.com.tw') > -1) {
      appVersion = version.release;
    } else {
      appVersion = version.develop;
    }

    return [isAlphaVersion, appVersion];
  }

  /**
   * 確認使用語言
   * @author kidin
   */
  checkBrowserLang() {
    let browserLang = getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translate.getBrowserCultureLang().toLowerCase();
      this.translate.use(browserLang);
      setLocalStorageObject('locale', browserLang);
    } else {
      this.translate.use(browserLang);
    }
  }

  /**
   * 建立上傳圖床圖片之名稱
   * @param index {number}-檔案序列+1
   * @param id {string}-user id/group id(去掉'-')/event id
   * @author kidin-1101102
   */
  createImgFileName(index: number, id: string | number) {
    const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL);
    const keyword = `${dayjs().valueOf().toString()}${index}${id}`;
    return uuidv5(keyword, nameSpace);
  }

  /**
   * 取得base64圖片
   * @param file {Blob}-圖片檔案
   * @author kidin-1101029
   */
  getBase64(file: Blob) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const base64OnLoad = fromEvent(reader, 'load');
    const base64OnError = fromEvent(reader, 'error');
    return merge(base64OnLoad, base64OnError);
  }
}
