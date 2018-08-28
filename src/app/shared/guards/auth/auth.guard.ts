import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthService } from '../../services/auth.service';
import 'rxjs/add/operator/take';

@Injectable()
export class AuthGuard implements CanActivate {
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
    return this.authService
      .getLoginStatus()
      .take(1)
      .map(res => {
        if (res) {
          return true;
        }
        // 導回登入頁面
        this.router.navigate(['/signin']);
        return false;
      });
  }
}