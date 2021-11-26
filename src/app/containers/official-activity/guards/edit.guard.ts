import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { EditActivityComponent } from '../components/edit-activity/edit-activity.component';

@Injectable({
  providedIn: 'root'
})
export class EditGuard implements CanDeactivate<EditActivityComponent> {
  canDeactivate(
    component: EditActivityComponent,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if (!component.uiFlag.isSaved) {
        return confirm('尚未儲存編輯內容，是否離開此頁面？');
      } else {
        return true;
      }
      
  }
  
}
