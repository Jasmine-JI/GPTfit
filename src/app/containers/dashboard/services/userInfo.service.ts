import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { UserInfo } from '../models/userInfo';
import { UserDetail } from '../models/userDetail';
import { UtilsService } from '@shared/services/utils.service';
import { AuthService } from '@shared/services/auth.service';
import * as moment from 'moment';
import { _getComponentHostLElementNode } from '@angular/core/src/render3/instructions';


@Injectable()
export class UserInfoService {
  userName$ = new BehaviorSubject<string>('');
  userAge$ = new BehaviorSubject<number>(null);
  userMaxHR$ = new BehaviorSubject<number>(null);
  userRestHR$ = new BehaviorSubject<number>(null);
  userHRBase$ = new BehaviorSubject<number>(null);

  // groupId$ = new BehaviorSubject<string>('0-0-0-0-0-0');
  userIcon$ = new BehaviorSubject<string>('');
  isSupervisor$ = new BehaviorSubject<boolean>(false);
  isSystemDeveloper$ = new BehaviorSubject<boolean>(false);
  isSystemMaintainer$ = new BehaviorSubject<boolean>(false);
  isMarketingDeveloper$ = new BehaviorSubject<boolean>(false);
  isBrandAdministrator$ = new BehaviorSubject<boolean>(false);
  isBranchAdministrator$ = new BehaviorSubject<boolean>(false);
  isBroadcastProducer$ = new BehaviorSubject<boolean>(false);
  isCoach$ = new BehaviorSubject<boolean>(false);
  isGroupAdministrator$ = new BehaviorSubject<boolean>(false);
  isGeneralMember$ = new BehaviorSubject<boolean>(false);
  userId$ = new BehaviorSubject<number>(null);
  updatedImg$ = new BehaviorSubject<string>('');
  initialUserInfo$ = new BehaviorSubject<any>({
    isInitial: false,
    groupAccessRight: []
  });
  userAccessRightDetail$ = new BehaviorSubject<any>({
    accessRight: 'none',
    isCanManage: false,
    isGroupAdmin: false,
    isApplying: false
  });

  private userBodyInfo = [];

  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private authService: AuthService,
    private injector: Injector,
  ) { }
  getLogonData(body) {
    return this.http.post<any>('/api/v1/user/getLogonData', body);
  }
  refreshToken(body) {
    return this.http.post<any>('/api/v1/user/refreshToken', body);
  }
  getUserIcon(): Observable<string> {
    return this.userIcon$;
  }

  getUpdatedImgStatus(): Observable<string> {
    return this.updatedImg$;
  }

  getUserName(): Observable<string> {
    return this.userName$;
  }
  getUserId(): Observable<number> {
    return this.userId$;
  }
  getUserAge(): Observable<number> {
    return this.userAge$;
  }
  getUserMaxHR(): Observable<number> {
    return this.userMaxHR$;
  }
  getUserRestHR(): Observable<number> {
    return this.userRestHR$;
  }
  getUserHRBase(): Observable<number> {
    return this.userHRBase$;
  }

  setUpdatedImgStatus(status: string) {
    this.updatedImg$.next(status);
  }

  setSupervisorStatus(status: boolean) {
    this.isSupervisor$.next(status);
  }
  setSystemDeveloperStatus(status: boolean) {
    this.isSystemDeveloper$.next(status);
  }
  setSystemMaintainerStatus(status: boolean) {
    this.isSystemMaintainer$.next(status);
  }
  setMarketingDeveloperStatus(status: boolean) {
    this.isMarketingDeveloper$.next(status);
  }
  setBrandAdministratorStatus(status: boolean) {
    this.isBrandAdministrator$.next(status);
  }
  setBranchAdministratorStatus(status: boolean) {
    this.isBranchAdministrator$.next(status);
  }
  setBroadcastProducerStatus(status: boolean) {
    this.isBroadcastProducer$.next(status);
  }
  setCoachStatus(status: boolean) {
    this.isCoach$.next(status);
  }
  setGroupAdministratorStatus(status: boolean) {
    this.isGroupAdministrator$.next(status);
  }
  setGeneralMemberStatus(status: boolean) {
    this.isGeneralMember$.next(status);
  }
  setUserAccessRightDetail(data: UserDetail) {
    return this.userAccessRightDetail$.next(data);
  }

  getSupervisorStatus(): Observable<boolean> {
    return this.isSupervisor$;
  }
  getSystemDeveloperStatus(): Observable<boolean> {
    return this.isSystemDeveloper$;
  }
  getSystemMaintainerStatus(): Observable<boolean> {
    return this.isSystemMaintainer$;
  }
  getMarketingDeveloperStatus(): Observable<boolean> {
    return this.isMarketingDeveloper$;
  }
  getBrandAdministratorStatus(): Observable<boolean> {
    return this.isBrandAdministrator$;
  }
  getBranchAdministratorStatus(): Observable<boolean> {
    return this.isBranchAdministrator$;
  }
  getBroadcastProducerStatus(): Observable<boolean> {
    return this.isBroadcastProducer$;
  }
  getCoachStatus(): Observable<boolean> {
    return this.isCoach$;
  }
  getGroupAdministratorStatus(): Observable<boolean> {
    return this.isGroupAdministrator$;
  }
  getGeneralMemberStatus(): Observable<boolean> {
    return this.isGeneralMember$;
  }
  getInitialUserInfoStatus(): Observable<UserInfo> {
    return this.initialUserInfo$;
  }
  getUserAccessRightDetail(): Observable<UserDetail> {
    return this.userAccessRightDetail$;
  }
  getMemberAccessRight(body) {
    return this.http.post<any>('/api/v1/center/getMemberAccessRight', body);
  }
  getUserDetail(body, visittingId) {
    return this.getMemberAccessRight(body).subscribe(res => {
      const {
        info: { groupAccessRight }
      } = res;
      const idx = groupAccessRight.findIndex(
        _group => _group.groupId === visittingId && _group.joinStatus === 2
      );
      if (this.isSupervisor$.value) {
        this.userAccessRightDetail$.next({
          accessRight: '00',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else if (this.isSystemDeveloper$.value) {
        this.userAccessRightDetail$.next({
          accessRight: '10',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else if (this.isSystemMaintainer$.value) {
        this.userAccessRightDetail$.next({
          accessRight: '20',
          isCanManage: true,
          isGroupAdmin: idx > -1
        });
      } else if (this.isMarketingDeveloper$.value) {
        this.userAccessRightDetail$.next({
          accessRight: '29',
          isCanManage: true,
          isGroupAdmin: false
        });
      } else {
        const groupLevel = this.utils.displayGroupLevel(visittingId);
        const applyIdx = groupAccessRight.findIndex(
          _group => _group.groupId === visittingId && _group.joinStatus === 1
        );
        switch (groupLevel) {
          case '30':
            const brandIdx = groupAccessRight.findIndex(
              _group =>
                _group.groupId === visittingId && _group.joinStatus === 2
            );
            if (brandIdx > -1) {
              this.userAccessRightDetail$.next({
                accessRight: groupAccessRight[brandIdx].accessRight,
                isCanManage: groupAccessRight[brandIdx].accessRight === '30',
                isGroupAdmin: groupAccessRight[brandIdx].accessRight === '30',
                isApplying: applyIdx > -1
              });
            } else {
              this.userAccessRightDetail$.next({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false,
                isApplying: applyIdx > -1
              });
            }
            break;
          case '40':
            const branchIdx = groupAccessRight.findIndex(
              _group =>
                ((_group.groupId.slice(0, 5) === visittingId.slice(0, 5) &&
                  _group.accessRight === '30') ||
                  _group.groupId === visittingId) &&
                _group.joinStatus === 2
            );
            if (branchIdx > -1) {
              this.userAccessRightDetail$.next({
                accessRight: groupAccessRight[branchIdx].accessRight,
                isCanManage:
                  groupAccessRight[branchIdx].accessRight === '40' ||
                  groupAccessRight[branchIdx].accessRight === '30',
                isGroupAdmin:
                  groupAccessRight[branchIdx].accessRight === '40',
                isApplying: applyIdx > -1
              });
            } else {
              this.userAccessRightDetail$.next({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false,
                isApplying: applyIdx > -1
              });
            }
            break;
          case '60':
            const coachIdx = groupAccessRight.findIndex(
              _group =>
                ((_group.groupId.slice(0, 5) === visittingId.slice(0, 5) &&
                  _group.accessRight === '30') ||
                  (_group.groupId.slice(0, 7) === visittingId.slice(0, 7) &&
                    _group.accessRight === '40') ||
                  _group.groupId === visittingId) &&
                _group.joinStatus === 2
            );
            if (coachIdx > -1) {
              this.userAccessRightDetail$.next({
                accessRight: groupAccessRight[coachIdx].accessRight,
                isCanManage:
                  groupAccessRight[coachIdx].accessRight === '30' ||
                  groupAccessRight[coachIdx].accessRight === '40' ||
                  groupAccessRight[coachIdx].accessRight === '50' ||
                  groupAccessRight[coachIdx].accessRight === '60',
                isGroupAdmin:
                  groupAccessRight[coachIdx].accessRight === '50' ||
                  groupAccessRight[coachIdx].accessRight === '60',
                isApplying: applyIdx > -1
              });
            } else {
              this.userAccessRightDetail$.next({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false,
                isApplying: applyIdx > -1
              });
            }
            break;
          case '80':
            const normalIdx = groupAccessRight.findIndex(
              _group =>
                _group.groupId === visittingId && _group.joinStatus === 2
            );
            if (normalIdx > -1) {
              this.userAccessRightDetail$.next({
                accessRight: groupAccessRight[normalIdx].accessRight,
                isCanManage: groupAccessRight[normalIdx].accessRight === '80',
                isGroupAdmin: groupAccessRight[normalIdx].accessRight === '80',
                isApplying: applyIdx > -1
              });
            } else {
              this.userAccessRightDetail$.next({
                accessRight: 'none',
                isCanManage: false,
                isGroupAdmin: false,
                isApplying: applyIdx > -1
              });
            }
            break;
          default:
            this.userAccessRightDetail$.next({
              accessRight: '90',
              isCanManage: false,
              isGroupAdmin: false,
              isApplying: applyIdx > -1
            });
        }
      }
    });
  }
  getUserInfo(body) {
    const checkLogonData = new Promise((resolve, reject) => {
      this.getLogonData(body).subscribe(
        res1 => {
          if (res1.resultCode === 400) {
            this.redirectLoginPage();
          } else if (res1.resultCode === 401) {
            this.redirectLoginPage();
          } else if (res1.resultCode === 402) {
            const token = this.utils.getToken() || '';
            this.refreshToken({token}).subscribe(
              res2 => {
                if (res2.resultCode === 200) {
                  const { token, tokenTimeStamp } = res2.info;
                  this.utils.writeToken(token);
                  this.utils.setLocalStorageObject('ala_token_time', tokenTimeStamp);
                  resolve(false);
                } else if (res2.resultCode === 401) {
                  this.redirectLoginPage();
                }
              }
            );
          }
          if (res1.resultCode !== 402 && res1.resultCode !== 400 && res1.resultCode !== 401) {
            resolve(true);
          }
        }
      );
    });
    return checkLogonData.then(res => {
      if (res === false) {
        const token = this.utils.getToken() || '';
        this.combineFetchProcess({
          token,
          avatarType: 2,
          iconType : 2
        });
      } else {
        this.combineFetchProcess(body);
      }
      return res;
    });
  }
  redirectLoginPage() {
    this.authService.logout();
    const router = this.injector.get(Router);
    router.navigate(['/signin']);
  }
  combineFetchProcess(body) {
    const fetchMemberAccessRight = this.getMemberAccessRight(body);
    const fetchLogonData = this.getLogonData(body);
    return new Promise((resolve, reject) => {
      forkJoin([fetchMemberAccessRight, fetchLogonData]).subscribe(
        res => {
          const {
            info: { groupAccessRight }
          } = res[0];
          const {
            info: {
              nameIcon,
              name,
              nameId,
              birthday,
              heartRateMax,
              heartRateResting,
              heartRateBase
            }
          } = res[1];
          this.initialUserInfo$.next({
            isInitial: true,
            groupAccessRight
          });
          if (name) {
            this.userName$.next(name);
            this.userIcon$.next(nameIcon);
            this.userId$.next(nameId);
            this.userAge$.next(moment().diff(birthday, 'years'));
            this.userMaxHR$.next(heartRateMax);
            this.userRestHR$.next(heartRateResting);
            this.userHRBase$.next(heartRateBase);
          }

          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '00') >
            -1
          ) {
            this.isSupervisor$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '10') >
            -1
          ) {
            this.isSystemDeveloper$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '20') >
            -1
          ) {
            this.isSystemMaintainer$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '29') >
            -1
          ) {
            this.isMarketingDeveloper$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '30') >
            -1
          ) {
            this.isBrandAdministrator$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '40') >
            -1
          ) {
            this.isBranchAdministrator$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '50') >
            -1
          ) {
            this.isBroadcastProducer$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '60') >
            -1
          ) {
            this.isCoach$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '80') >
            -1
          ) {
            this.isGroupAdministrator$.next(true);
          }
          if (
            groupAccessRight.findIndex(_group => _group.accessRight === '90') >
            -1
          ) {
            this.isGeneralMember$.next(true);
          }
          resolve(true);
        },
        (err: HttpErrorResponse) => {
          if (err.error instanceof Error) {
            console.log('client-side error');
          } else {
            console.log('server-side error');
          }
          this.initialUserInfo$.next(false);
          resolve(false);
        }
      );
    });
  }

  // 存入登入者身體資訊供圖表使用-kidin-1081212
  saveBodyDatas (data) {
    this.userBodyInfo.pop();
    this.userBodyInfo.push(data);
  }

  // 取得登入者身體資訊供圖表使用-kidin-1081212
  getBodyDatas () {
    return this.userBodyInfo;
  }
}
