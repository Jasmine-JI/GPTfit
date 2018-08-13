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
import { UserDetail } from '../models/userDetail';

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
    const visittingId = next.params.groupId;
    const role = {
      isSupervisor: false,
      isSystemDeveloper: false,
      isSystemMaintainer: false,
      isMarketingDeveloper: false
    };
    let userAccessRightDetail = {
      accessRight: 'null',
      isCanManage: false,
      isGroupAdmin: false
    };
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      role.isSupervisor = res;
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      role.isSystemDeveloper = res;
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      role.isSystemMaintainer = res;
    });
    this.userInfoService.getMarketingDeveloperStatus().subscribe(res => {
      role.isMarketingDeveloper = res;
    });
    this.userInfoService.getUserAccessRightDetail().subscribe(res => {
      userAccessRightDetail = res;
    });
    return this.userInfoService.getMemberAccessRight(body).map(_res => {
      const { info: { groupAccessRight } } = _res;
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '00' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setSupervisorStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '10' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setSystemDeveloperStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '20' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setSystemMaintainerStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '29' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setMarketingDeveloperStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '30' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setBrandAdministratorStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '40' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setBranchAdministratorStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '50' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setBroadcastProducerStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '60' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setCoachStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '80' && _group.joinStatus === 2) >
        -1
      ) {
        this.userInfoService.setGroupAdministratorStatus(true);
      }
      if (
        groupAccessRight.findIndex(_group => _group.accessRight === '90') >
        -1
      ) {
        this.userInfoService.setGeneralMemberStatus(true);
      }
      const { isSupervisor, isSystemDeveloper, isSystemMaintainer, isMarketingDeveloper } = role;
      const idx = groupAccessRight.findIndex(_group => _group.groupId === visittingId && _group.joinStatus === 2);
      if (isSupervisor) {
        this.userInfoService.setUserAccessRightDetail({
          accessRight: '00',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else if (isSystemDeveloper) {
        this.userInfoService.setUserAccessRightDetail({
          accessRight: '10',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else if (isSystemMaintainer) {
        this.userInfoService.setUserAccessRightDetail({
          accessRight: '20',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else if (isMarketingDeveloper) {
        this.userInfoService.setUserAccessRightDetail({
          accessRight: '29',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else {
        const groupLevel = this.utils.displayGroupLevel(visittingId);
        switch (groupLevel) {
          case '30':
            const brandIdx = groupAccessRight.findIndex(_group => _group.groupId === visittingId && _group.joinStatus === 2);
            if (brandIdx > -1) {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: groupAccessRight[brandIdx].accessRight,
                isCanManage: groupAccessRight[brandIdx].accessRight === '30',
                isGroupAdmin: groupAccessRight[brandIdx].accessRight === '30'
              });
            } else {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false
              });
            }
            break;
          case '40':
            const branchIdx = groupAccessRight.findIndex(_group => ((_group.groupId.slice(0, 5) === visittingId.slice(0, 5) && _group.accessRight === '30') || _group.groupId === visittingId) && _group.joinStatus === 2);
            if (branchIdx > -1) {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: groupAccessRight[branchIdx].accessRight,
                isCanManage: groupAccessRight[branchIdx].accessRight === '40' || groupAccessRight[branchIdx].accessRight === '30',
                isGroupAdmin: groupAccessRight[branchIdx].accessRight === '40' || groupAccessRight[branchIdx].accessRight === '30'
              });
            } else {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false
              });
            }
            break;
          case '60':
            const coachIdx = groupAccessRight.findIndex(_group => ((_group.groupId.slice(0, 5) === visittingId.slice(0, 5) && _group.accessRight === '30') || (_group.groupId.slice(0, 7) === visittingId.slice(0, 7) && _group.accessRight === '40') || _group.groupId === visittingId) && _group.joinStatus === 2);
            if (coachIdx > -1) {
              this.userInfoService.setUserAccessRightDetail({
                accessRight:
                  groupAccessRight[coachIdx].accessRight,
                isCanManage:
                  groupAccessRight[coachIdx].accessRight === '30'
                  ||
                  groupAccessRight[coachIdx].accessRight === '40'
                  ||
                  groupAccessRight[coachIdx].accessRight === '60',
                isGroupAdmin:
                  groupAccessRight[coachIdx].accessRight === '30'
                  ||
                  groupAccessRight[coachIdx].accessRight === '40'
                  ||
                  groupAccessRight[coachIdx].accessRight === '60'
              });
            } else {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false
              });
            }
            break;
          case '80':
            const normalIdx = groupAccessRight.findIndex(_group => _group.groupId === visittingId && _group.joinStatus === 2);
            if (normalIdx > -1) {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: groupAccessRight[normalIdx].accessRight,
                isCanManage: groupAccessRight[normalIdx].accessRight === '80',
                isGroupAdmin: groupAccessRight[normalIdx].accessRight === '80'
              });
            } else {
              this.userInfoService.setUserAccessRightDetail({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false
              });
            }
            break;
          default:
            this.userInfoService.setUserAccessRightDetail({
              accessRight: '90',
              isCanManage: false,
              isGroupAdmin: false
            });
        }
      }
      if (userAccessRightDetail.isCanManage) {
        return true;
      } else {
        this.router.navigateByUrl(`/dashboard/group-info/${visittingId}`);
        return false;
      }
    });
  }
}
