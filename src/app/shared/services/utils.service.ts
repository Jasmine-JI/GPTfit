import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { stringify, parse } from 'query-string';
import { FormGroup } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { MessageBoxComponent } from '../components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { AlbumType } from '../models/image';
import { HrZoneRange } from '../models/chart-data';
export const TOKEN = 'ala_token';
export const EMPTY_OBJECT = {};

type Point = {
  x: number;
  y: number;
  color?: string;
}

@Injectable()
export class UtilsService {
  isResetPassword$ = new BehaviorSubject<boolean>(false);
  imgSelected$ = new BehaviorSubject<boolean>(false);
  hideNavbar$ = new BehaviorSubject<boolean>(false);

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  setLocalStorageObject(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getLocalStorageObject(key: string) {
    const value = localStorage.getItem(key);
    return value && JSON.parse(value);
  }

  setSessionStorageObject(key: string, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  getSessionStorageObject(key: string) {
    const value = sessionStorage.getItem(key);
    return value && JSON.parse(value);
  }

  removeLocalStorageObject(key: string) {
    if (this.getLocalStorageObject(key)) {
      localStorage.removeItem(key);
    }
  }

  removeSessionStorageObject(key: string) {
    if (this.getSessionStorageObject(key)) {
      sessionStorage.removeItem(key);
    }
  }

  writeToken(value: string, token: string = TOKEN) {
    localStorage.setItem(token, value);
  }

  getToken(token: string = TOKEN) {
    return localStorage.getItem(token);
  }

  removeToken(token: string = TOKEN) {
    if (this.getToken(token)) {
      localStorage.removeItem(token);
    }
  }

  buildBase64ImgString(value: string) {
    if (!value) {
      return '';
    } else if (value.indexOf('data:image') > -1) {
      return value;
    } else if (value.indexOf('https://') > -1) {
      return value;
    } else {
      return `data:image/jpg; base64, ${value}`.replace(/\s+/g, '');
    }
  }

  getUrlQueryStrings(_search: string) {
    const search = _search || window.location.search;
    if (!search) {
      return EMPTY_OBJECT;
    }
    return parse(search);
  }

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

  buildUrlQueryStrings(_params) {
    const params = this.isObjectEmpty(_params)
      ? EMPTY_OBJECT
      : cloneDeep(_params);

    if (Object.keys(params).length) {
      for (const key in params) {
        if (!params[key]) {
          delete params[key];
        }
      }
    }
    return stringify(params);
  }

  displayGroupId(_id: string) {
    if (_id) {
      const arr = _id.split('-').splice(2, 3);
      const isNormalGroup = !arr.some(_num => +_num > 0);
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

  displayGroupLevel(_id: string) {
    if (_id) {
      const arr = _id.split('-').splice(2, 4);
      if (+arr[3] > 0) {
        return 80;
      } else if (+arr[2] > 0) {
        return 60;
      } else if (+arr[1] > 0) {
        return 40;
      } else {
        return 30;
      }
    }
  }

  replaceCarriageReturn(string = '', format = '') {
    return string.replace(/(\r\n|\r|\n)/gm, format);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
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
      url.forEach(_url => {
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
    const regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; // 負浮點數
    if (regPos.test(val) || regNeg.test(val)) {
      return true;
    } else {
      return false;
    }
  }

  formatFloat(num: number, pos: number) { // 小數點第N位四捨五入
    const size = Math.pow(10, pos);
    return Math.round(num * size) / size;
  }

  imageToDataUri(img, width, height) {
    // create an off-screen canvas
    const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

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
   * 物件深拷貝
   * @param obj
   * @param cache
   * @author kidin-1090902
   */
  deepCopy(obj: any, cache = new WeakMap()) {
    // 基本型別 & function
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Date 及 RegExp
    if (obj instanceof Date || obj instanceof RegExp) {
      return obj.constructor(obj);
    }

    // 檢查快取
    if (cache.has(obj)) {
      return cache.get(obj);
    }

    // 使用原物件的 constructor
    const copy = new obj.constructor();

    // 先放入 cache 中
    cache.set(obj, copy);

    // 取出所有一般屬性 & 所有 key 為 symbol 的屬性
    [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)].forEach(key => {
      copy[key] = this.deepCopy(obj[key], cache);
    });

    return copy;
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
          confirmText: this.translate.instant(
            'universal_operating_confirm'
          )
        }
      });

    })

  }

  /**
   * 將base64轉file
   * @param albumType {AlbumType}-圖片類型
   * @param base64 {string}-base64檔案
   * @author kidin-1091125
   */
  dataUriToBlob(albumType: AlbumType, base64: string) {
    base64 = this.checkImgSize(albumType, base64);
    const byteString = window.atob(base64.split(',')[1]),  // 去除base64前綴
          arrayBuffer = new ArrayBuffer(byteString.length),
          int8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([int8Array], { type: 'image/png' });    
    return blob;
  }

  /**
   * 檢查圖片大小，過大就壓縮
   * @param albumType {AlbumType}-圖片類型
   * @param img {string}-base64檔案
   * @author kidin-1091126
   */
  checkImgSize(albumType: AlbumType, img: string) {
    const imageSize = (img.length * (3 / 4)) - 1;  // 計算base64 size的公式（正確公式要判斷base64的'='數量，這邊直接當作'='數量為1）
    const limitSize = 500000;  // 圖片上傳限制500kb
    if (imageSize > limitSize) {
      const image = new Image();
      image.src = img;

      const canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

      canvas.width = 1080;
      canvas.height = albumType === 1 || albumType === 11 ? 1080 : 360;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      this.checkImgSize(albumType, canvas.toDataURL('image/jpeg', limitSize / imageSize));  // 壓縮完再次確認是否超過大小限制
    } else {
      return img;
    }
    
  }

  /**
   * 
   * @param userHRBase {0 | 1}-使用者心率法, 0.最大心率法 1.儲備心率法
   * @param userAge 
   * @param userMaxHR 
   * @param userRestHR 
   */
  getUserHrRange(userHRBase, userAge, userMaxHR, userRestHR) {
    let userHrInfo = <HrZoneRange>{
      hrBase: userHRBase,
      z0: 0,
      z1: 0,
      z2: 0,
      z3: 0,
      z4: 0,
      z5: 0
    };

    if (userAge !== null) {
      if (userMaxHR && userRestHR) {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          userHrInfo['z0'] = Math.floor((220 - userAge) * 0.5 - 1);
          userHrInfo['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
          userHrInfo['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
          userHrInfo['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
          userHrInfo['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
          userHrInfo['z5'] = Math.floor((220 - userAge) * 1);
        } else {
          userHrInfo['z0'] = Math.floor((userMaxHR - userRestHR) * (0.55)) + userRestHR;
          userHrInfo['z1'] = Math.floor((userMaxHR - userRestHR) * (0.6)) + userRestHR;
          userHrInfo['z2'] = Math.floor((userMaxHR - userRestHR) * (0.65)) + userRestHR;
          userHrInfo['z3'] = Math.floor((userMaxHR - userRestHR) * (0.75)) + userRestHR;
          userHrInfo['z4'] = Math.floor((userMaxHR - userRestHR) * (0.85)) + userRestHR;
          userHrInfo['z5'] = Math.floor((userMaxHR - userRestHR) * (1)) + userRestHR;
        }
      } else {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          userHrInfo['z0'] = Math.floor((220 - userAge) * 0.5 - 1);
          userHrInfo['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
          userHrInfo['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
          userHrInfo['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
          userHrInfo['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
          userHrInfo['z5'] = Math.floor((220 - userAge) * 1);
        } else {
          userHrInfo['z0'] = Math.floor(((220 - userAge) - userRestHR) * (0.55)) + userRestHR;
          userHrInfo['z1'] = Math.floor(((220 - userAge) - userRestHR) * (0.6)) + userRestHR;
          userHrInfo['z2'] = Math.floor(((220 - userAge) - userRestHR) * (0.65)) + userRestHR;
          userHrInfo['z3'] = Math.floor(((220 - userAge) - userRestHR) * (0.75)) + userRestHR;
          userHrInfo['z4'] = Math.floor(((220 - userAge) - userRestHR) * (0.85)) + userRestHR;
          userHrInfo['z5'] = Math.floor(((220 - userAge) - userRestHR) * (1)) + userRestHR;
        }
      }
    } else {
      userHrInfo['z0'] = 'Z0';
      userHrInfo['z1'] = 'Z1';
      userHrInfo['z2'] = 'Z2';
      userHrInfo['z3'] = 'Z3';
      userHrInfo['z4'] = 'Z4';
      userHrInfo['z5'] = 'Z5';
    }

    return userHrInfo;
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
  simplifyDPStep(points: Array<Point>, first: number, last: number, sqTolerance: number, simplified: Array<Point>) {
    let maxSqDist = sqTolerance,
        index: number;

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
        simplified = this.simplifyDPStep(points, first, index, sqTolerance, simplified)
      };

      simplified.push(points[index]);

      if (last > index + 1) {
        simplified = this.simplifyDPStep(points, index, last, sqTolerance, simplified)
      };

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
      return points
    };
    
    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
    points = this.simplifyDouglasPeucker(points, sqTolerance);

    return points;
  }

  /************************************************************************/

  /**
   * 將相同的x軸的數據合併，並均化相對應的y軸數據
   * @param xData {Array<number>}-x軸數據
   * @param yData {Array<Array<number>>}-y軸數據
   * @author kidin-1100205
   */
  handleRepeatXAxis(
    xData: Array<number>, yData: Array<Array<number>>, handleList: Array<string>
  ): {xAxis: Array<number>, yAxis: object} {

    const finalData = {
            xAxis: [],
            yAxis: {}
          };
    let repeatTotal = {},
        repeatLen = 0;

    for (let i = 0, xAxisLen = xData.length; i < xAxisLen; i++) {

      // 當前x軸數據與前一項x軸數據相同時，將y軸數據相加
      if ((i === 0 || xData[i] === xData[i -1]) && i !== xAxisLen - 1) {

        if (i === 0) {
          handleList.forEach(_list => {
            if (yData[_list]) {
              Object.assign(finalData.yAxis, {[_list]: []});
              Object.assign(repeatTotal, {[_list]: yData[_list][0]});
            }
            
          });
        } else {
          handleList.forEach(_list => {
            if (yData[_list]) repeatTotal[_list] += yData[_list][i];
          });

        }

        repeatLen++;

      // 當前x軸數據與前一項x軸數據不同
      } else {

        if (repeatLen) {
          finalData.xAxis.push(xData[i - 1]);
          handleList.forEach(_list => {
            if (finalData.yAxis[_list]) finalData.yAxis[_list].push(+(repeatTotal[_list] / repeatLen).toFixed(1));
          });

        }
        
        if (i !== xAxisLen - 1) {
          handleList.forEach(_list => {
            if (yData[_list]) repeatTotal[_list] = yData[_list][i];
          });

          repeatLen = 1;
        } else {
          finalData.xAxis.push(xData[i]);
          handleList.forEach(_list => {
            if (finalData.yAxis[_list]) finalData.yAxis[_list].push(yData[_list][i]);
          });

        }

      }

    }

    return finalData;
  }

}
