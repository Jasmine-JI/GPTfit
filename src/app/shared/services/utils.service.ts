import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { stringify, parse } from 'query-string';
import {  FormGroup } from '@angular/forms';
export const TOKEN = 'ala_token';
export const EMPTY_OBJECT = {};

@Injectable()
export class UtilsService {
  setLocalStorageObject(key: string, value) {
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
        return '80';
      } else if (+arr[2] > 0) {
        return '60';
      } else if (+arr[1] > 0) {
        return '40';
      } else {
        return '30';
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

}
