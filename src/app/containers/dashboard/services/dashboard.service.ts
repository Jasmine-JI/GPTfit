import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { EditMode } from '../models/personal';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  editMode$ = new ReplaySubject<EditMode>(1); // 是否進入編輯模式或建立模式

  constructor() {}

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
