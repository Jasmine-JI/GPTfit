import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { UserProfileService } from '../../services/user-profile.service';
import { UtilsService } from '../../services/utils.service';
import 'rxjs/add/operator/take';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;
    return this.checkLogin(url);
  }

  checkLogin(url: string): Observable<boolean> {
    // 儲存現在的 URL，這樣登入後可以直接回來這個頁面
    this.authService.backUrl = url;
    return this.authService.getLoginStatus().pipe(
      take(1),
      map(res => {
        if (res) {
          // 使用者登入就存取身體資訊供各種圖表使用-kidin-1081212
          const userProfileBody = {
            token: this.utils.getToken() || ''
          };

          this.userProfileService.refreshUserProfile(userProfileBody);
          return true;
        }
        // 導回登入頁面
        this.router.navigate(['/signIn-web']);
        return false;
      })

    );

  }

}
