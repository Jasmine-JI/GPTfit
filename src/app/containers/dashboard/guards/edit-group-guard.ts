import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from '../../../shared/services/utils.service';
import { HashIdService } from '../../../shared/services/hash-id.service';
import { ProfessionalService } from '../../professional/services/professional.service';
import { AccessRight } from '../../../shared/enum/accessright';
import { UserService } from '../../../core/services/user.service';

@Injectable()
export class EditGroupGuard implements CanActivate {
  visittingId = '';

  constructor(
    private utils: UtilsService,
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

    const groupLevel = +this.utils.displayGroupLevel(this.visittingId);
    return this.professoinalService.groupAccessright.pipe(
      map((groupAccessright) => {
        const { systemAccessright } = this.userService.getUser();
        if (systemAccessright <= AccessRight.marketing) return true;
        if (groupAccessright <= groupLevel) return true;

        const hashGroupId = this.hashIdService.handleGroupIdEncode(this.visittingId);
        this.router.navigateByUrl(`/dashboard/group-info/${hashGroupId}`);
        return false;
      })
    );
  }
}
