import { Injectable } from '@angular/core';
import { QrcodeService } from '../../containers/portal/services/qrcode.service';
import { UtilsService } from './utils.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { GroupService } from '../../containers/dashboard/services/group.service';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class ActivityOtherDetailsService {
  deviceInfo: any;
  otherInfo$ = new BehaviorSubject<any>(null);
  constructor(
    private qrCodeService: QrcodeService,
    private utilsService: UtilsService,
    private groupService: GroupService,
    private userProfileService: UserProfileService
  ) {}
  getOtherInfo(): Observable<any> {
    return this.otherInfo$;
  }
  resetOtherInfo() {
    return this.otherInfo$.next(null);
  }
  fetchOtherDetail(sn, coachId, groupId) {
    const token = this.utilsService.getToken(),
          forkJoinArray = [];
    if (sn && sn.length > 0) {
      // 改接7015-kidin-1090113
      const deviceBody = {
        'token': '',
        'queryType': '1',
        'queryArray': [sn]
      };
      const getDeviceDetail = this.qrCodeService.getProductInfo(deviceBody);
      forkJoinArray.push(getDeviceDetail);
    }
    if (groupId && coachId) {
      const body = {
        token,
        findRoot: '1',
        groupId,
        avatarType: 2
      };
      const body2 = {
        token,
        avatarType: 2,
        targetUserId: coachId
      };
      const getGroupDetail = this.groupService.fetchGroupListDetail(body);
      const getUserInfo = this.userProfileService.getUserProfile(body2);
      forkJoinArray.push(getGroupDetail);
      forkJoinArray.push(getUserInfo);
    }

    if (forkJoinArray.length > 0) {
      forkJoin(forkJoinArray).subscribe(res => {
        if (groupId && coachId) {
          this.otherInfo$.next({
            deviceInfo: res[0],
            coachInfo: res[2],
            groupInfo: res[1]
          });
        } else {
          this.otherInfo$.next({deviceInfo: res[0]});
        }
      });
    }

  }
}
