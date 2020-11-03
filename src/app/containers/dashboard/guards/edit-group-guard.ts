import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupService } from '../services/group.service'
import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';

@Injectable()
export class EditGroupGuard implements CanActivate {

  systemAccessRight = 99;
  groupAccessRight = 99;
  visittingId = '';

  constructor(
    private utils: UtilsService,
    private router: Router,
    private hashIdService: HashIdService,
    private groupService: GroupService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    this.visittingId = this.hashIdService.handleGroupIdDecode(next.params.groupId);
    if (this.visittingId.length === 0) {
      this.router.navigateByUrl(`/404`);
      return false;
    }

    const groupLevel = +this.utils.displayGroupLevel(this.visittingId);
    return this.groupService.checkAccessRight(this.visittingId).pipe(
      map(res => {
        const maxAccessRight = res[0] || 99;
        if (maxAccessRight <= groupLevel) {
          return true;
        } else {
          const hashGroupId = this.hashIdService.handleGroupIdEncode(this.visittingId);
          this.router.navigateByUrl(`/dashboard/group-info/${hashGroupId}`);
          return false;
        }

      })

    );

  }

}
