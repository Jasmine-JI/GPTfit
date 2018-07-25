import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  ActivatedRoute,
  Router
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import { UserInfoService } from '../services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';

@Injectable()
export class EditGroupGuard implements CanActivate {
  constructor(
    private userInfoService: UserInfoService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = this.utils.getToken();
    const body = { token };
    let isBrandAdministrator = false,
      isSupervisor = false,
      isSystemDeveloper = false,
      isSystemMaintainer = false,
      isMarketingDeveloper = false;
    return this.userInfoService.getMemberAccessRight(body).map(
      res => {
        const {
          info: { groupAccessRight }
        } = res;
        const visittingId = next.params.groupId;
        this.userInfoService.getSupervisorStatus().subscribe(_isSupeervisorAns => {
          isSupervisor = _isSupeervisorAns;
        });
        this.userInfoService
          .getSystemDeveloperStatus()
          .subscribe(_isSystemDeveloperAns => isSystemDeveloper = _isSystemDeveloperAns );
        this.userInfoService
          .getSystemMaintainerStatus()
          .subscribe(_isSystemMaintainerAns => isSystemMaintainer = _isSystemMaintainerAns);
        this.userInfoService.getMarketingDeveloperStatus().subscribe(_isMarketingDeveloperAns =>
          isMarketingDeveloper = _isMarketingDeveloperAns);
        this.userInfoService.getBrandAdministratorStatus().subscribe(ans => isBrandAdministrator = ans);
        console.log('isSupervisor: ', isSupervisor);
        console.log('isSystemDeveloper: ', isSystemDeveloper);
        console.log('isSystemMaintainer: ', isSystemMaintainer);
        console.log('isMarketingDeveloper: ', isMarketingDeveloper);
        console.log('isBrandAdministrator: ', isBrandAdministrator);
        if (isSupervisor || isSystemDeveloper || isSystemMaintainer || isMarketingDeveloper) {
          return true;
        }
        if (isBrandAdministrator) {
          const brandGroups = groupAccessRight.filter(_group => _group.accessRight === '30');
          if (brandGroups.findIndex(_brandGroup => _brandGroup.groupId.slice(0, 5) === visittingId.slice(0, 5) > -1)) {
            return true;
          }
        }
        const groups = groupAccessRight.filter(_group => _group.joinStatus === 2);
        if (groups.findIndex(_group => _group.groupId === visittingId) > -1) {
          return true;
        } else {
          this.router.navigateByUrl('/404'); // 因為未符合權限，所以讓他找不到這個頁面
          return false;
        }
      },
      err => {
        return false;
      }
    );
  }
}
