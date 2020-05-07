import {
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router, NavigationEnd } from '@angular/router';
import { UserInfoService } from '../../services/userInfo.service';
import { MatDialog } from '@angular/material';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { toMemberText } from '../desc';
import { PrivacySettingDialogComponent } from '../privacy-setting-dialog/privacy-setting-dialog.component';
import { UserProfileService } from '@shared/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';
import { ShareGroupInfoDialogComponent } from '@shared/components/share-group-info-dialog/share-group-info-dialog.component';


import * as moment from 'moment';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GroupInfoComponent implements OnInit {
  accessRight: number;
  isPreviewMode = false;
  hashGroupId: string;
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
  isGroupInfoLoading = false;
  isLoading = false;
  userId: number;
  commerceInfo: any;
  title: string;
  confirmText: string;
  cancelText: string;
  totalGroupName: string; // 含母階層的群組名稱
  updateImgQueryString = '';
  brandType: any;
  editManageMode = false;
  editContent = {
    status: '1',
    plan: '1',
    administratorNum: '4',
    memberNum: '20',
    expire: '',
    branchNum: '1',
    classORdepartmentNum: '2'
  };
  isCustomPlan = false;
  isOutage = true;

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
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    this.route.params.subscribe(_params => this.handleInit());
    this.detectUrlChange(location.pathname);

    this.router.events.subscribe((val: NavigationEnd) => {
      if (val instanceof NavigationEnd && val.url) {
        this.detectUrlChange(val.url);
      }
    });

    this.userInfoService.getUserAccessRightDetail().subscribe(response => {
      this.accessRight = Number(response.accessRight);
    });

    this.checkManageStatus();
  }

  handleInit() {
    this.isGroupInfoLoading = true;
    this.hashGroupId = this.route.snapshot.paramMap.get('groupId');
    this.groupId = this.hashIdService.handleGroupIdDecode(
      this.hashGroupId
    );
    if (this.groupId && this.groupId.length > 0) {
      this.groupLevel = this.utils.displayGroupLevel(this.groupId);
    }
    if (this.groupId.length === 0) {
      return this.router.navigateByUrl('/404');
    }
    this.token = this.utils.getToken() || '';
    const body = {
      token: this.token,
      groupId: this.groupId,
      findRoot: '1',
      avatarType: '2'
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
      this.groupService.saveGroupInfo(this.groupInfo); // 將群組資訊存取進service減少call api次數-kidin-1081227
      const {
        groupIcon,
        groupId,
        selfJoinStatus,
        groupStatus,
        shareActivityToMember,
        shareAvatarToMember,
        shareReportToMember,
        brandType,
      } = this.groupInfo;

      this.brandType = brandType;

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

      // 確認群組頭像是否更新-kidin-1090113
      this.groupService.getImgUpdatedStatus().subscribe(response => {
        this.updateImgQueryString = response;
      });

      this.groupImg =
        groupIcon && groupIcon.length > 0
          ? `${groupIcon}${this.updateImgQueryString}`
          : '/assets/images/group-default.svg';
      this.group_id = this.utils.displayGroupId(groupId);
      this.groupLevel = this.utils.displayGroupLevel(groupId);
      if (this.groupLevel === '40') {
        this.totalGroupName =
          this.groupInfo.groupRootInfo[2].brandName +
          ' - ' +
          this.groupInfo.groupName;
      } else if (this.groupLevel === '60') {
        this.totalGroupName =
          this.groupInfo.groupRootInfo[2].brandName +
          ' - ' +
          this.groupInfo.groupRootInfo[3].branchName +
          ' - ' +
          this.groupInfo.groupName;
      } else {
        this.totalGroupName = this.groupInfo.groupName;
      }
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
      let isAutoApplyGroup = this.utils.getLocalStorageObject(
        'isAutoApplyGroup'
      );
      this.userInfoService.getUserAccessRightDetail().subscribe(response => {
        this.visitorDetail = response;
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

      this.isGroupInfoLoading = false;
    });

  }

  handleShareTarget(shareData, type) {
    const browserLang = this.utils.getLocalStorageObject('locale');
    let text = '';
    let accessRights = [];
    if (browserLang === 'zh-tw') {
      if (shareData.switch === '3') {
        text = '僅開放對象為';  // mark
        accessRights = shareData.enableAccessRight;
      } else {
        text = '不開放對象為';  // mark
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
          if (this.brandType === 1) {
            return '品牌管理員';
          } else {
            return '企業管理員';
          }
        } else if (_accessRight === '40') {
          if (this.brandType === 1) {
            return '分店管理員';
          } else {
            return '分公司管理員';
          }
        } else if (_accessRight === '50') {
          if (this.brandType === 1) {
            return '體適能教練';
          } else {
            return '部門管理員';
          }
        } else {
          if (this.brandType === 1) {
            return '專業老師';
          } else {
            return '社團管理員';
          }
        }
      } else if (browserLang === 'zh-cn') {
        if (_accessRight === '30') {
          if (_accessRight === '30') {
            if (this.brandType === 1) {
              return '品牌管理员';
            } else {
              return '企業管理员';
            }
          } else if (_accessRight === '40') {
            if (this.brandType === 1) {
              return '分店管理员';
            } else {
              return '分公司管理员';
            }
          } else if (_accessRight === '50') {
            if (this.brandType === 1) {
              return '体适能教练';
            } else {
              return '部門管理员';
            }
          } else {
            if (this.brandType === 1) {
              return '专业老师';
            } else {
              return '社團管理员';
            }
          }
        }
      } else {
        if (_accessRight === '30') {
          if (this.brandType === 1) {
            return 'Brand administrator';
          } else {
            return '企業管理員';
          }
        } else if (_accessRight === '40') {
          if (this.brandType === 1) {
            return 'Branch manager';
          } else {
            return '分公司管理員';
          }
        } else if (_accessRight === '50') {
          if (this.brandType === 1) {
            return 'Physical fitness coach';
          } else {
            return '部門管理員';
          }
        } else {
          if (this.brandType === 1) {
            return 'Professional teacher';
          } else {
            return '社團管理員';
          }
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

  // 1.群組資訊 2.品牌管理 3.隱私權設定 4.我的報告(健身房) 5.課程分析(健身房) 6.運動報告(企業) 7.生活追蹤(企業)-kidin-1090211
  handleGroupItem(idx) {
    this.editManageMode = false;
    if (idx === 4) {
      this.chooseIdx = idx;
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashGroupId}/my-report`);
    } else if (idx === 5) {
      this.chooseIdx = idx;
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashGroupId}/class-analysis`);
    } else if (idx === 6) {
      this.chooseIdx = idx;
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashGroupId}/com-report`);
    } else if (idx === 7) {
      this.chooseIdx = idx;
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashGroupId}/com-life-tracking`);
    } else if (idx === 2) {
      this.chooseIdx = idx;
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashGroupId}`);
      this.checkManageStatus();
    } else {
      this.chooseIdx = idx;
      this.router.navigateByUrl(`/dashboard/group-info/${this.hashGroupId}`);
    }
  }

  // 確認群組營運狀態-kidin-1090414
  checkManageStatus () {

    const body = {
      token: this.token,
      groupId: `0-0-${this.groupId.split('-')[2]}-0-0-0`
    };

    this.isCommerceInfoLoading = true;
    this.groupService.fetchCommerceInfo(body).subscribe(res => {
      this.isCommerceInfoLoading = false;
      this.commerceInfo = res.info;

      this.editContent = {
        status: this.commerceInfo.commerceStatus,
        plan: this.commerceInfo.commercePlan,
        administratorNum: this.commerceInfo.groupManagerStatus.maxGroupManagers,
        memberNum: this.commerceInfo.groupMemberStatus.maxGroupMembers,
        expire: this.commerceInfo.commercePlanExpired,
        branchNum: this.commerceInfo.groupStatus.maxBranches,
        classORdepartmentNum: this.commerceInfo.groupStatus.maxClasses
      };

      // 若為停運中或授權到期，則關閉任何分享、管理按鈕、報告功能-kidin-1090414
      setTimeout(() => {
        const expireDate = moment(this.commerceInfo.commercePlanExpired).valueOf(),
            today = moment().valueOf();

        if (this.commerceInfo.commerceStatus !== '1'
          || expireDate - today < 0) {
          this.isOutage = true;
        } else {
          this.isOutage = false;
        }
      }, 0);

    });
  }

  openShareGroupInfoDialog() {
    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url: location.href,
        title: this.translate.instant('SH.share'),
        totalGroupName: this.totalGroupName || '',
        cancelText: this.translate.instant('SH.cancel')
      }
    });
  }

  getAndInitTranslations() {
    this.translate
      .get(['Dashboard.Group.disclaimer', 'SH.agree', 'SH.disagree'])
      .subscribe(translation => {
        this.title = translation['Dashboard.Group.disclaimer'];
        this.confirmText = translation['SH.agree'];
        this.cancelText = translation['SH.disagree'];
      });
  }


  handleActionGroup(_type) {
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
            this.sendJoinRequest(_type);
          }
        }
      });

    } else {
      this.sendJoinRequest(_type);
    }
  }

  // 修正加入時call兩次api造成出現錯誤訊息的問題-kidin-1090121
  sendJoinRequest (_type) {
    this.userProfileService
      .getUserProfile({
        token: this.token,
        avatarType: 2,
      })
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

          if (_type === 1) {
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
        }
      });

    const body = {
      token: this.token,
      groupId: this.groupId,
      actionType: _type,
      brandType: this.brandType
    };

    const isBeenGroupMember = this.joinStatus === 2;
    this.groupService
      .actionGroup(body)
      .subscribe(({ resultCode, info: { selfJoinStatus }, resultMessage }) => {
console.log('message', resultMessage);
        let message;
        switch (resultMessage) {
          case 'Commerce stopped[2]!':  // 停運中
            message = `${this.translate.instant('Dashboard.Group.group')} ${this.translate.instant('Dashboard.BrandManagement.outOfService')}`;
            break;
          case 'Commerce stopped[3]!':  // 歇業
            message = `${this.translate.instant('Dashboard.Group.group')} ${this.translate.instant('Dashboard.BrandManagement.outOfBusiness')}`;
            break;
          case 'Commerce stopped[4]!':  // 待銷毀
            message = `${this.translate.instant('Dashboard.Group.group')} ${this.translate.instant('Dashboard.BrandManagement.toBeDestroyed')}`;
            break;
          case 'This group member number more than commerce plan restrictions.': // 已滿員
            message = `${this.translate.instant('Dashboard.Group.group')} ${this.translate.instant('Dashboard.Group.GroupInfo.groupFull')}`;
        }

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
        } else {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: message,
              confirmText: this.translate.instant('SH.determine')
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
      infoType: _type,
      avatarType: 3
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        const {
          info: { groupMemberInfo, subGroupInfo }
        } = res;
        if (_type === 1) {
          this.subGroupInfo = subGroupInfo;
          this.subBrandInfo = this.subGroupInfo.brands.map(_brand => {
            return {
              ..._brand,
              groupIcon: _brand.groupIcon
            };
          });
          this.subBranchInfo = this.subGroupInfo.branches
            .filter(_branch => {
              if (_branch.groupStatus !== 4) {
                // 過濾解散群組
                return _branch;
              }
            })
            .map(_branch => {
              return {
                ..._branch,
                groupIcon: _branch.groupIcon
              };
            });
          this.subCoachInfo = this.subGroupInfo.coaches
            .filter(_coach => {
              if (_coach.groupStatus !== 4) {
                // 過濾解散群組
                return _coach;
              }
            })
            .map(_coach => {
              return {
                ..._coach,
                groupIcon: _coach.groupIcon
              };
            });
        } else {
          this.groupInfos = groupMemberInfo;
          this.groupInfos = this.groupInfos
            .map(_info => {
              return {
                ..._info,
                memberIcon: _info.memberIcon
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
                _admin.groupId === this.groupId &&
                +_admin.accessRight <= +this.groupLevel &&
                _admin.joinStatus === 2
            ) > -1 &&
            (this.joinStatus !== 2 && !this.visitorDetail.isCanManage)
          ) {
            this.joinStatus = 2;
            this.userInfoService.getUserDetail(body, this.groupId);
          }
        }
      }
      this.isLoading = false;
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

  // 切換到群組編輯頁面-kidin-1081216
  goEditPage() {
    this.router.navigateByUrl(`${location.pathname}/edit`);
  }

  // 依照網址導引至該頁面-kidin-10812217
  detectUrlChange(url) {
    if (url.indexOf('my-report') > -1) {
      this.chooseIdx = 4;
    } else if (url.indexOf('class-analysis') > -1) {
      this.chooseIdx = 5;
    } else if (url.indexOf('com-report') > -1) {
      this.chooseIdx = 6;
    } else if (url.indexOf('com-life-tracking') > -1) {
      this.chooseIdx = 7;
    } else if (this.chooseIdx !== 2 && this.chooseIdx !== 3) {
      this.chooseIdx = 1;
    }
  }

  // 開啟/關閉編輯模式-kidin-1090409
  editMode (action) {
    this.editManageMode = action;

    if (this.editContent.plan === '99') {
      setTimeout(() => {
        this.setReadonly(false);
      }, 0);
    } else {
      setTimeout(() => {
        this.setReadonly(true);
      }, 0);
    }
  }

  // 若為客製方案，則允許編輯其他欄位，其他方案則固定內容-kidin-1090409
  editManageContent (e) {
    switch (e.value) {
      case '1':
        this.editContent.branchNum = '1';
        this.editContent.classORdepartmentNum = '2';
        this.editContent.administratorNum = '4';
        this.editContent.memberNum = '20';
        this.isCustomPlan = false;
        this.setReadonly(true);

        break;
      case '2':
        this.editContent.branchNum = '3';
        this.editContent.classORdepartmentNum = '10';
        this.editContent.administratorNum = '25';
        this.editContent.memberNum = '1000';
        this.isCustomPlan = false;
        this.setReadonly(true);

        break;
      case '3':
        this.editContent.branchNum = '10';
        this.editContent.classORdepartmentNum = '80';
        this.editContent.administratorNum = '200';
        this.editContent.memberNum = '10000';
        this.isCustomPlan = false;
        this.setReadonly(true);

        break;

      case '99':
        this.setReadonly(false);

        break;
    }

  }

  // 若非客製方案則不允許方案內容編輯-kidin-1090409
  setReadonly (action) {
    const planContent = document.querySelectorAll('.editManageInput input');
    if (action) {

      for (let i = 0; i < planContent.length; i++) {
        planContent[i].setAttribute('readonly', 'readonly');
        planContent[i].setAttribute('style', 'color: #919191;');
      }

    } else {

      for (let i = 0; i < planContent.length; i++) {
        planContent[i].removeAttribute('readonly');
        planContent[i].setAttribute('style', 'color: black;');
      }

    }
  }

  // 取得所選日期-kidin-1090409
  getSelectDate (date) {
    this.editContent.expire = moment(date.startDate).format('YYYY-MM-DDT12:00:00.000Z');
  }

  // 確認客製方案皆輸入值，且不為0，否則轉為體驗方案預設值-kidin-1090410
  checkValue (e , item) {
    const value = +e.target.value,
          defaultSetting = {
            administratorNum: '4',
            memberNum: '20',
            branchNum: '1',
            classORdepartmentNum: '2'
          };

    if (!this.utils.isNumber(value) || value <= 0 || value === null) {
      this.editContent[item] = defaultSetting[item];
    }

  }

  // 編輯品牌/企業管理設定-kidin-1090409
  editManage () {
    const body = {
      token: this.utils.getToken() || '',
      groupId: this.groupId,
      commercePlan: this.editContent.plan,
      commercePlanExpired: this.editContent.expire,
      commerceStatus: this.editContent.status,
      groupSetting: {
        maxBranches: this.editContent.branchNum,
        maxClasses: this.editContent.classORdepartmentNum,
        maxGeneralGroups: '0'
      },
      groupManagerSetting: {
        maxGroupManagers: this.editContent.administratorNum
      },
      groupMemberSetting: {
        maxGroupMembers: this.editContent.memberNum
      }
    };

    this.groupService.editGroupManage(body).subscribe(res => {

      if (+res.resultCode === 200) {
        this.isCommerceInfoLoading = true;
        this.groupService.fetchCommerceInfo(body).subscribe(result => {
          this.isCommerceInfoLoading = false;
          this.commerceInfo = result.info;
        });

        this.checkManageStatus();

        this.editManageMode = false;
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Error',
            body: 'Please try again.',
            confirmText: 'Confirm'
          }
        });
      }

    });
  }
}
