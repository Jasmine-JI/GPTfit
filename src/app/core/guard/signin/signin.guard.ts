import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AuthService } from '../../services';
import { appPath } from '../../../app-path.const';

@Injectable()
export class SigninGuard {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkLogin();
  }
  checkLogin(): Observable<boolean> {
    // 儲存現在的 URL，這樣登入後可以直接回來這個頁面
    return this.authService.isLogin.pipe(
      take(1),
      map((res) => {
        if (res) {
          // 導回dashboard頁面
          this.router.navigate([`/${appPath.dashboard.home}`]);
          return false;
        }

        return true;
      })
    );
  }
}
