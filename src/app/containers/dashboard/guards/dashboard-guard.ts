import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from '../../../shared/services/utils.service';
import { UserProfileService } from '../../../shared/services/user-profile.service';

@Injectable()
export class DashboardGuard implements CanActivate {

  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    const token = this.utils.getToken();
    if (token) {

      return this.userProfileService.getMemberAccessRight({token}).pipe(
        map(res => {
          if (this.utils.checkRes(res)) {
            const { info: { groupAccessRight } } = res,
                  maxAccessRight = +groupAccessRight[0].accessRight;
            if (maxAccessRight < 30) {
              return true;
            } else {
              return this.checkAccessRightFailed('403');
            }

          } else {
            return this.checkAccessRightFailed('signIn-web');
          }

        })

      );

    } else {
      return this.checkAccessRightFailed('signIn-web');
    }

  }

  /**
   * 驗證失敗後轉導其他路徑
   * @param path {'403' | 'signIn-web'}-轉導路徑
   */
  checkAccessRightFailed(path: '403' | 'signIn-web') {
    this.router.navigateByUrl(`/${path}`);
    return false;
  }

}
