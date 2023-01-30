import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalEventsService {
  private _componentUniqueId = 0;

  /**
   * 遮罩顯示狀態
   */
  showMask$ = new BehaviorSubject<boolean>(false);

  /**
   * nav折疊選單顯示狀態
   */
  openCollapse$ = new BehaviorSubject<boolean>(false);

  /**
   * 照片選擇與否
   */
  imgSelected$ = new BehaviorSubject<boolean>(false);

  /**
   * 隱藏上方導行列與否
   */
  hideNavbar$ = new BehaviorSubject<boolean>(false);

  /**
   * 暗黑模式(目前pedding，故不開放此功能)
   */
  darkMode$ = new BehaviorSubject<boolean>(false);

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
   * 儲存是否顯示遮罩的狀態
   * @param status {boolean}-狀態
   */
  setShowMaskStatus(status: boolean) {
    this.showMask$.next(status);
  }

  /**
   * 儲存是否顯示遮罩的狀態
   */
  getShowMaskStatus() {
    return this.showMask$;
  }

  /**
   * 儲存是否收合navbar功能選單的狀態
   * @param status {boolean}-狀態
   */
  setOpenCollapseStatus(status: boolean) {
    this.openCollapse$.next(status);
  }

  /**
   * 儲存是否收合navbar功能選單的狀態
   */
  getOpenCollapseStatus() {
    return this.openCollapse$;
  }

  /**
   * 儲存隱藏上方導航列與否狀態
   * @param status {boolean}-是否隱藏上方導航列狀態
   */
  setHideNavbarStatus(status: boolean) {
    this.hideNavbar$.next(status);
  }

  /**
   * 取得隱藏上方導航列與否狀態
   * @param status {boolean}-是否隱藏上方導航列狀態
   */
  getHideNavbarStatus(): Observable<boolean> {
    return this.hideNavbar$;
  }

  /**
   * 設定暗黑模式狀態
   * @param status {boolean}-暗黑模式狀態
   */
  setDarkModeStatus(status: boolean) {
    this.darkMode$.next(status);
  }

  /**
   * 取得暗黑模式狀態
   */
  getDarkModeStatus(): Observable<boolean> {
    return this.darkMode$;
  }

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
