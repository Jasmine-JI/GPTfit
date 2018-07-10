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
    console.log('!!!!', next.params.groupId);
    return this.checkLogin(next.params.groupId);
  }
  checkLogin(groupId): Observable<boolean> {
    this.token = this.utils.getToken();
    // this.groupId = this.route.snapshot.params.groupId;
    const body = {
      token: this.token,
      groupId: groupId
    };
    console.log('我進來啦');
    return this.groupService.fetchGroupListDetail(body).subscribe(
      res => {
        const {
          info: { selfJoinStatus }
        } = res;
        // this.router.navigate(['/dashboard', 'group-info', groupId, 'edit']);
        return false;
        // if (selfJoinStatus && selfJoinStatus === 2) {
        //   console.log('身分OK');
        //   return true;
        // } else {
        //   console.log('selfJoinStatus: ', selfJoinStatus);
        //   window.history.back();
        //   return false;
        // }
      },
      err => {
        window.history.back();
        return false;
      }
    );
  }
}
