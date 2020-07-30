import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class StartupService {
  constructor(
    private injector: Injector,
    private authService: AuthService,
  ) {}

  /**
   * 每隔5分鐘確認一次localstorage是否存有token，沒有就導回登入頁
   * @author kidin-1090721
   */
  checkUserEvent = new Promise((resolve, reject) => {
    return this.authService.checkUser().subscribe(res => {
      if (res) {
        setInterval(() => {
          this.checkStatus();
        }, 1000 * 60 * 5); // check current status every 5 min
      }
      resolve(res);
    }, err => {
      console.log(err);
      reject(err);
    });
  });

  /**
   * 在web啟動時就埋入檢查token機制
   * @author kidin-1090721
   */
  load(): Promise<any> {
    return this.checkUserEvent;
  }

  /**
   * token不存在就登出並導回登入頁
   * @author kidin-1090721
   */
  checkStatus() {
    if (this.authService.isTokenExpired()) {   // if token expired
      this.authService.logout();
      const router = this.injector.get(Router);
      router.navigate(['/signIn-web']);
    }
  }
}
