import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import 'rxjs/add/operator/take';
import { UserInfoService } from '../services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';
import { UserInfo } from '../models/userInfo';

@Injectable()
export class DashboardGuard implements CanActivate {

  isSupervisor = false;
  isSystemDeveloper = false;
  isSystemMaintainer = false;
  isMarketingDeveloper = false;

  constructor(
    private userInfoService: UserInfoService,
    private utils: UtilsService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {

    return this.userInfoService.getInitialUserInfoStatus().pipe(
      map((res: UserInfo) => {
        const { isInitial } = res;
        if (!isInitial) {
          const token = this.utils.getToken() || '';
          const body = {
            token,
            avatarType: 2,
            iconType: 2
          };
          this.userInfoService.getUserInfo(body).then(() => {
            this.getAuthority();
            if (this.isSupervisor || this.isSystemDeveloper || this.isSystemMaintainer || this.isMarketingDeveloper) {
              this.utils.handleNextUrl(next);
              this.router.navigateByUrl(`/dashboard${this.utils.handleNextUrl(next)}`);
              return true;
            } else {
              this.router.navigateByUrl(`/403`);
              return false;
            }
          });
        } else {
          this.getAuthority();
          if (this.isSupervisor || this.isSystemDeveloper || this.isSystemMaintainer || this.isMarketingDeveloper) {
            return true;
          } else {
            this.router.navigateByUrl(`/403`);
            return false;
          }
        }
      })
    );

  }

  getAuthority () {
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.isSupervisor = res;
      // console.log('%c this.isSupervisor', 'color: #ccc', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.isSystemDeveloper = res;
      // console.log('%c this.isSystemDeveloper', 'color: #ccc', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.isSystemMaintainer = res;
      // console.log('%c this.isSystemMaintainer', 'color: #ccc', res);
    });
    this.userInfoService.getMarketingDeveloperStatus().subscribe(res => {
      this.isMarketingDeveloper = res;
      // console.log('%c this.isMarketingDeveloper', 'color: #ccc', res);
    });
  }
}
