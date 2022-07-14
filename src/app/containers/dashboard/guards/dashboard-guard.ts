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
import { Api11xxService } from '../../../core/services/api-11xx.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccessRight } from '../../../shared/enum/accessright';

@Injectable()
export class DashboardGuard implements CanActivate {

  constructor(
    private utils: UtilsService,
    private api11xxService: Api11xxService,
    private router: Router,
    private authService: AuthService
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    const token = this.authService.token;
    if (token) {
      return this.api11xxService.fetchMemberAccessRight({ token }).pipe(
        map((res: any) => {
          if (this.utils.checkRes(res)) {
            const { info: { groupAccessRight } } = res;
            const maxAccessRight = +groupAccessRight[0].accessRight;
            if (maxAccessRight < AccessRight.brandAdmin) {
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
