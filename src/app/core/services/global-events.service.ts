import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalEventsService {
  sideBarMode$ = new ReplaySubject<any>(1); // sidebar展開與否

  constructor() {}

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
}
