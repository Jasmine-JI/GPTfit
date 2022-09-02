import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalEventsService {
  private _componentUniqueId = 0;

  /**
   * sidebar展開與否
   */
  sideBarMode$ = new ReplaySubject<any>(1);

  /**
   * 現在的下拉選單id
   */
  currentDropList$ = new ReplaySubject<number>(1);

  constructor() {}

  /**
   * 取得唯一碼
   */
  getComponentUniqueId() {
    this._componentUniqueId++;
    return this._componentUniqueId;
  }

  /**
   * 取得sidebar 模式供子頁面用
   * @author kidin-1091111
   */
  getRxSideBarMode() {
    return this.sideBarMode$;
  }

  /**
   * 儲存sidebar模式供子頁面用
   * @param status {'expand' | 'hide' | 'narrow'}-sidebar 模式
   * @author kidin-1091111
   */
  setSideBarMode(status: 'expand' | 'hide' | 'narrow') {
    this.sideBarMode$.next(status);
  }

  /**
   * 取得關閉下拉選單的指令
   */
  getRxCloseDropList() {
    return this.currentDropList$;
  }

  /**
   * 透過next發送關閉下拉選單的指令
   * @param componentId {number}-元件id
   */
  setRxCloseDropList(componentId: number) {
    this.currentDropList$.next(componentId);
  }
}
