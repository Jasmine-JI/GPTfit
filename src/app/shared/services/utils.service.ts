import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { stringify } from 'query-string';

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
  removeLocalStorageObject(key: string) {
    if (this.getLocalStorageObject(key)) {
      localStorage.removeItem(key);
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
      return `data:image/jpg; base64, ${value}`;
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
      const arr = _id.split('-').splice(2, 3);
      if (+arr[0] > 0) {
        return '品牌';
      } else if (+arr[1] > 0) {
        return '分店';
      } else if (+arr[2] > 0) {
        return '課程';
      } else {
        return '一般群組';
      }
    }
  }
  replaceCarriageReturn(string = '', format = '') {
    return string.replace(/(\r\n|\r|\n)/gm, format);
  }
}
