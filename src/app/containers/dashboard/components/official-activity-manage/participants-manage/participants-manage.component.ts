import { MessageBoxComponent } from './../../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileService } from './../../../../../shared/services/user-profile.service';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { OfficialActivityService } from '../../../../../shared/services/official-activity.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { GroupService } from '../../../services/group.service';
import moment from 'moment';
import { fromEvent, Subscription, Subject, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';


interface UserInfo {
  userId: number;
  nickname: string;
  account: string;
  gender: number;
  age: number;
  applyTimeStamp: number;
  status: string;
}

interface Group {
  groupName: string;
  member: UserInfo[];
}

@Component({
  selector: 'app-participants-manage',
  templateUrl: './participants-manage.component.html',
  styleUrls: ['./participants-manage.component.scss']
})
export class ParticipantsManageComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  pageClickEvent = new Subscription();

  @ViewChild('hashIdInput') hashIdInput: ElementRef;
  @ViewChild('accountInput') accountInput: ElementRef;
  @ViewChild('groupInput') groupInput: ElementRef;

  uiFlag = {
    isLoading: false,
    showSearchRes: false,
    focus: {
      gId: null,
      mId: null
    },
    payInfo: {
      showEditPayInfo: false,
      gId: null,
      mId: null,
      x: null,
      y: null
    },
    isFreeActivity: false,
    groupSelectorObj: {
      group: null,
      member: null
    },
    deleteMode: false
  };

  activity: any;
  editorId = null;

  constructor(
    private router: Router,
    private hashids: HashIdService,
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private groupService: GroupService,
    private userProfileService: UserProfileService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.getParticipant(location.search);
    this.getEditorId();
    this.listenEvent();
  }

  /**
   * 從query string取得file name後再取得指定活動檔案
   * @param search
   * @author kidin-1090901
   */
  getParticipant(search: string) {
    const fileName = search.split('=')[1],
          body = {
            token: this.utils.getToken() || '',
            fileName
          };

    this.uiFlag.isLoading = true;
    this.officialActivityService.getOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`Error: ${res.resultMessage}`);
      } else {
        this.activity = res.activity;

        if (this.activity.discount.length === 0) {
          this.uiFlag.isFreeActivity = true;
        }

      }

      this.uiFlag.isLoading = false;
    });

  }

  /**
   * 取得編輯者userId
   * @author kidin-1090915
   */
  getEditorId() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.editorId = res.userId;
    });

  }

  /**
   * 監聽整個頁面的點擊和捲動事件
   * @author kidin-1090907
   */
  listenEvent() {
    const pageClick = fromEvent(window, 'click');
    this.pageClickEvent = pageClick.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      if (this.uiFlag.payInfo.showEditPayInfo) {
        this.uiFlag.payInfo.showEditPayInfo = false;
      }

    });

  }

  /**
   * 阻止再次點擊輸入框時事件冒泡而隱藏輸入框
   * @param e {MouseEvent}
   * @author kidin-1090907
   */
  stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  /**
   * 返回列表
   * @event click
   * @author kidin-1090826
   */
  handleReturn(): void {
    this.router.navigateByUrl('/dashboard/system/event-management');
  }

  /**
   * 若輸入欄位為空則顯示全部列表
   * @event change
   * @author kidin-1090901
   */
  checkEmpty() {
    const hashUserId = this.hashIdInput.nativeElement.value;
    if (hashUserId.length === 0) {
      this.uiFlag.focus = {
        gId: null,
        mId: null
      };

    }

  }

  /**
   * 查詢hash過後的userId
   * @author kidin-1090901
   */
  searchUser() {
    const hashUserId = this.hashIdInput.nativeElement.value,
          searchUserId = +this.hashids.handleUserIdDecode(hashUserId);

    for (let i = 0; i < this.activity.group.length; i++) {

      const member = this.activity.group[i].member;
      for (let j = 0; j < member.length; j++) {

        if (member[j].userId === searchUserId) {

          this.uiFlag.focus = {
            gId: i,
            mId: j
          };

          break;
        }

      }

    }

  }

  /**
   * 切換delete mode
   * @author kidin-1090904
   */
  switchDeleteMode() {
    if (this.uiFlag.deleteMode === true) {
      this.uiFlag.deleteMode = false;
    } else {
      this.uiFlag.deleteMode = true;
    }

  }

  /**
   * 刪除參賽者
   * @param gid {number}
   * @param mid {number}
   * @author kidin-1090904
   */
  deleteUser(gid: number, mid: number) {
    const [delMember] = this.activity.group[gid].member.splice(mid, 1);

    Object.assign(delMember, {
      editInfo: {
        editorId: this.editorId,
        editTimestamp: moment().valueOf()
      }

    });

    this.activity.delMember.push(delMember);

    const body = {
      token: this.utils.getToken() || '',
      file: this.activity
    };

    this.uiFlag.isLoading = true;
    this.officialActivityService.updateOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log('Delete error');
      } else {
        console.log('Delete success');
      }

      this.uiFlag.isLoading = false;
    });

  }

  /**
   * 輸入userId加入參賽者
   * @param user_id {number}
   * @author kidin-1090901
   */
  addUser(user_id: number = null) {
    let userId: number;
    if (user_id === null) {
      userId = +this.accountInput.nativeElement.value;
    } else {
      userId = user_id;
    }

    // 確認user是否已經報名
    if (
      this.activity.group.some(_group => _group.member.some(_member => _member.userId === userId))
    ) {
      return false;

    // 確認user是否在刪除列表中
    } else if (this.checkDelMember(userId)) {
      this.saveFile();
    } else {
      this.uiFlag.isLoading = true;

      // 使用call nodejs api取得使用者資訊
      const body = {
        token: this.utils.getToken(),
        userId: userId
      };

      this.groupService.fetchUserAvartar(body).subscribe(res => {
        if (res.resultCode !== 200) {
          console.log('Add user Error');
        } else {

          if (res.userName === '') {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: '無此使用者!',
                confirmText: '確定'
              }

            });

          } else {

            let account;
            if (res.countryCode.length !== 0) {
              account = `+${res.countryCode} ${res.phone}`;
            } else {
              account = res.email;
            }

            const currentTimeStamp = moment().valueOf(),
                  addUser = {
                    userId: userId,
                    nickname: res.userName,
                    account: account,
                    gender: res.gender,
                    age: moment().year() - (+res.birthday.slice(0, 4)),
                    applyTimeStamp: currentTimeStamp,
                    status: this.uiFlag.isFreeActivity ? 'checked' : 'checking'
                  };

            this.activity.group[0].member.push(addUser);
            this.saveFile();
          }
        }

        this.uiFlag.isLoading = false;
      });

    }

  }

  /**
   * 將整個群組成員加入報名名單
   * @param hashGroupId {string}-hash過後的group id
   */
  addGroup() {
    const hashGroupId = this.groupInput.nativeElement.value,
          groupId = this.hashids.handleGroupIdDecode(hashGroupId),
          groupLevel = this.getGroupLevel(groupId),
          userIdSet = new Set(),
          body = {
            token: this.utils.getToken(),
            groupId,
            groupLevel,
            avatarType: 3,
            infoType: 5
          };

    this.uiFlag.isLoading = true;
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        res.info.groupMemberInfo.forEach(_info => {
          userIdSet.add(+_info.memberId);
        });

        let userIdArr = Array.from(userIdSet);
        userIdArr = userIdArr.filter(_userId => {
          return !this.checkDelMember(+_userId);
        });

        if (userIdArr.length !== 0) {
          this.addNonApplyUser(userIdArr as Array<number>);
        } else {
          this.saveFile();
        }

      }

      this.uiFlag.isLoading = false;
    });

  }

  /**
   * 確認欲加入的使用者是否已在參賽者列表或刪除列表中
   * @param userId {number}
   * @returns boolean
   * @author kidin-1090926
   */
  checkDelMember(userId: number): boolean {
    if (this.activity.group.some(_group => _group.member.some(_member => _member.userId === userId))) {
      return true;
    } else if (this.activity.delMember.some(_delMem => _delMem.userId === userId)) {

      let delIndex: number;
      const [addUser] = this.activity.delMember.filter((_delMember, index) => {
        if (_delMember.userId === userId) {
          delIndex = index;
          return true;
        } else {
          return false;
        }

      });

      this.activity.delMember.splice(delIndex, 1);
      addUser.status = this.uiFlag.isFreeActivity ? 'checked' : 'checking';
      delete addUser.editInfo;
      this.activity.group[0].member.push(addUser);

      return true;
    } else {
      return false;
    }

  }

  /**
   * 將未申請過的成員加入參賽人員列表
   * @param userIdList {Array<number>}
   * @author kidin-1090926
   */
  addNonApplyUser(userIdList: Array<number>) {
    const body = {
      token: this.utils.getToken(),
      userId: userIdList
    };

    this.groupService.fetchUserAvartar(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log('Add user Error');
      } else {

        res.userList.forEach(_user => {
          let account;
          if (_user.countryCode !== null && _user.countryCode !== '') {
            account = `+${_user.countryCode} ${_user.phone}`;
          } else {
            account = _user.email;
          }

          const currentTimeStamp = moment().valueOf(),
                addUser = {
                  userId: _user.userId,
                  nickname: _user.userName,
                  account: account,
                  gender: _user.gender,
                  age: moment().year() - (+_user.birthday.slice(0, 4)),
                  applyTimeStamp: currentTimeStamp,
                  status: this.uiFlag.isFreeActivity ? 'checked' : 'checking'
                };

          this.activity.group[0].member.push(addUser);
        });

        this.saveFile();
      }

      this.uiFlag.isLoading = false;
    });

  }

  /**
   * 開啟編輯參賽者狀態框
   * @event click
   * @param e {MouseEvent}
   * @param gid {number} group順位
   * @param mid {number} member順位
   * @author kidin-1090901
   */
  showEditPayInfo(e: MouseEvent, gid: number, mid: number) {
    e.stopPropagation();
    const menuPosition = {
      x: '',
      y: '',
    };

    // 點選位置太靠右則將選單往左移。
    if (e.view.innerWidth - e.clientX < 360) {
      menuPosition.x = `${e.clientX - 220}px`;
    } else {
      menuPosition.x = `${e.clientX}px`;
    }

    // 點選位置太靠下則將選單往上移。
    if (e.view.innerHeight - e.clientY < 350) {
      menuPosition.y = `${e.view.innerHeight - 350}px`;
    } else {
      menuPosition.y = `${e.clientY}px`;
    }

    this.uiFlag.payInfo = {
      showEditPayInfo: true,
      gId: gid,
      mId: mid,
      x: menuPosition.x,
      y: menuPosition.y
    };

  }


  /**
   * 變更參賽者狀態
   * @param status {string} checking/checked
   * @author kidin-1090901
   */
  checkStatus(status: string) {
    const gId = this.uiFlag.payInfo.gId,
          mId = this.uiFlag.payInfo.mId;

    if (this.activity.group[gId].member[mId].status !== status) {
      this.activity.group[gId].member[mId].status = status;
    }

    this.saveFile();
  }

  /**
   * 儲存單號
   * @event change
   * @param e {Event}
   * @author kidin-1090915
   */
  saveOrderNum(e: Event) {
    const orderNum = (e as any).target.value,
          editTarget = this.activity.group[this.uiFlag.payInfo.gId].member[this.uiFlag.payInfo.mId];

    if (editTarget.orderNum) {
      editTarget.orderNum = orderNum;
    } else {
      Object.assign(editTarget, {orderNum});
    }

    this.saveFile();
  }

  /**
   * 儲存備註
   * @event change
   * @param e {Event}
   * @author kidin-1090915
   */
  saveRemarks(e: Event) {
    const remarks = (e as any).target.value,
          editTarget = this.activity.group[this.uiFlag.payInfo.gId].member[this.uiFlag.payInfo.mId];

    if (editTarget.remarks) {
      editTarget.remarks = remarks;
    } else {
      Object.assign(editTarget, {remarks});
    }

    this.saveFile();
  }

  /**
   * 顯示或隱藏分組選擇器
   * @param gid {number} group順位
   * @param mid {number} member順位
   * @author kidin-1090901
   */
  showGroupSelector(gid: number, mid: number) {
    if (this.uiFlag.groupSelectorObj.group === gid && this.uiFlag.groupSelectorObj.member === mid) {
      this.uiFlag.groupSelectorObj = {
        group: null,
        member: null
      };
    } else {
      this.uiFlag.groupSelectorObj = {
        group: gid,
        member: mid
      };

    }

  }

  /**
   * 變更參賽者組別
   * @param gIdx {number}
   * @param mIdx {number}
   * @param groupIdx {number}
   * @author kidin-1090901
   */
  changeGroup(gIdx: number, mIdx: number, groupIdx: number) {
    if (gIdx !== groupIdx) {
      const memberInfo = this.activity.group[gIdx].member[mIdx];
      this.activity.group[gIdx].member = this.activity.group[gIdx].member.filter((_member, idx) => idx !== mIdx);
      this.activity.group[groupIdx].member.push(memberInfo);
      this.showGroupSelector(gIdx, mIdx);

      this.saveFile();
    }

  }

  /**
   * 將變更的設定傳至後端儲存
   * @author kidin-1090904
   */
  saveFile() {
    const body = {
      token: this.utils.getToken() || '',
      file: this.activity
    };

    this.uiFlag.isLoading = true;
    this.officialActivityService.updateOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log('Update error.');
      } else {
        console.log('Update success.');
      }

      this.uiFlag.isLoading = false;
    });

  }


  /**
   * 取得群組階層
   * @param groupId {string}
   * @returns groupLevel
   * @author kidin-1090916
   */
  getGroupLevel(groupId: string) {
    const groupIdArr = groupId.split('-');
    if (groupIdArr[3] === '0' && groupIdArr[4] === '0') {
      return 30;
    } else if (groupIdArr[3] !== '0' && groupIdArr[4] === '0') {
      return 40;
    } else if (groupIdArr[3] !== '0' && groupIdArr[4] !== '0') {
      return 60;
    }

  }

  /**
   * 取消訂閱
   * @author kidin-20200710
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
