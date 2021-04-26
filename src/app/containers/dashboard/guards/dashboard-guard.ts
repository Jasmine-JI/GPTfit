import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from '../../../shared/services/utils.service';
import { UserProfileService } from '../../../shared/services/user-profile.service';

@Injectable()
export class DashboardGuard implements CanActivate {

  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    return this.userProfileService.getRxUserProfile().pipe(
      map(res => {
        const { systemAccessRight } = res || {systemAccessRight: undefined};
        if (systemAccessRight) {

          if (systemAccessRight[0] < 30) {
            return true;
          } else {
            this.router.navigateByUrl(`/403`);
            return false;
          }

        } else {
          this.router.navigateByUrl(`/signIn-web`);
          return false;
        }

      })

    );

  }

}
