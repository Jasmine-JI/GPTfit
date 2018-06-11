import { Injectable } from '@angular/core';

export const TOKEN = 'ala_token';
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
    } else {
      return `data: image / jpg; base64, ${value}`;
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
}
