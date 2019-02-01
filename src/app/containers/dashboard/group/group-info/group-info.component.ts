import {
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { UserInfoService } from '../../services/userInfo.service';
import { MatDialog } from '@angular/material';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { toMemberText } from '../desc';
import { PrivacySettingDialogComponent } from '../privacy-setting-dialog/privacy-setting-dialog.component';
import { UserProfileService } from '@shared/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GroupInfoComponent implements OnInit {
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
  shareAvatarTarget: string;
  shareActivityTarget: string;
  shareReportTarget: string;
  activityTrackingStatus = [false]; // ['mycoach'] 順序是暫時的，等其他選項確定再補
  activityTrackingReportStatus = [false]; // ['mycoach'] 順序是暫時的，等其他選項確定再補
  lifeTrackingReportStatus = [false]; // ['mycoach'] 順序是暫時的，等其他選項確定再補
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
  title: string;
  confirmText: string;
  cancelText: string;
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private userInfoService: UserInfoService,
    private userProfileService: UserProfileService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private hashIdService: HashIdService
  ) {
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
    this.getAndInitTranslations();
  }

  ngOnInit() {
    this.route.params.subscribe(_params => this.handleInit());
    let isAutoApplyGroup = this.utils.getLocalStorageObject('isAutoApplyGroup');
    this.userInfoService.getUserAccessRightDetail().subscribe(res => {
      this.visitorDetail = res;
      const { isGroupAdmin } = this.visitorDetail;
      if (isAutoApplyGroup && isGroupAdmin) {
        // 已是該群組管理者無法利用qr 掃描自動加入群組
        this.utils.removeLocalStorageObject('isAutoApplyGroup');
        isAutoApplyGroup = false;
      }
      if (isAutoApplyGroup) {
        this.handleActionGroup(1);
        this.utils.removeLocalStorageObject('isAutoApplyGroup');
        isAutoApplyGroup = false;
      }
    });
  }

  handleInit() {
    this.groupId = this.hashIdService.handleGroupIdDecode(this.route.snapshot.paramMap.get('groupId'));
    if (this.groupId.length === 0) {
      return this.router.navigateByUrl('/404');
    }
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId,
      findRoot: '1'
    };
    this.userInfoService.getUserDetail(body, this.groupId);
    this.userInfoService.getUserId().subscribe(res => {
      this.userId = res;
    });
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.role.isSupervisor = res;
      // console.log('%c this.isSupervisor', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.role.isSystemDeveloper = res;
      // console.log('%c this.isSystemDeveloper', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.role.isSystemMaintainer = res;
      // console.log('%c this.isSystemMaintainer', 'color: #0ca011', res);
    });
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.groupInfo = res.info;
      const {
        groupIcon,
        groupId,
        selfJoinStatus,
        groupStatus,
        shareActivityToMember,
        shareAvatarToMember,
        shareReportToMember
      } = this.groupInfo;
      if (shareAvatarToMember && +shareAvatarToMember.switch > 2) {
        this.handleShareTarget(shareAvatarToMember, 1);
      }
      if (shareActivityToMember && +shareActivityToMember.switch > 2) {
        this.handleShareTarget(shareActivityToMember, 2);
      }
      if (shareReportToMember && +shareReportToMember.switch > 2) {
        this.handleShareTarget(shareReportToMember, 3);
      }
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
        (groupStatus === 3 && !this.visitorDetail.isCanManage) ||
        groupStatus === 5
      ) {
        this.router.navigateByUrl(`/404`);
      }
    });
  }
  handleShareTarget(shareData, type) {
    const browserLang = this.utils.getLocalStorageObject('locale');
    let text = '';
    let accessRights = [];
    if (browserLang === 'zh-tw') {
      if (shareData.switch === '3') {
        text = '僅開放對象為';
        accessRights = shareData.enableAccessRight;
      } else {
        text = '不開放對象為';
        accessRights = shareData.disableAccessRight;
      }
    } else if (browserLang === 'zh-cn') {
      if (shareData.switch === '3') {
        text = '仅开放对象为';
        accessRights = shareData.enableAccessRight;
      } else {
        text = '不开放对象为';
        accessRights = shareData.disableAccessRight;
      }
    } else {
      if (shareData.switch === '3') {
        text = 'Only for ';
        accessRights = shareData.enableAccessRight;
      } else {
        text = 'Not for ';
        accessRights = shareData.disableAccessRight;
      }
    }

    accessRights = accessRights.map(_accessRight => {
      if (browserLang === 'zh-tw') {
        if (_accessRight === '30') {
          return '品牌管理員';
        } else if (_accessRight === '40') {
          return '分店管理員';
        } else if (_accessRight === '50') {
          return '體適能教練';
        } else {
          return '專業老師';
        }
      } else if (browserLang === 'zh-cn') {
        if (_accessRight === '30') {
          return '品牌管理员';
        } else if (_accessRight === '40') {
          return '分店管理员';
        } else if (_accessRight === '50') {
          return '体适能教练';
        } else {
          return '专业老师';
        }
      } else {
        if (_accessRight === '30') {
          return 'Brand administrator';
        } else if (_accessRight === '40') {
          return 'Branch manager';
        } else if (_accessRight === '50') {
          return 'Physical fitness coach';
        } else {
          return 'Professional teacher';
        }
      }
    });

    if (browserLang.indexOf('zh') > -1) {
      text += accessRights.join(' 、');
    } else {
      text += accessRights.join(' ,');
    }

    if (type === 1) {
      this.shareAvatarTarget = text;
    } else if (type === 2) {
      this.shareActivityTarget = text;
    } else {
      this.shareReportTarget = text;
    }
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
      });
    }
  }
  getAndInitTranslations() {
    this.translate
      .get(['Dashboard.Group.Disclaimer', 'SH.Agree', 'SH.Disagree'])
      .subscribe(translation => {
        this.title = translation['Dashboard.Group.Disclaimer'];
        this.confirmText = translation['SH.Agree'];
        this.cancelText = translation['SH.Disagree'];
      });
  }
  handleActionGroup(_type) {
    const body = {
      token: this.token,
      groupId: this.groupId,
      actionType: _type
    };
    if (_type === 1 && this.groupLevel === '60') {
      // 申請加入
      const langName = this.utils.getLocalStorageObject('locale');
      const bodyText = toMemberText[langName];
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: this.title,
          body: bodyText,
          confirmText: this.confirmText,
          cancelText: this.cancelText,
          onConfirm: () => {
            this.groupService
              .actionGroup(body)
              .subscribe(
                ({ resultCode, resultMessage, info: { selfJoinStatus } }) => {
                  if (resultCode === 200) {
                    this.joinStatus = selfJoinStatus;
                    this.userProfileService
                      .getUserProfile({ token: this.token })
                      .subscribe(res => {
                        this.isLoading = false;
                        const {
                          privacy: { activityTracking, activityTrackingReport }
                        } = res.info;
                        let isOnlyme = false;
                        isOnlyme = !activityTracking.some(_val => +_val > 1);
                        isOnlyme = !activityTrackingReport.some(
                          _val => +_val > 1
                        );
                        const {
                          shareActivityToMember,
                          shareAvatarToMember,
                          shareReportToMember
                        } = this.groupInfo;
                        if (
                          (shareActivityToMember.switch === '3' ||
                            shareAvatarToMember.switch === '3' ||
                            shareReportToMember.switch === '3') &&
                          isOnlyme
                        ) {
                          let accessRights = [];
                          if (shareActivityToMember.switch === '3') {
                            accessRights.push(
                              ...shareActivityToMember.enableAccessRight
                            );
                          }
                          if (shareReportToMember.switch === '3') {
                            const diffArr = this.utils.diff_array(
                              accessRights,
                              shareReportToMember.enableAccessRight
                            );
                            if (diffArr.length > 0) {
                              accessRights.push(...diffArr);
                            }
                          }
                          if (shareAvatarToMember.switch === '3') {
                            const _diffArr = this.utils.diff_array(
                              accessRights,
                              shareAvatarToMember.enableAccessRight
                            );
                            if (_diffArr.length > 0) {
                              accessRights.push(..._diffArr);
                            }
                          }
                          const browserLang = this.utils.getLocalStorageObject(
                            'locale'
                          );
                          accessRights = accessRights.map(_accessRight => {
                            if (browserLang === 'zh-tw') {
                              if (_accessRight === '30') {
                                return '品牌管理員';
                              } else if (_accessRight === '40') {
                                return '分店管理員';
                              } else if (_accessRight === '50') {
                                return '體適能教練';
                              } else {
                                return '專業老師';
                              }
                            } else if (browserLang === 'zh-cn') {
                              if (_accessRight === '30') {
                                return '品牌管理员';
                              } else if (_accessRight === '40') {
                                return '分店管理员';
                              } else if (_accessRight === '50') {
                                return '体适能教练';
                              } else {
                                return '专业老师';
                              }
                            } else {
                              if (_accessRight === '30') {
                                return 'Brand administrator';
                              } else if (_accessRight === '40') {
                                return 'Branch manager';
                              } else if (_accessRight === '50') {
                                return 'Physical fitness coach';
                              } else {
                                return 'Professional teacher';
                              }
                            }
                          });
                          let text = '';

                          if (browserLang.indexOf('zh') > -1) {
                            text += accessRights.join(' 、');
                          } else {
                            text += accessRights.join(' ,');
                          }
                          this.detectCheckBoxValue(
                            activityTracking,
                            this.activityTrackingStatus
                          );
                          this.detectCheckBoxValue(
                            activityTrackingReport,
                            this.activityTrackingReportStatus
                          );
                          this.dialog.open(PrivacySettingDialogComponent, {
                            hasBackdrop: true,
                            data: {
                              targetText: text,
                              groupName: this.groupInfo.groupName,
                              activityTrackingReportStatus: this
                                .activityTrackingReportStatus,
                              activityTrackingStatus: this
                                .activityTrackingStatus,
                              activityTracking,
                              activityTrackingReport
                            }
                          });
                        }
                      });
                  }
                  if (resultCode === 401) {
                    this.dialog.open(MessageBoxComponent, {
                      hasBackdrop: true,
                      data: {
                        title: 'message',
                        body: resultMessage,
                        confirmText: this.confirmText,
                        cancelText: this.cancelText
                      }
                    });
                  }
                }
              );
          }
        }
      });
    }

    const isBeenGroupMember = this.joinStatus === 2;
    this.groupService
      .actionGroup(body)
      .subscribe(({ resultCode, info: { selfJoinStatus }, resultMessage }) => {
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
        if (resultCode === 401) {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: resultMessage,
              confirmText: this.confirmText,
              cancelText: this.cancelText
            }
          });
        }
      });
  }
  detectCheckBoxValue(arr, statusArr) {
    if (arr.findIndex(arrVal => arrVal === '1') === -1) {
      arr.push('1');
    }
    arr.forEach((_arr, idx) => {
      if (_arr === '') {
        arr.splice(idx, 1);
      }
      if (_arr === '4') {
        statusArr[0] = true;
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
