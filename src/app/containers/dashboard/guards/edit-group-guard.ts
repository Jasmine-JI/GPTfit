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
import { UserInfoService } from '../services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';
import { UserDetail } from '../models/userDetail';

@Injectable()
export class EditGroupGuard implements CanActivate {
  constructor(
    private userInfoService: UserInfoService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = this.utils.getToken();
    const body = { token };
    let isBrandAdministrator = false,
      isSupervisor = false,
      isSystemDeveloper = false,
      isSystemMaintainer = false,
      isMarketingDeveloper = false;
    const visittingId = next.params.groupId;
    return this.userInfoService.getUserAccessRightDetail().map((result: UserDetail) => {
      const { isCanManage } = result;
      if (isCanManage) {
        return true;
      } else {
      this.router.navigateByUrl(`/dashboard/group-info/${visittingId}`);
      return false;          
      }
    });
  }
}
