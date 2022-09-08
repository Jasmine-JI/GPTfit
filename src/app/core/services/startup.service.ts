import { Injectable } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Injectable()
export class StartupService {
  constructor(private authService: AuthService) {}

  /**
   * 在web啟動時就埋入檢查token機制
   * @author kidin-1090721
   */
  load(): boolean {
    return this.checkStatus();
  }

  /**
   * token不存在就強迫登出
   * @author kidin-1090721
   */
  checkStatus(): boolean {
    if (!this.authService.isLogin.value) {
      this.authService.logout();
      return false;
    } else {
      this.authService.tokenLogin();
    }
  }
}
