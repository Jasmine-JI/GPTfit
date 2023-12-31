import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { pageNoAccessright } from '../models/official-activity-const';
import { AccessRight } from '../../../core/enums/common';
import { AuthService, UserService } from '../../../core/services';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard {
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
          const passAdmin = [AccessRight.auditor, AccessRight.pusher];
          return passAdmin.includes(systemAccessright) ? true : this.checkAccessRightFailed();
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
    this.router.navigateByUrl(pageNoAccessright);
    return false;
  }
}
