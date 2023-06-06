import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AuthService } from '../../services';
import { appPath } from '../../../app-path.const';

@Injectable()
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

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
    return this.authService.isLogin.pipe(
      take(1),
      map((res) => {
        if (res) return true;

        // 導回登入頁面
        this.router.navigate([`/${appPath.portal.signInWeb}`]);
        return false;
      })
    );
  }
}
