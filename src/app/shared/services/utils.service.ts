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
}
