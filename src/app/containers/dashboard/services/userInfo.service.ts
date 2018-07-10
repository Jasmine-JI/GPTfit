import { HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { forkJoin } from 'rxjs/observable/forkJoin';

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
  getMemberAccessRight(body) {
    return this.http.post<any>('/api/v1/center/getMemberAccessRight', body);
  }
  getUserInfo(body) {
    const fetchMemberAccessRight = this.getMemberAccessRight(body);
    const fetchLogonData = this.getLogonData(body);
    forkJoin([fetchMemberAccessRight, fetchLogonData]).subscribe(res => {
      const { info: { groupAccessRight } } = res[0];
      const { info: { nameIcon, name } } = res[1];
      if (nameIcon && name) {
        this.userName$.next(name);
        this.userIcon$.next(nameIcon);
      }

      if (groupAccessRight.findIndex(_group => _group.accessRight === '00') > -1) {
        this.isSupervisor$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '10') > -1) {
        this.isSystemDeveloper$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '20') > -1) {
        this.isSystemMaintainer$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '29') > -1) {
        this.isMarketingDeveloper$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '30') > -1) {
        this.isBrandAdministrator$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '40') > -1) {
        this.isBranchAdministrator$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '50') > -1) {
        this.isBroadcastProducer$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '60') > -1) {
        this.isCoach$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '80') > -1) {
        this.isGroupAdministrator$.next(true);
      }
      if (groupAccessRight.findIndex(_group => _group.accessRight === '90') > -1) {
        this.isGeneralMember$.next(true);
      }
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('client-side error');
      } else {
        console.log('server-side error');
      }
      return of(false);
    });
  }
  // getLogonData() {
  //   return this.http.get<any>(API_SERVER + 'user/getLogonData').map(
  //     res => {
  //       const { userName, userRole, userIcon } = res;
  //       const accessRight = userRole.join(',');
  //       if (accessRight.indexOf('00') > -1) {
  //         this.isSupervisor$.next(true);
  //       }
  //       if (accessRight.indexOf('10') > -1) {
  //         this.isSystemDeveloper$.next(true);
  //       }
  //       if (accessRight.indexOf('20') > -1) {
  //         this.isSystemMaintainer$.next(true);
  //       }
  //       if (accessRight.indexOf('29') > -1) {
  //         this.isMarketingDeveloper$.next(true);
  //       }
  //       if (accessRight.indexOf('30') > -1) {
  //         this.isBrandAdministrator$.next(true);
  //       }
  //       if (accessRight.indexOf('40') > -1) {
  //         this.isBranchAdministrator$.next(true);
  //       }
  //       if (accessRight.indexOf('50') > -1) {
  //         this.isBroadcastProducer$.next(true);
  //       }
  //       if (accessRight.indexOf('60') > -1) {
  //         this.isCoach$.next(true);
  //       }
  //       if (accessRight.indexOf('80') > -1) {
  //         this.isGroupAdministrator$.next(true);
  //       }
  //       if (accessRight.indexOf('90') > -1) {
  //         this.isGeneralMember$.next(true);
  //       }
  //       this.userName$.next(userName);
  //       this.userIcon$.next(userIcon);
  //       return true;
  //     },
  //     (err: HttpErrorResponse) => {
  //       if (err.error instanceof Error) {
  //         console.log('client-side error');
  //       } else {
  //         console.log('server-side error');
  //       }
  //       return of(false);
  //     }
  //   );
  // }
}
