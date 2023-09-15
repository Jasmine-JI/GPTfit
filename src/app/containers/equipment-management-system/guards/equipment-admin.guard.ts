import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService, UserService } from '../../../core/services';
import { Observable, filter, map } from 'rxjs';
import { AccessRight } from '../../../core/enums/common';
import { equipmentManagementNoPermission } from '../equipment-management-routing.module';

@Injectable({
  providedIn: 'root',
})
export class equipmentAdminGuard {
  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = this.authService.token;
    if (token) {
      return this.userService.getUser().rxUserProfile.pipe(
        filter((userProfile: any) => userProfile.userId > 0),
        map((userProfile) => {
          const { systemAccessright } = this.userService.getUser();
          return systemAccessright <= AccessRight.marketing ? true : this.checkAccessRightFailed();
        })
      );
    } else {
      return this.checkAccessRightFailed();
    }
  }

  /**
   * 驗證失敗後轉導其他路徑
   * @author kidin-1101209
   */
  checkAccessRightFailed() {
    this.router.navigateByUrl(equipmentManagementNoPermission);
    return false;
  }
}
