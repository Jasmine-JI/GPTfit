import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { UtilsService } from './utils.service';
import { AuthService } from '../../containers/portal/services/auth.service';
@Injectable()
export class StartupService {
  constructor(
    private injector: Injector,
    private utils: UtilsService,
    private authService: AuthService
  ) {}
  load(): Promise<any> {
    return new Promise((resolve, reject) => {
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
  }
  checkStatus() {
    if (this.authService.isTokenExpired()) {   // if token expired
      this.authService.logout();
      const router = this.injector.get(Router);
      router.navigate(['/signin']);
    }
  }
}
