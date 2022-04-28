import { Injectable } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { UserService } from './user.service';
import { TOKEN } from '../../shared/models/utils-constant';

@Injectable()
export class StartupService {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

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
    if (!this.authService.isLogin()) {
      this.authService.logout();
      this.userService.logout();
      return false;
    } else {
      this.userService.tokenLogin();
    }

  }

}
