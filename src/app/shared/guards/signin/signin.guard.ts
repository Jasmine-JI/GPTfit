import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Injectable()
export class SigninGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkLogin();
  }
  checkLogin(): Observable<boolean> {
    // 儲存現在的 URL，這樣登入後可以直接回來這個頁面
    return this.authService.isLogin.pipe(
      take(1),
      map((res) => {
        if (res) {
          // 導回dashboard頁面
          this.router.navigate(['/dashboard']);
          return false;
        }

        return true;
      })
    );
  }
}
