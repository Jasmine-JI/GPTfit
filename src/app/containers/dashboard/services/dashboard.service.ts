import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { EditMode } from '../models/personal';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  sideBarMode$ = new ReplaySubject<any>(1); // sidebar展開與否
  editMode$ = new ReplaySubject<EditMode>(1); // 是否進入編輯模式或建立模式

  constructor() { }

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
   * 設置編輯模式以傳達給父組件
   * @param mode {EditMode}-是否進入編輯模式或完成編輯
   * @author kidin-1100812
   */
  setRxEditMode(mode: EditMode) {
    this.editMode$.next(mode);
  }

  /**
   * 取得現在的編輯模式
   * @author kidin-1100812
   */
  getRxEditMode(): Observable<EditMode> {
    return this.editMode$;
  }

}
