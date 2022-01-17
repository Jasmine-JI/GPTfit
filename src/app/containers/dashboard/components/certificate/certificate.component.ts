import { Component, OnInit, OnDestroy } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { GroupService } from '../../../../shared/services/group.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { ReplaySubject, Observable, combineLatest, Subject } from 'rxjs';
import { tap, switchMap, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss']
})
export class CertificateComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject;

  isLoading = false;
  timer: any;
  token: string;
  groupId = '0-0-131-0-0-0';
  groupLevel = 60;
  compareData = {
    dashboard: {
      normal: {
        count: 0,
        costTime: 0,
        record: [],
        avgTime: 0
      },
      graphql: {
        count: 0,
        costTime: 0,
        record: [],
        avgTime: 0
      }
    },
    group: {
      normal: {
        count: 0,
        costTime: 0,
        record: [],
        avgTime: 0
      },
      graphql: {
        count: 0,
        costTime: 0,
        record: [],
        avgTime: 0
      }
    }
  }

  constructor(
    private apollo: Apollo,
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    this.token = this.utils.getToken();
  }


  getDashBoardNeedInfo() {
    /**
     * api 1010 request body
     */
    const userProfileBody = {
      token: this.token
    };

    /**
     * api 1113 request body
     */
    const accessRightBody = {
      token: this.token
    }

    this.startCountTime('dashboard', 'normal');
    combineLatest([
      this.userProfileService.getUserProfile(userProfileBody),
      this.userProfileService.getMemberAccessRight(accessRightBody)
    ]).subscribe(resArr => {
      this.stopCountTime('dashboard', 'normal');
    })

  }

  getDashBoardNeedInfo_g() {
    this.startCountTime('dashboard', 'graphql');
    this.apollo
      .query<any>({
        query: gql`
          query GetPost {
            posts {
              id
              title
            }
          }
        `
      }).pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(res => {
        this.stopCountTime('dashboard', 'graphql');
        console.log('dashboard-gql', res);
      });
  }

  getGroupNeedInfo() {
    /**
     * api 1102 request body
     */
    const detailBody = {
      token: this.token,
      groupId: this.groupId,
      findRoot: 1,
      avatarType: 3
    };

    const groupIdArr = this.groupId.split('-');
    groupIdArr.length = 3;

    /**
     * api 1115 request body
     */
    const commerceBody = {
      token: this.token,
      groupId: `${groupIdArr.join('-')}-0-0-0`
    };

    /**
     * api 1103 request body
     */
    const childGroupBody = {
      token: this.token,
      avatarType: 3,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: 1
    }

    /**
     * api 1103 request body
     */
    const adminListBody = {
      token: this.token,
      avatarType: 3,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: 2
    }

    /**
     * api 1103 request body
     */
    const memberListBody = {
      token: this.token,
      avatarType: 3,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: 3
    }

    this.startCountTime('group', 'normal');
    combineLatest([
      this.groupService.fetchGroupListDetail(detailBody),
      this.groupService.fetchCommerceInfo(commerceBody),
      this.groupService.fetchGroupMemberList(childGroupBody),
      this.groupService.fetchGroupMemberList(adminListBody),
      this.groupService.fetchGroupMemberList(memberListBody)
    ]).subscribe(resArr => {
      this.stopCountTime('group', 'normal');
    })
  }

  getGroupNeedInfo_g() {
    this.startCountTime('group', 'graphql');
    this.apollo
      .query<any>({
        query: gql`
          {
            books {
              title
              authors {
                name
              }
            }
          }
        `
      })
      .subscribe(res => {
        this.stopCountTime('group', 'graphql');
        console.log('group-gql', res);
      });
  }


  startCountTime(type: string, service: string) {
    this.compareData[type][service].count++;
    this.compareData[type][service].costTime = 0;
    this.timer = setInterval(() => {
      this.compareData[type][service].costTime += 0.001;
    }, 1);

  }


  stopCountTime(type: string, service: string) {
    if (this.timer) {
      window.clearInterval(this.timer);
    }

    this.compareData[type][service].record.push(this.compareData[type][service].costTime);
    this.compareData[type][service].avgTime = this.compareData[type][service].record.reduce((a, b) => a + b) / this.compareData[type][service].count;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
