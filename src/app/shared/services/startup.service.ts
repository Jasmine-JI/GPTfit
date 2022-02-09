import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserProfileService } from '../services/user-profile.service';
import { UtilsService } from '../services/utils.service';

@Injectable()
export class StartupService {
  constructor(
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
    }

  }

}
