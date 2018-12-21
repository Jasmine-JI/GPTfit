import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { UserInfoService } from '../../services/userInfo.service';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { MatDialog } from '@angular/material';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { toMemberText } from '../desc';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GroupInfoComponent implements OnInit, OnDestroy {
  groupId: string;
  token: string;
  groupInfo: any;
  groupImg: string;
  group_id: string;
  groupLevel: string;
  groupInfos: any;
  normalMemberInfos: any;
  joinStatus = 5;
  subGroupInfo: any;
  brandAdministrators: any;
  subBrandInfo: any;
  subBranchInfo: any;
  subCoachInfo: any;
  branchAdministrators: any;
  coachAdministrators: any;
  normalCoaches: any;
  PFCoaches: any;
  isCommerceInfoLoading = false;
  normalGroupAdministrators: any;
  role = {
    isSupervisor: false,
    isSystemDeveloper: false,
    isSystemMaintainer: false
  };
  chooseIdx = 1;
  visitorDetail: any;
  isLoading = false;
  userId: number;
  commerceInfo: any;
  @ViewChild('footerTarget')
  footerTarget: ElementRef;
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private userInfoService: UserInfoService,
    private globalEventsManager: GlobalEventsManager,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.params.subscribe(_params => this.handleInit());
    let isAutoApplyGroup = this.utils.getLocalStorageObject('isAutoApplyGroup');
    setTimeout(() => {
      this.userInfoService.getUserAccessRightDetail().subscribe(res => {
        this.visitorDetail = res;
        const { accessRight, isCanManage, isGroupAdmin } = this.visitorDetail;
        if (
          isAutoApplyGroup &&
          (+accessRight <= 29 || isCanManage || isGroupAdmin)
        ) {
          // 00~29無法利用qr 掃描自動加入群組
          this.utils.removeLocalStorageObject('isAutoApplyGroup');
          isAutoApplyGroup = false;
        }
        if (isAutoApplyGroup) {
          // 00~29無法利用qr 掃描自動加入群組
          this.handleActionGroup(1);
          this.utils.removeLocalStorageObject('isAutoApplyGroup');
          isAutoApplyGroup = false;
        }
      });
    }, 300);
  }
  ngOnDestroy() {
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
  }
  handleInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId
    };
    this.userInfoService.getUserDetail(body, this.groupId);
    this.userInfoService.getUserId().subscribe(res => {
      this.userId = res;
    });
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.role.isSupervisor = res;
      console.log('%c this.isSupervisor', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.role.isSystemDeveloper = res;
      console.log('%c this.isSystemDeveloper', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.role.isSystemMaintainer = res;
      console.log('%c this.isSystemMaintainer', 'color: #0ca011', res);
    });
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      const childElementCount = this.footerTarget.nativeElement
        .childElementCount;
      this.globalEventsManager.setFooterRWD(childElementCount); // 為了讓footer長高85px
      this.groupInfo = res.info;
      const {
        groupIcon,
        groupId,
        selfJoinStatus,
        groupStatus
      } = this.groupInfo;
      if (selfJoinStatus) {
        this.joinStatus = selfJoinStatus;
      } else {
        this.joinStatus = 5;
      }
      this.groupImg =
        groupIcon && groupIcon.length > 0
          ? this.utils.buildBase64ImgString(groupIcon)
          : '/assets/images/group-default.svg';
      this.group_id = this.utils.displayGroupId(groupId);
      this.groupLevel = this.utils.displayGroupLevel(groupId);
      if (this.groupLevel === '80') {
        this.getGroupMemberList(2);
      } else {
        this.getGroupMemberList(1);
      }
      if (
        groupStatus === 4 ||
        (groupStatus === 3 && !this.visitorDetail.isCanManage)
      ) {
        this.router.navigateByUrl(`/404`);
      }
    });
  }
  handleGroupItem(idx) {
    this.chooseIdx = idx;
    const body = {
      token: this.token,
      groupId: this.groupId
    };
    if (this.chooseIdx === 2) {
      this.isCommerceInfoLoading = true;
      this.groupService.fetchCommerceInfo(body).subscribe(res => {
        this.isCommerceInfoLoading = false;
        this.commerceInfo = res.info;
        console.log(res);
      });
    }
  }

  handleActionGroup(_type) {
    const body = {
      token: this.token,
      groupId: this.groupId,
      actionType: _type
    };
    if (_type === 1 && this.groupLevel === '60') {
      // 申請加入
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: '免責聲明',
          body: toMemberText,
          confirmText: '我同意',
          cancelText: '不同意',
          onConfirm: () => {
            this.groupService
              .actionGroup(body)
              .subscribe(({ resultCode, info: { selfJoinStatus } }) => {
                if (resultCode === 200) {
                  this.joinStatus = selfJoinStatus;
                }
              });
          }
        }
      });
    }

    const isBeenGroupMember = this.joinStatus === 2;
    this.groupService
      .actionGroup(body)
      .subscribe(({ resultCode, info: { selfJoinStatus } }) => {
        if (resultCode === 200) {
          if (_type === 2 && this.groupLevel === '80' && isBeenGroupMember) {
            this.userInfoService.getUserDetail(body, this.groupId);
          }
          if (_type === 2) {
            this.joinStatus = 5;
            this.userInfoService.getUserDetail(body, this.groupId);
          } else {
            this.joinStatus = selfJoinStatus;
          }
        }
      });
  }

  getGroupMemberList(_type) {
    this.isLoading = true;
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: _type
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      this.isLoading = false;
      if (res.resultCode === 200) {
        const {
          info: { groupMemberInfo, subGroupInfo }
        } = res;
        if (_type === 1) {
          this.subGroupInfo = subGroupInfo;
          this.subBrandInfo = this.subGroupInfo.brands.map(_brand => {
            return {
              ..._brand,
              groupIcon: this.utils.buildBase64ImgString(_brand.groupIcon)
            };
          });
          this.subBranchInfo = this.subGroupInfo.branches.filter(_branch => {
            if (_branch.groupStatus !== 4) {
              // 過濾解散群組
              return {
                ..._branch,
                groupIcon: this.utils.buildBase64ImgString(_branch.groupIcon)
              };
            }
          });
          this.subCoachInfo = this.subGroupInfo.coaches.filter(_coach => {
            if (_coach.groupStatus !== 4) {
              // 過濾解散群組
              return {
                ..._coach,
                groupIcon: this.utils.buildBase64ImgString(_coach.groupIcon)
              };
            }
          });
        } else {
          this.groupInfos = groupMemberInfo;
          this.groupInfos = this.groupInfos
            .map(_info => {
              return {
                ..._info,
                memberIcon: this.utils.buildBase64ImgString(_info.memberIcon)
              };
            })
            .filter(newInfo => !(typeof newInfo === 'undefined'));
          this.brandAdministrators = this.groupInfos.filter(
            _info => _info.accessRight === '30'
          );
          if (this.groupLevel === '40') {
            if (_type === 2) {
              this.branchAdministrators = this.groupInfos.filter(
                _info =>
                  _info.accessRight === '40' && _info.groupId === this.groupId
              );
            }
          } else {
            if (_type === 2) {
              this.branchAdministrators = this.groupInfos.filter(_info => {
                if (_info.accessRight === '40') {
                  const idx = this.subBranchInfo.findIndex(
                    _subBranch => _subBranch.groupId === _info.groupId
                  );
                  if (idx > -1) {
                    _info.memberName =
                      this.subBranchInfo[idx].groupName +
                      '/' +
                      _info.memberName;
                    return _info;
                  }
                }
              });
            }
          }
          if (this.groupLevel === '60') {
            // 如果是教練課群組
            this.normalCoaches = this.groupInfos.filter(
              // 一般教練
              _info =>
                _info.accessRight === '60' && _info.groupId === this.groupId
            );
            this.PFCoaches = this.groupInfos.filter(
              // 體適能教練
              _info =>
                _info.accessRight === '50' && _info.groupId === this.groupId
            );
          } else {
            this.coachAdministrators = this.groupInfos.filter(_info => {
              if (_info.accessRight === '60' || _info.accessRight === '50') {
                const idx = this.subCoachInfo.findIndex(
                  _subCoach => _subCoach.groupId === _info.groupId
                );
                if (idx > -1) {
                  _info.memberName =
                    this.subCoachInfo[idx].groupName + '/' + _info.memberName;
                  return _info;
                }
              }
            });
          }
          if (_type === 2) {
            this.normalGroupAdministrators = this.groupInfos.filter(
              _info => _info.accessRight === '80' && _info.joinStatus === 2
            );
          }
          this.normalMemberInfos = this.groupInfos.filter(
            _info => _info.accessRight === '90' && _info.joinStatus === 2
          );
          // 如果按到tab為一般成員，剛好她也被加入，就讓她擁有退出群組
          if (
            _type === 3 &&
            this.normalMemberInfos.findIndex(
              _normalMember => _normalMember.memberId === this.userId
            ) > -1 &&
            this.joinStatus !== 2
          ) {
            this.joinStatus = 2;
          }
          // 如果按到tab為管理員，剛好她也被加入，就讓她擁有管理按鈕
          if (
            _type === 2 &&
            this.groupInfos.findIndex(
              _admin =>
                _admin.memberId === this.userId &&
                (_admin.accessRight === '80' || _admin.accessRight === '40') &&
                _admin.joinStatus === 2
            ) > -1 &&
            (this.joinStatus !== 2 && !this.visitorDetail.isCanManage)
          ) {
            this.joinStatus = 2;
            this.userInfoService.getUserDetail(body, this.groupId);
          }
        }
      }
    });
  }
  changeGroupInfo({ index }) {
    if (this.groupLevel === '80') {
      if (index === 0) {
        this.getGroupMemberList(index + 2);
      } else if (index === 1) {
        this.getGroupMemberList(index + 2);
      } else {
        this.getGroupMemberList(index + 2);
      }
    } else {
      if (index === 0) {
        this.getGroupMemberList(1);
      } else if (index === 1) {
        this.getGroupMemberList(2);
      } else if (index === 2) {
        this.getGroupMemberList(3);
      } else {
        this.getGroupMemberList(4);
      }
    }
  }
  goEditPage() {
    this.router.navigateByUrl(`${location.pathname}/edit`);
  }
}
