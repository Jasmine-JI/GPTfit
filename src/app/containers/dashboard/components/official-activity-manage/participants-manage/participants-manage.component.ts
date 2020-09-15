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
  searchRes: Group[];
  editorId = null;

  constructor(
    private router: Router,
    private hashids: HashIdService,
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private groupService: GroupService,
    private userProfileService: UserProfileService
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

    this.officialActivityService.getOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`Error: ${res.resultMessage}`);
      } else {
        this.activity = res.activity;
        this.searchRes = this.deepCopy(this.activity.group);

        if (this.activity.discount.length === 0) {
          this.uiFlag.isFreeActivity = true;
        }

      }

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
      this.uiFlag.payInfo.showEditPayInfo = false;
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
      this.searchRes = this.deepCopy(this.activity.group);
    }

  }

  /**
   * 查詢hash過後的userId
   * @author kidin-1090901
   */
  searchUser() {
    const hashUserId = this.hashIdInput.nativeElement.value,
          searchUserId = +this.hashids.handleUserIdDecode(hashUserId);

    this.searchRes = this.searchRes.map(_group => {
      _group.member = _group.member.filter(_user => _user.userId === searchUserId);
      return _group;
    });

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

    this.officialActivityService.updateOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log('Delete error');
      } else {
        this.searchRes = this.deepCopy(this.activity.group);
      }

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

    let params = new HttpParams();
    params = params.set('userId', userId.toString());

    if (
      this.activity.group.some(_group => _group.member.some(_member => _member.userId === userId))
    ) {
      return false;
    } else if (this.activity.delMember.some(_delMem => _delMem.userId === userId)) {
      let delIndex: number;
      const [addUser] = this.activity.delMember.filter((_delMember, index) => {
        delIndex = index;
        return _delMember.userId === userId;
      });

      this.activity.delMember.splice(delIndex, 1);
      addUser.status = this.uiFlag.isFreeActivity ? 'checked' : 'checking';
      delete addUser.editInfo;

      this.activity.group[0].member.push(addUser);
      this.searchRes = this.deepCopy(this.activity.group);

      this.saveFile();
    } else {

      this.groupService.fetchUserAvartar(params).subscribe(res => {
        if (res.resultCode !== 200) {
          console.log('Add user Error');
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
          this.searchRes = this.deepCopy(this.activity.group);

          this.saveFile();
        }

      });

    }

  }

  /**
   * 將整個群組成員加入報名
   * @param hashGroupId {string}-hash過後的group id
   */
  addGroup() {
    const hashGroupId = this.groupInput.nativeElement.value,
          groupId = this.hashids.handleGroupIdDecode(hashGroupId),
          userIdSet = new Set(),
          body = {
            token: this.utils.getToken(),
            groupId,
            groupLevel: 30,
            avatarType: 3,
            infoType: 5
          };

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        res.info.groupMemberInfo.forEach(_info => {
          userIdSet.add(_info.memberId);
        });

        const userIdArr = Array.from(userIdSet);
        userIdArr.forEach(_userId => {
          this.addUser(+_userId);
        });
      }

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
    this.activity.group[gId].member[mId].status = status;

    if (this.searchRes.length === 1) {
      this.searchRes[0].member[0].status = status;
    } else {
      this.searchRes = this.deepCopy(this.activity.group);
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

    this.searchRes = this.deepCopy(this.activity.group);
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

    this.searchRes = this.deepCopy(this.activity.group);
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
      this.searchRes = this.deepCopy(this.activity.group);

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

    this.officialActivityService.updateOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log('Update error.');
      } else {
        console.log('Update success.');
      }

    });

  }

  /**
   * 物件深拷貝
   * @param obj
   * @param cache
   * @author kidin-1090902
   */
  deepCopy(obj: any, cache = new WeakMap()) {
    // 基本型別 & function
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Date 及 RegExp
    if (obj instanceof Date || obj instanceof RegExp) {
      return obj.constructor(obj);
    }

    // 檢查快取
    if (cache.has(obj)) {
      return cache.get(obj);
    }

    // 使用原物件的 constructor
    const copy = new obj.constructor();

    // 先放入 cache 中
    cache.set(obj, copy);

    // 取出所有一般屬性 & 所有 key 為 symbol 的屬性
    [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)].forEach(key => {
      copy[key] = this.deepCopy(obj[key], cache);
    });

    return copy;
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
