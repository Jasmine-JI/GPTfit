import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  ActivatedRoute,
  Router
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import { GroupService } from '../services/group.service';
import { UtilsService } from '@shared/services/utils.service';

@Injectable()
export class EditGroupGuard implements CanActivate {
  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = this.utils.getToken();
    const body = { token, groupId: next.params.groupId };
    return this.groupService.fetchGroupListDetail(body).map(
      res => {
        const {
          info: { selfJoinStatus }
        } = res;
        if (selfJoinStatus && selfJoinStatus === 2) {
          return true;
        } else {
          window.history.back();
          return false;
        }
      },
      err => {
        return false;
      }
    );
  }
}
