import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from '../../../shared/services/utils.service';
import { pageNoAccessright } from '../models/official-activity-const';
import { AccessRight } from '../../../shared/enum/accessright';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';


@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private utils: UtilsService,
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
      const { systemAccessright } = this.userService.getUser();
      const passAdmin = [AccessRight.auditor, AccessRight.pusher];
      if (passAdmin.includes(systemAccessright)) return true;
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
