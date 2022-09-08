import { Injectable } from '@angular/core';
import { Api50xxService } from '../../../core/services/api-50xx.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { checkResponse } from '../../../shared/utils/index';
import { TranslateService } from '@ngx-translate/core';
import { ReadStatus } from '../enum/station-mail';

@Injectable({
  providedIn: 'root',
})
export class StationMailService {
  /**
   * 站內信列表
   */
  private _mailList$ = new BehaviorSubject(<Array<any>>[]);

  /**
   * 收件匣刪除事件
   */
  private _deleteList$ = new ReplaySubject<Array<number>>(1);

  /**
   * 常用名單
   */
  private _favoriteList$ = new BehaviorSubject(<Array<any> | null>null);

  /**
   * 黑名單
   */
  private _blackList$ = new BehaviorSubject(<Array<any> | null>null);

  /**
   * 新訊息通知
   */
  private _newMailNotify = new BehaviorSubject(false);

  constructor(
    private api50xxService: Api50xxService,
    private authService: AuthService,
    private translateService: TranslateService
  ) {}

  /**
   * 取得新訊息狀態通知
   */
  get rxNewMailNotify() {
    return this._newMailNotify;
  }

  /**
   * 取得信件清單
   */
  get rxMailList() {
    return this._mailList$;
  }

  /**
   * 取得收件匣刪除事件
   */
  get rxDeleteList() {
    return this._deleteList$;
  }

  /**
   * 儲存新訊息狀態
   * @param status {boolean}-新訊息通知狀態
   */
  setNewMailNotify(status: boolean) {
    this._newMailNotify.next(status);
  }

  /**
   * 更新站內信列表
   */
  refreshMailList(index = 0): Observable<Array<any>> {
    const countryRegion = this.translateService.currentLang.split('-')[1].toUpperCase();
    const counts = 100;
    const body = {
      token: this.authService.token,
      countryRegion,
      page: {
        index,
        counts,
      },
    };

    return this.api50xxService.fetchMessageList(body).pipe(
      switchMap((res) => {
        if (checkResponse(res)) {
          const {
            message,
            page: { totalCounts },
          } = res;
          const listNotAll = totalCounts > counts * (index + 1);
          if (listNotAll) {
            index++;
            return this.refreshMailList(index).pipe(map((nextRes) => message.concat(nextRes)));
          } else {
            return of(message);
          }
        } else {
          return of([]);
        }
      }),
      map((result) => {
        const processingList = this.addSelectedOption(result);
        this._mailList$.next(processingList);
        return processingList;
      })
    );
  }

  /**
   * 將信件列表加上是否選擇的flag，方便後續批次選擇信件進行動作
   * @param list {Array<any>}-信件列表
   */
  addSelectedOption(list: Array<any>) {
    return list.map((_list) => {
      _list.selected = false;
      return _list;
    });
  }

  /**
   * 觸發刪除事件
   * @param deleteList {Array<number>}-刪除之信件id清單
   */
  saveDeleteList(deleteList: Array<number>) {
    this._deleteList$.next(deleteList);
  }

  /**
   * 取得常用名單
   */
  getFavoriteList() {
    return this._favoriteList$.pipe(
      switchMap((list) => {
        const body = { token: this.authService.token };
        return list
          ? of(list)
          : this.api50xxService.fetchAddressBook(body).pipe(
              map((result) => (checkResponse(result) ? result.contactList : [])),
              tap((result) => this._favoriteList$.next(result))
            );
      })
    );
  }

  /**
   * 取得黑名單
   */
  getBlackList() {
    return this._blackList$.pipe(
      switchMap((list) => {
        const body = { token: this.authService.token };
        return list
          ? of(list)
          : this.api50xxService.fetchBlackList(body).pipe(
              map((result) => (checkResponse(result) ? result.blackList : [])),
              tap((result) => this._blackList$.next(result))
            );
      })
    );
  }

  /**
   * 儲存常用名單
   * @param list {Array<number>}-常用名單
   */
  saveFavoriteList(list: Array<number>) {
    this._favoriteList$.next(list);
  }

  /**
   * 儲存常用黑名單
   * @param list {Array<number>}-黑名單
   */
  saveBlackList(list: Array<number>) {
    this._blackList$.next(list);
  }

  /**
   * 將信件狀態變更為已讀狀態
   * @param id {number}-訊息編號
   */
  editReadStatus(id: number) {
    const newList = this._mailList$.value.map((_list) => {
      const { id: _id } = _list;
      if (id == _id) _list.readStatus = ReadStatus.read;
      return _list;
    });

    this._mailList$.next(newList);
  }
}
