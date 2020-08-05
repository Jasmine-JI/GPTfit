import { Injectable, Injector } from '@angular/core';
import { AuthService } from './auth.service';
import { UserProfileService } from '../services/user-profile.service';
import { UtilsService } from '../services/utils.service';

@Injectable()
export class StartupService {
  constructor(
    private injector: Injector,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private utils: UtilsService
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
      return false;
    } else {
      // 使用者登入就存取身體資訊供各種圖表使用-kidin-1081212
      const userProfileBody = {
        token: this.utils.getToken() || ''
      };

      this.userProfileService.refreshUserProfile(userProfileBody);
      return true;
    }

  }

}
