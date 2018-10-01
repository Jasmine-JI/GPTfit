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
import { UserInfo } from '../models/userInfo';

@Injectable()
export class DashboardGuard implements CanActivate {
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
    let isSupervisor = false,
      isSystemDeveloper = false,
      isSystemMaintainer = false,
      isMarketingDeveloper = false;
    const visittingId = next.params.groupId;
    let isLoading = false;
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      isSupervisor = res;
      console.log('%c this.isSupervisor', 'color: #ccc', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      isSystemDeveloper = res;
      console.log('%c this.isSystemDeveloper', 'color: #ccc', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      isSystemMaintainer = res;
      console.log('%c this.isSystemMaintainer', 'color: #ccc', res);
    });
    this.userInfoService.getMarketingDeveloperStatus().subscribe(res => {
      isMarketingDeveloper = res;
      console.log('%c this.isMarketingDeveloper', 'color: #ccc', res);
    });
    return this.userInfoService.getInitialUserInfoStatus().map((res: UserInfo) => {
      const { isInitial } = res;
      if (!isInitial) {
        const token = this.utils.getToken();
        const body = {
          token,
          iconType: 2
        };
        this.userInfoService.getUserInfo(body).then(() => {

          if (isSupervisor || isSystemDeveloper || isSystemMaintainer || isMarketingDeveloper) {
            this.utils.handleNextUrl(next);
            this.router.navigateByUrl(`/dashboard${this.utils.handleNextUrl(next)}`);
            return true;
          } else {
            this.router.navigateByUrl(`/403`);
            return false;
          }
        });
      } else {
        if (isSupervisor || isSystemDeveloper || isSystemMaintainer || isMarketingDeveloper) {
          return true;
        } else {
          this.router.navigateByUrl(`/403`);
          return false;
        }
      }
    });
  }
}
