import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanDeactivate
} from '@angular/router';
import { Observable } from 'rxjs';
import { EditOfficialActivityComponent } from '../components/official-activity-manage/edit-official-activity/edit-official-activity.component';

@Injectable()
export class UnsaveGuard implements CanDeactivate<EditOfficialActivityComponent> {

  canDeactivate(
    component: EditOfficialActivityComponent,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!component.uiFlag.isSaved) {
      return confirm('尚未儲存編輯內容，是否離開此頁面？');
    } else {
      return true;
    }
  }

}
