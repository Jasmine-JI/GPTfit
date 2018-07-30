import { HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { UserInfo } from '../models/userInfo';
import { UserDetail } from '../models/userDetail';

const { API_SERVER } = environment.url;

@Injectable()
export class UserInfoService {
  userName$ = new BehaviorSubject<string>('');
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
  initialUserInfo$ = new BehaviorSubject<any>({
    isInitial: false,
    groupAccessRight: []
  });
  userAccessRightDetail$ = new BehaviorSubject<any>({
    groupLevel: 'none',
    isCanManage: false,
    isGroupAdmin: false    
  });

  constructor(private http: HttpClient) {}
  getLogonData(body) {
    const headers = new HttpHeaders();
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        chartset: 'utf-8',
        Authorization: 'required',
        deviceType: '2',
        deviceName: 'htc one',
        deviceOSVersion: 'android',
        deviceID: 'IMEIxxxxxxx',
        appVersionCode: '4.4.14',
        appVersionName: 'v1.0.0',
        language: 'zh',
        regionCode: 'TW',
        appName: 'AlaCloudRun',
        equipmentSN: 'tradmill'
      })
    };

    return this.http.post<any>('/api/v1/user/getLogonData', body, httpOptions);
  }
  getUserIcon(): Observable<string> {
    return this.userIcon$;
  }
  getUserName(): Observable<string> {
    return this.userName$;
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
  getUserDetail(body, groupId) {
    this.getInitialUserInfoStatus().subscribe((res: UserInfo) => {
      const { groupAccessRight, isInitial } = res;
      if (isInitial) {
        if (this.isSupervisor$.value) {
          return this.userAccessRightDetail$.next({ groupLevel: '00', isCanManage: true, isGroupAdmin: false});
        }
        if (this.isSystemDeveloper$.value) {
          return this.userAccessRightDetail$.next({ groupLevel: '10', isCanManage: true, isGroupAdmin: false});
        }
        if (this.isSystemMaintainer$.value) {
          return this.userAccessRightDetail$.next({ groupLevel: '20', isCanManage: true, isGroupAdmin: false});
        }
        if (this.isBrandAdministrator$.value) {
          const brandGroups = groupAccessRight.filter(_group => _group.accessRight === '30');
          const brandIdx = brandGroups.findIndex(_brandGroup => _brandGroup.groupId.slice(0, 5) === groupId.slice(0, 5));
          if (brandIdx > -1) {
            return this.userAccessRightDetail$.next({ groupLevel: '30', isCanManage: true, isGroupAdmin: true});
          }
        } 
        if (this.isBranchAdministrator$.value) {
          const branchGroups = groupAccessRight.filter(_group => _group.accessRight === '40');
          let branchIdx = branchGroups.findIndex(_branchGroup => _branchGroup.groupId === groupId);
          if (branchIdx > -1) {
            return this.userAccessRightDetail$.next({ groupLevel: '40', isCanManage: true, isGroupAdmin: true});
          }
          branchIdx = branchGroups.findIndex(_branchGroup => _branchGroup.groupId.slice(0, 5) === groupId.slice(0, 5));
          if (branchIdx > -1)  {
            return this.userAccessRightDetail$.next({ groupLevel: '40', isCanManage: false, isGroupAdmin: true});
          }    
        }
        if (this.isCoach$.value) {
          const coachGroups = groupAccessRight.filter(_group => _group.accessRight === '60');
          if (coachGroups.findIndex(_coachGroup => _coachGroup.groupId === groupId > -1)) {
            return this.userAccessRightDetail$.next({ groupLevel: '60', isCanManage: true, isGroupAdmin: true});
          }
          if (coachGroups.findIndex(_coachGroup => _coachGroup.groupId.slice(0, 5) === groupId.slice(0, 5) > -1))  {
            return this.userAccessRightDetail$.next({ groupLevel: '60', isCanManage: false, isGroupAdmin: true});
          }  
        }
        if (this.isGroupAdministrator$.value) {
          const normalGroups = groupAccessRight.filter(_group => _group.accessRight === '80');
          if (normalGroups.findIndex(_normalGroup => _normalGroup.groupId === groupId > -1)) {
            return this.userAccessRightDetail$.next({ groupLevel: '80', isCanManage: true, isGroupAdmin: true});
          }      
          if (normalGroups.findIndex(_normalGroup => _normalGroup.groupId.slice(0, 5) === groupId.slice(0, 5) > -1))  {
            return this.userAccessRightDetail$.next({ groupLevel: '80', isCanManage: false, isGroupAdmin: true});
          }        
        }
        return this.userAccessRightDetail$.next({ groupLevel: 'none', isCanManage: false, isGroupAdmin: false});  
      }
    });
  }
  getUserInfo(body) {
    const fetchMemberAccessRight = this.getMemberAccessRight(body);
    const fetchLogonData = this.getLogonData(body);
    return new Promise((resolve, reject) => {
      forkJoin([fetchMemberAccessRight, fetchLogonData]).subscribe(
        res => {
          const {
            info: { groupAccessRight }
          } = res[0];
          const {
            info: { nameIcon, name }
          } = res[1];
          this.initialUserInfo$.next({
            isInitial: true,
            groupAccessRight
          });
          if (nameIcon && name) {
            this.userName$.next(name);
            this.userIcon$.next(nameIcon);
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
}
