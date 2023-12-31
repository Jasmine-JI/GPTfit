import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProfessionalService } from '../../professional/services/professional.service';
import { AccessRight } from '../../../core/enums/common';
import { UserService, HashIdService } from '../../../core/services';
import { displayGroupLevel } from '../../../core/utils';
import { appPath } from '../../../app-path.const';

@Injectable()
export class EditGroupGuard {
  visittingId = '';

  constructor(
    private router: Router,
    private hashIdService: HashIdService,
    private professoinalService: ProfessionalService,
    private userService: UserService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    this.visittingId = this.hashIdService.handleGroupIdDecode(next.params.groupId);
    if (this.visittingId.length === 0) {
      this.router.navigateByUrl(`/404`);
      return false;
    }

    const groupLevel = +displayGroupLevel(this.visittingId);
    return this.professoinalService.groupAccessright.pipe(
      map((groupAccessright) => {
        const { systemAccessright } = this.userService.getUser();
        if (systemAccessright <= AccessRight.marketing) return true;
        if (groupAccessright <= groupLevel) return true;

        const hashGroupId = this.hashIdService.handleGroupIdEncode(this.visittingId);
        const {
          dashboard,
          professional: { groupDetail },
        } = appPath;
        this.router.navigateByUrl(`/${dashboard}/${groupDetail.home}/${hashGroupId}`);
        return false;
      })
    );
  }
}
