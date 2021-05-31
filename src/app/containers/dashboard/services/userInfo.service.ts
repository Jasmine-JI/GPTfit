import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserDetail } from '../models/userDetail';

@Injectable()
export class UserInfoService {
  userName$ = new BehaviorSubject<string>('');
  userAge$ = new BehaviorSubject<number>(null);
  userMaxHR$ = new BehaviorSubject<number>(null);
  userRestHR$ = new BehaviorSubject<number>(null);
  userHRBase$ = new BehaviorSubject<number>(null);

  // groupId$ = new BehaviorSubject<string>('0-0-0-0-0-0');
  userIcon$ = new BehaviorSubject<string>('');
  updatedImg$ = new BehaviorSubject<string>('');
  userAccessRightDetail$ = new BehaviorSubject<any>({
    accessRight: 'none',
    isCanManage: false,
    isGroupAdmin: false,
    isApplying: false
  });

  constructor(
    private http: HttpClient
  ) { }

  fetchEnableAccount (body, ip) {  // v2 1002
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return this.http.post<any>('/api/v2/user/enableAccount', body, httpOptions);
  }

  fetchForgetpwd (body, ip) {  // v2 1004
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return this.http.post<any>('/api/v2/user/resetPassword', body, httpOptions);
  }

  fetchEditAccountInfo (body, ip) {  // v2 1005
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return this.http.post<any>('/api/v2/user/editAccount', body, httpOptions);
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

  setUserAccessRightDetail(data: UserDetail) {
    return this.userAccessRightDetail$.next(data);
  }

  getUserAccessRightDetail(): Observable<UserDetail> {
    return this.userAccessRightDetail$;
  }

}
