import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { MessageBoxComponent } from '../components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { AlbumType } from '../models/image';
import { HrZoneRange } from '../models/chart-data';
import moment from 'moment';
import { Unit, mi } from '../models/bs-constant';
import { SportType, SportCode } from '../models/report-condition';
import { GroupLevel } from '../../containers/dashboard/models/group-detail';
import { HrBase, hrBase } from '../../containers/dashboard/models/userProfileInfo';
export const TOKEN = 'ala_token';

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
  loadingProgress$ = new ReplaySubject<number>(1);

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

  /**
   * 將query string轉為物件，以方便取值
   * @param _search {string}-query string
   * @returns {any}-物件 {queryKey: queryValue }
   * @author kidin-1100707
   */
  getUrlQueryStrings(_search: string) {
    const search = _search || window.location.search,
          queryObj = {};
    let queryArr: Array<string>;
    if (!search) {
      return queryObj as any;
    } else {

      if (search.includes('?')) {
        queryArr = search.split('?')[1].split('&');
      } else {
        queryArr = search.split('&');
      }

      queryArr.forEach(_query => {
        const [_key, _value] = _query.split('=');
        Object.assign(queryObj, {[_key]: _value});
      });

      return queryObj as any;
    }

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

  /**
   * 根據群組id取得該群組階層
   * @param _id {string}-group id
   * @returns {number}-群組階層
   * @author kidin-1100512
   */
  displayGroupLevel(_id: string): number {
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

    // Set
    if (obj instanceof Set) {
      return new Set(obj);
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
   * 取得各心率區間
   * @param userHRBase {HrBase}-使用者心率法, 0.最大心率法 1.儲備心率法
   * @param userAge {number}
   * @param userMaxHR {number}
   * @param userRestHR {number}
   */
  getUserHrRange(userHRBase: HrBase, userAge: number, userMaxHR: number, userRestHR: number) {
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

        if (userHRBase === hrBase.max) {
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

        if (userHRBase === hrBase.max) {
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
   * 計算兩點gpx之間的距離（大圓距離）
   * @param gpxA {Array<number>}
   * @param gpxB {Array<number>}
   * @author kidin-1100324
   */
  countDistance(gpxA: Array<number>, gpxB: Array<number>) {
    const earthR = 6371,  // km
          radConst = Math.PI / 180,
          [φA, λA] = [...gpxA],
          [φB, λB] = [...gpxB];
    if (φA !== φB || λA !== λB) {
      const [φRA, λRA] = [...[φA * radConst, λA * radConst]],
            [φRB, λRB] = [...[φB * radConst, λB * radConst]],
      σ = Math.acos(Math.sin(φRA) * Math.sin(φRB) + Math.cos(φRA) * Math.cos(φRB) * Math.cos(Math.abs(λRB - λRA)));
      return +(earthR * σ * 1000).toFixed(0);
    } else {
      return 0;
    }
    
  }

  /**
   * 取得日期區間（日/週）
   * @param date {{startDate: string; endDate: string;}}-使用者所選日期範圍
   * @author kidin-1100401
   * @returns {'day' | 'week'}
   */
  getDateInterval(date: {startDate: string; endDate: string;}) {
    const { startDate, endDate } = date;
    if ((moment(endDate).diff(moment(startDate), 'days') + 1) <= 52) {
      return 'day';
    } else {
      return 'week';
    }

  }

  /**
   * 建立報告期間的timeStamp讓圖表使用
   * @param date {{start: string; end: string;}}-報告起始日期和結束日期
   * @author kidin-1100401
   */
  createTimeStampArr(date: {startDate: string; endDate: string;}) {
  const timeStampArr = [],
        { startDate, endDate } = date,
        range = moment(endDate).diff(moment(startDate), 'days') + 1,
        startTimestamp = moment(startDate).startOf('day').valueOf(),
        endTimestamp = moment(endDate).startOf('day').valueOf();

    if (this.getDateInterval(date) === 'day') {

      for (let i = 0; i < range; i++) {
        timeStampArr.push(startTimestamp + 86400000 * i);
      }

    } else {
      const weekCoefficient = this.findDate(startTimestamp, endTimestamp);
      for (let i = 0; i < weekCoefficient.weekNum; i++) {
        timeStampArr.push(weekCoefficient.startDate + 86400000 * i * 7);
      }

    }

    return timeStampArr;
  }

  /**
   * 根據搜索時間取得周報告第一周的開始日期和週數
   * @param startTimestamp {number}-開始時間
   * @param endTimestamp {number}-結束時間
   * @author kidin-1100401
   */
  findDate(startTimestamp: number, endTimestamp: number) {
    const week = {
      startDate: 0,
      weekNum: 0
    };

    let weekEndDate: number;
    // 周報告開頭是星期日-kidin-1090312
    if (moment(startTimestamp).isoWeekday() !== 7) {
      week.startDate = startTimestamp - 86400 * 1000 * moment(startTimestamp).isoWeekday();
    } else {
      week.startDate = startTimestamp;
    }

    if (moment(startTimestamp).isoWeekday() !== 7) {
      weekEndDate = endTimestamp - 86400 * 1000 * moment(endTimestamp).isoWeekday();
    } else {
      weekEndDate = endTimestamp;
    }

    week.weekNum = ((weekEndDate - week.startDate) / (86400 * 1000 * 7)) + 1;
    return week;
  }

  /**
   * 依運動類別將速度轉換成所需的配速格式
   * @param value {number}-速度
   * @param sportType {SportType}-運動類別
   * @param unit {Unit}-使用者所選的單位
   * @param type {'second' | 'minute'}-轉成純秒數或mm':ss"
   * @returns pace {number | string}
   * @author kidin-1100407
   */
  convertSpeed(value: number, sportType: SportType, unit: Unit, convertType: 'second' | 'minute'): number | string {
    let convertSpeed: number;
    switch (sportType) {
      case SportCode.swim:
        convertSpeed = value * 10;
        break;
      case SportCode.row:
        convertSpeed = value * 2;
        break;
      default:
        convertSpeed = unit === 0 ? value : value / mi;
        break;
    }

    const speed = convertSpeed <= 1 ? 1 : convertSpeed,  // 配速最小60'00"
          ttlSecond = this.rounding((3600 / speed), 1);
    switch (convertType) {
      case 'second':
        return ttlSecond;
      case 'minute':
        const minute = Math.floor(ttlSecond / 60),
              second = (ttlSecond - (minute * 60)).toFixed(0),
              minuteStr = `${minute}`.padStart(2, '0'),
              secondStr = second.padStart(2, '0');
        return `${minuteStr}'${secondStr}"`;
    }

  }

  /**
   * 將base64的圖片轉為檔案格式
   * @param albumType {number}-圖片類型
   * @param base64 {string}-base64圖片
   * @param fileName {檔案名稱}
   * @author kidin-1091127
   */
   base64ToFile(albumType: AlbumType, base64: string, fileName: string): File {
    const blob = this.dataUriToBlob(albumType, base64);
    return new File([blob], `${fileName}.jpg`, {type: 'image/jpeg'});
  }

  /**
   * 將數值依係數轉換為另一值
   * @param value {number}-待轉換的值
   * @param convert {boolean}-是否轉換
   * @param forward {boolean}-是否為公制轉英制
   * @param coefficient {number}-轉換係數
   * @param digit {number}-四捨五入的位數
   * @author kidin-1100820
   */
  valueConvert(
    value: number,
    convert: boolean,
    forward: boolean,
    coefficient: number,
    digit: number = null
  ) {
    if (convert) {

      if (forward) {
        const convertedVal = value / coefficient;
        return digit !== null ? this.rounding(convertedVal, digit) : convertedVal;
      } else {
        const convertedVal = value * coefficient;
        return digit !== null ? this.rounding(convertedVal, digit) : convertedVal;
      }

    } else {
      return digit !== null ? this.rounding(value, digit) : value;
    }

  }

  /**
   * 四捨五入至指定位數
   * @param value {number}-欲四捨五入的值
   * @param digit {number}-四捨五入的位數
   * @author kidin-1100820
   */
  rounding(value: number, digit: number) {
    return parseFloat(value.toFixed(digit));
  }

  /**
   * 取得功能性閾值功率區間
   * @param ftp {number}-功能性閾值功率
   * @author kidin-1100824
   */
  getUserFtpZone(ftp: number) {
    let ref = ftp ? ftp : 100;
    const userFtpZone = {
      z0: this.rounding(ref * 0.55, 0),
      z1: this.rounding(ref * 0.75, 0),
      z2: this.rounding(ref * 0.90, 0),
      z3: this.rounding(ref * 1.05, 0),
      z4: this.rounding(ref * 1.20, 0),
      z5: this.rounding(ref * 1.50, 0),
      z6: ''  // 最上層不顯示數值
    };

    return userFtpZone;
  }

  /**
   * 確認res resultCode是否回傳200(兼容兩個版本的response result)
   * @returns {boolean} resultCode是否回傳200
   * @author kidin-1100902
   */
  checkRes(res: any): boolean {
    const {
      processResult,
      resultCode: resCode,
      apiCode: resApiCode,
      resultMessage: resMsg
    } = res;
    if (!processResult) {

      if (resCode !== 200) {
        this.handleError(resCode, resApiCode, resMsg);
        return false;
      } else {
        return true;
      }
      
    } else {
      const { resultCode, apiCode, resultMessage } = processResult;
      if (resultCode !== 200) {
        this.handleError(resultCode, apiCode, resultMessage);
        return false;
      } else {
        return true;
      }

    }

  }

}
