import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Api11xxService, AuthService, ApiCommonService } from '../../../core/services';
import { AccessRight } from '../../../core/enums/common';
import { appPath } from '../../../app-path.const';

@Injectable()
export class DashboardGuard {
  constructor(
    private apiCommonService: ApiCommonService,
    private api11xxService: Api11xxService,
    private router: Router,
    private authService: AuthService
  ) {}
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const token = this.authService.token;
    const { pageNoPermission, portal } = appPath;
    if (token) {
      return this.api11xxService.fetchMemberAccessRight({ token }).pipe(
        map((res: any) => {
          if (this.apiCommonService.checkRes(res)) {
            const {
              info: { groupAccessRight },
            } = res;
            const maxAccessRight = +groupAccessRight[0].accessRight;
            if (maxAccessRight < AccessRight.brandAdmin) {
              return true;
            } else {
              return this.checkAccessRightFailed(pageNoPermission);
            }
          } else {
            return this.checkAccessRightFailed(portal.signInWeb);
          }
        })
      );
    } else {
      return this.checkAccessRightFailed(portal.signInWeb);
    }
  }

  /**
   * 驗證失敗後轉導其他路徑
   * @param path 轉導路徑
   */
  checkAccessRightFailed(path: string) {
    this.router.navigateByUrl(`/${path}`);
    return false;
  }
}
