import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { OfficialActivityService } from '../../../../shared/services/official-activity.service';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import { MessageBoxComponent } from './../../../../shared/components/message-box/message-box.component';

import moment from 'moment';
import md5 from 'md5';
import { Subject, fromEvent, of, Subscription, Observable } from 'rxjs';
import { takeUntil, debounceTime, switchMap, map } from 'rxjs/operators';


@Component({
  selector: 'app-official-activity',
  templateUrl: './official-activity.component.html',
  styleUrls: ['./official-activity.component.scss']
})
export class OfficialActivityComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  rxKeywordInput = new Subscription();

  @ViewChild('applySection') applySection: ElementRef;
  @ViewChild('serialNumber') serialNumber: ElementRef;

  uiFlag = {
    width: 1500,
    changeFileLoading: false,
    currentTag: 'description', // description/leaderBoard/activityList/search
    cardExpand: false,
    cardExpandId: null,
    groupSelect: {
      name: '',
      index: 0
    },
    showGroupSelector: false,
    discountSelectIdx: 0,
    currentGroupId: 0,
    currentRankStart: 1,
    canPrev: false,
    canNext: false,
    displayRanking: [],
    showAll: false,
    displayUserActivity: [],
    showAutoCompleteList: false,
    showFloatActivityList: false,
    activityEnd: false,
    applied: false,
    copied: false,
    haveAnyActivity: false
  };

  activity: any = {};
  userProfile: any;
  nicknameList: Array<any>  = [];
  allActivity: Array<any> = [];

  search = {
    name: '',
    userId : null,
    icon: '',
    userRecord: []
  };

  currentTimeStamp = moment().valueOf();

  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private officialActivityService: OfficialActivityService,
    private hashIdService: HashIdService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.utils.setHideNavbarStatus(true);
    this.uiFlag.width = document.body.clientWidth;
    this.handlePageResize();
    this.getUserProfile();
    this.createPage(this.getFileName(location.search));

    this.sliceActivityList();  // 待開發完移除
  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-20200710
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.uiFlag.width = document.body.clientWidth;
    });

  }


  /**
   * 取得登入者資訊
   * @author kidin-1090908
   */
  getUserProfile() {
    const token = this.utils.getToken() || '';

    if (token.length !== 0) {
      const body = {
        token
      };

      this.userProfileService.getUserProfile(body).subscribe(res => {
        if (res.processResult.resultCode !== 200) {
          console.log(`${res.processResult.apiCode}：${res.processResult.apiReturnMessage}`);
        } else {
          Object.assign(res, {serialNumber: this.hashIdService.handleUserIdEncode(res.userId)});
          this.userProfile = res.userProfile;
        }

      });

    }

  }

  /**
   * 取得檔案名稱
   * @param search {string}-query string
   * @returns fileName-活動檔案名稱
   * @author kidin-1090907
   */
  getFileName(search: string): string {
    if (search.indexOf('file') > -1) {

      if (search.indexOf('&') > -1) {
        return search.split('file=')[1].split('&')[0];
      } else {
        return search.split('=')[1];
      }

    } else {
      return '';
    }

  }

  /**
   * 取得頁面所需資訊創建頁面
   * @param fileName {string}
   * @author kidin-1090908
   */
  createPage(fileName: string) {
    const token = this.utils.getToken() || '',
          body = {
            token
          };

    this.officialActivityService.getAllOfficialActivity(body).subscribe(res => {

      if (res.resultCode !== 200) {
        console.log('Get all activity error.');

      } else {
        const activityList = res.activityList;

        if (activityList.length !== 0) {
          this.uiFlag.haveAnyActivity = true;
          activityList.sort((a, b) => b.finalTimeStamp - a.finalTimeStamp);
          this.allActivity = activityList;

          if (fileName.length > 0) {
            this.getFile(fileName, token);
          } else {
            this.getFile(this.allActivity[0].fileName, token);
          }

        }

      }

    });

  }


  /**
   * 從query string取得file name，並取得file內容
   * @param search {string}
   * @param token {string}
   * @author kidin-1090903
   */
  getFile(fileName: string, token: string) {
    this.uiFlag.changeFileLoading = true;
    const body = {
      token,
      fileName
    };

    this.officialActivityService.getOfficialActivity(body).pipe(
      map(resp => {
        if (resp['resultCode'] === 200) {
          this.getImgPath(resp);
          this.getAllUserIcon(resp);
        }

        return resp;
      })
    ).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`Error: ${res.resultMessage}`);
        this.uiFlag.changeFileLoading = false;
      } else {
        this.activity = res.activity;
        this.uiFlag.changeFileLoading = false;

        // 確認活動是否結束
        if (this.activity.endTimeStamp < moment().valueOf()) {
          this.uiFlag.activityEnd = true;
        } else {
          this.uiFlag.activityEnd = false;
          this.uiFlag.groupSelect.name = this.activity.group[0].groupName;
          this.uiFlag.applied = this.checkoutUserApply();

          if (!this.uiFlag.applied && location.search.indexOf('applyActivity') > -1) {
            this.scrollToApplySection();
          }

        }

      }

    });

  }

  /**
   * 取得官方活動檔案所有照片url
   * @param resp {object}-官方活動檔案
   * @author kidin-1090914
   */
  getImgPath(resp: any) {
    const fileName = resp['activity']['fileName'];
    let path;

    if (location.hostname.indexOf('192.168.1.235') > -1) {
      path = `http://192.168.1.235:3001/nodejs/img/${fileName}/`;
    } else {
      path = `https://${location.hostname}:3000/nodejs/img/${fileName}/`;
    }

    resp['activity']['eventImage'] = `${path}${resp['activity']['eventImage']}`;

    const type = ['card', 'product', 'discount'];
    type.forEach(_type => {
      resp['activity'][_type].map((_item, index) => {

        if (_item && _item['img'].length !== 0) {
          _item.img = `${path}${_type}_${index}.${_item.img.split('.')[1]}`;
        }

        return _item;
      });

    });

    return resp;
  }

  /**
   * 依圖片舊制取得所有參賽者icon url
   * @param resp {object}-官方活動檔案
   * @author kidin-1090914
   */
  getAllUserIcon(resp: any) {
    resp['activity']['group'].map(_group => {

      _group.rank.map(_rank => {
        let host: string;
        if (location.host.indexOf('192.168.1.235') > -1) {
          host = 'https://app.alatech.com.tw';
        } else {
          host = `https://${location.hostname}`;
        }

        Object.assign(_rank, { icon: `${host}/${md5('alatech')}/s_${this.hashIdService.handleUserIdEncode(_rank.userId)}.png` });
        return _rank;
      });

      return _group;
    });

  }

  /**
   * 檢查使用者報名狀態
   * @author kidin-1090909
   */
  checkoutUserApply() {
    return this.activity.group.some(_group => _group.member.some(_member => _member.userId === this.userProfile.userId));
  }

  /**
   * 確認登入狀態並捲動到指定元素位置
   * @author kidin-1090910
   */
  scrollToApplySection(): void {
    this.uiFlag.currentTag = 'description';
    setTimeout(() => {
      const element = this.applySection.nativeElement;
      element.scrollIntoView();
    });

  }

  /**
   * 返回首頁
   * @author kidin-1090907
   */
  returnHomePage() {
    this.router.navigateByUrl('/');
  }

  /**
   * 未登入則導引至登入頁，若已登入則確認是否有無優惠組合，有則導至指定位置，無則直接幫使用者報名。
   * @author kidin-1090909
   */
  navigateApply() {
    if (this.userProfile === undefined) {
      this.router.navigateByUrl(`/signIn-web?action=applyActivity&activity=${this.activity.fileName}`);
    } else {

      if (this.activity.discount.length === 0 && this.activity.group.length === 1) {
        this.applyActivity();
      } else {
        this.scrollToApplySection();
      }

    }

  }

  /**
   * 導向指定官方活動頁面
   * @param fileName {string}
   * @author kidin-1090907
   */
  navigateAssignActivity(fileName: string) {
    this.router.navigateByUrl(`/official-activity?file=${fileName}`);
    this.uiFlag.currentTag = 'description';
    this.uiFlag.copied = false;
    this.createPage(fileName);
  }

  /**
   * 點擊tag顯示不同頁面
   * @param tag {string}
   * @author kidin-1090817
   */
  handleShowPage(tag: string): void {
    if (this.uiFlag.width < 803) {
      this.uiFlag.currentTag = tag;
    } else if (tag === 'activityList') {

      if (this.uiFlag.showFloatActivityList === true) {
        this.uiFlag.showFloatActivityList = false;
      } else {
        this.uiFlag.showFloatActivityList = true;
      }

    } else {
      this.uiFlag.showFloatActivityList = false;
      this.uiFlag.currentTag = tag;
    }

    if (tag === 'leaderBoard') {
      this.checkGroupRankingLength();
    } else if (tag === 'search') {
      this.listenAutoComplete();
      this.getUserInfo();
    }

  }

  /**
   * 點擊卡片展開或收合
   * @event click
   * @param cardId {number}
   * @author kidin-1090817
   */
  handleCardExpand(cardId: number): void {
    if (this.uiFlag.cardExpand) {
      this.uiFlag.cardExpand = false;
      this.uiFlag.cardExpandId = null;
    } else {
      this.uiFlag.cardExpand = true;
      this.uiFlag.cardExpandId = cardId;
    }

  }

  /**
   * 顯示或隱藏分組選擇器
   * @param gid {number} group順位
   * @param mid {number} member順位
   * @author kidin-1090901
   */
  showGroupSelector() {
    if (this.uiFlag.showGroupSelector) {
      this.uiFlag.showGroupSelector = false;
    } else {
      this.uiFlag.showGroupSelector = true;
    }

  }

  /**
   * 使用者選擇組別
   * @param groupIdx {number}
   * @author kidin-1090901
   */
  changeGroup(groupIdx: number) {
    this.uiFlag.groupSelect = {
      name: this.activity.group[groupIdx].groupName,
      index: groupIdx
    };

  }

  /**
   * 使用者選擇優惠組合
   * @param index {number}
   */
  selectDiscount(index: number) {
    this.uiFlag.discountSelectIdx = index;
    if (this.uiFlag.applied || this.userProfile === undefined) {
      window.open(this.activity.discount[index].link, '_blank', 'noopener=yes,noreferrer=yes');
    }

  }

  /**
   * 使用者點擊後送出報名
   * @author kidin-1090909
   */
  applyActivity() {
    let account: string;
    if (this.userProfile.email) {
      account = this.userProfile.email;
    } else {
      account = `+${this.userProfile.countryCode} ${this.userProfile.mobileNumber}`;
    }

    const userApplyInfo = {
      userId: this.userProfile.userId,
      nickname: this.userProfile.nickname,
      account,
      gender: this.userProfile.gender,
      age: this.getAge(this.userProfile.birthday),
      applyTimeStamp: moment().valueOf(),
      status: 'checking'
    };

    const body = {
      token: this.utils.getToken() || '',
      groupIdx: this.uiFlag.groupSelect.index,
      fileName: this.activity.fileName,
      memberInfo: userApplyInfo
    };

    this.officialActivityService.applyOfficialActivity(body).subscribe(res => {
      this.uiFlag.applied = true;

      let msg: string;
      if (res.resultCode !== 200) {
        msg = 'Error! 請稍後再試';
      } else {
        msg = '申請成功';
      }

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: msg,
          confirmText: '確認',
          onConfirm: this.navigateAssignPage.bind(this)
        }

      });

    });

  }

  /**
   * 取得使用者年紀
   * @param birthday {string}
   * @returns age {number}
   * @author kidin-1090909
   */
  getAge(birthday: string): number {
    return Math.floor((moment().valueOf() - moment(birthday, 'YYYYMMDD').valueOf()) / (1000 * 60 * 60 * 24 * 365));
  }

  /**
   * 幫使用者複製序號
   * @event click
   * @author kidin-1090909
   */
  copySerialNumber() {
    const serialNumberInput = this.serialNumber.nativeElement;
    serialNumberInput.select();
    document.execCommand('copy');
    this.uiFlag.copied = true;
  }

  /**
   * 轉導至繳費頁面（若無需報名費則不用轉導）
   * @author kidin-1090909
   */
  navigateAssignPage() {
    if (this.activity.discount.length === 0) {
      return false;
    } else {
      window.open(this.activity.discount[this.uiFlag.discountSelectIdx].link, '_blank', 'noopener=yes,noreferrer=yes');
      return;
    }

  }


  /**
   * 確認該組排名長度
   * @param groupId {number}-目前群組id
   * @author kidin-1090820
   */
  checkGroupRankingLength(groupId: number = 0) {
    if (
      this.activity.group[groupId].rank.length <= 10
      || this.uiFlag.currentRankStart + 10 > this.activity.group[groupId].rank.length
    ) {
      this.uiFlag.canNext = false;
    } else {
      this.uiFlag.canNext = true;
    }

    if (this.uiFlag.currentRankStart - 10 < 1) {
      this.uiFlag.canPrev = false;
    } else {
      this.uiFlag.canPrev = true;
    }

    this.sliceRankingList(this.uiFlag.currentGroupId, this.uiFlag.currentRankStart);
  }

  /**
   * 只顯示該組排行榜指定範圍內的10名
   * @param groupId {number}-組別id
   * @param rankStart {number}-開始名次
   * @author kidin-1090820
   */
  sliceRankingList(groupId: number = 0, rankStart: number = 1): void {
    if (this.uiFlag.canNext) {
      this.uiFlag.displayRanking = this.activity.group[groupId].rank.slice(rankStart - 1, rankStart + 9);
    } else {
      this.uiFlag.displayRanking = this.activity.group[groupId].rank.slice(rankStart - 1, this.activity.group[groupId].rank.length);
    }

  }

  /**
   * 切換前一輪或後一輪排名
   * @param action {string} prev/next
   * @author kidin1090820
   */
  handleChangeRankRange(action: string): void {
    if (action === 'prev') {
      this.uiFlag.currentRankStart = this.uiFlag.currentRankStart - 10;
    } else {
      this.uiFlag.currentRankStart = this.uiFlag.currentRankStart + 10;
    }

    this.checkGroupRankingLength(this.uiFlag.currentGroupId);
  }

  /**
   * 點擊群組後切換該組排行榜
   * @event click
   * @param groupId {number}
   * @author kidin-1090820
   */
  handleClickGroup(groupId: number) {
    this.uiFlag.currentGroupId = groupId;
    this.uiFlag.currentRankStart = 1;
    this.checkGroupRankingLength(this.uiFlag.currentGroupId);
  }

  /**
   * 點擊商品後開新視窗引導至商品對應連結
   * @event click
   * @param id {number}
   * @author kidin-1090820
   */
  handleNavigatePage(id: number) {
    window.open(this.activity.product[id].link, '_blank', 'noopener=yes,noreferrer=yes');
  }

  /**
   * 監聽使用者輸入暱稱時，送出關鍵字並產生列表讓使用者點選。
   * @author kidin-1090821
   */
  listenAutoComplete() {

    let input;
    setTimeout(() => {
      input = fromEvent(document.querySelector('#keywordInput'), 'input');

      this.rxKeywordInput = input.pipe(
        debounceTime(500),
        map(e => (e as any).target.value),
        switchMap(value => {
          if ((value as string).length < 1) {
            this.uiFlag.showAutoCompleteList = false;
            return of([]);
          } else {
            const body = {
              token: this.utils.getToken() || '',
              keyword: value
            };

            return this.userProfileService.searchNickname(body).pipe(
              map(resp => resp)
            );
          }

        }),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(result => {
        if (result.nickname.length > 0) {
          this.nicknameList = result.nickname;
          this.uiFlag.showAutoCompleteList = true;
        } else {
          this.nicknameList.length = 0;
          this.uiFlag.showAutoCompleteList = false;
        }

      });

    });

  }

  /**
   * 若使用者已登入，則直接幫使用者尋找個人紀錄
   * @author kidin-1090908
   */
  getUserInfo() {
    if (this.utils.getToken()) {
      this.search = {
        name: this.userProfile.nickname,
        userId: this.userProfile.userId,
        icon: this.userProfile.avatarUrl,
        userRecord: []
      };

      this.searchUserActivity();
    }

  }

  /**
   * 使用者點擊暱稱列表後儲存暱稱並送出
   * @param search {object}
   * @author kidin-1090821
   */
  handleClickKeyword(search: any) {
    let host: string;
    if (location.host.indexOf('192.168.1.235') > -1) {
      host = 'https://app.alatech.com.tw';
    } else {
      host = `https://${location.hostname}`;
    }

    const iconPath = `${host}/${md5('alatech')}/m_${this.hashIdService.handleUserIdEncode(search.user_id)}.png`;
    this.search = {
      name: search.login_acc,
      userId: search.user_id,
      icon: iconPath,
      userRecord: []
    };

    this.uiFlag.showAutoCompleteList = false;
  }

  /**
   * 使用者點擊搜尋後，送出搜尋並顯示結果。
   * @event click
   * @param e {Event}
   * @author kidin-1090821
   */
  searchUserActivity() {
    const body = {
      token: this.utils.getToken() || '',
      userId: this.search.userId
    };

    this.officialActivityService.getUserRecord(body).pipe(
      map(res => {
        res['fileName'].map(_res => this.addActivityStatus(_res));
        return res['fileName'];
      })
    ).subscribe(resp => {
      this.search.userRecord = resp;
      this.sliceActivityList();
    });

  }

  /**
   * 根據賽事結束時間判斷賽事狀態，並儲存至物件
   * @param _record {object}
   * @author kidin-1090824
   */
  addActivityStatus(_record: any): void {

    if (_record.finalTimeStamp < this.currentTimeStamp) {
      const relativeTimeStamp = this.currentTimeStamp - _record.finalTimeStamp;
      Object.assign(_record, {'activityStatus': this.getRelativeTime(relativeTimeStamp)});
    } else if (_record.startTimeStamp > this.currentTimeStamp) {
      Object.assign(_record, {'activityStatus': '尚未開始'});
    } else {
      Object.assign(_record, {'activityStatus': '進行中'});
    }

    return _record;
  }

  /**
   * 取得相對天數/月數/年數
   * @param retiveTimeStamp {number}
   * @author kidin-1090824
   */
  getRelativeTime(retiveTimeStamp: number): string {
    const relativeDay = retiveTimeStamp / (24 * 60 * 60 * 1000);
    if (relativeDay < 30) {
      return `${Math.round(relativeDay)}天前`;
    } else if (relativeDay >= 30 && relativeDay < 365) {
      return `${Math.round(relativeDay / 30)}個月前`;
    } else {
      return `${Math.round(relativeDay / 365)}年前`;
    }

  }

  /**
   * 只顯示前10個參賽列表
   * @param userRecord {array}
   * @author kidin-1090821
   */
  sliceActivityList() {
    const userRecord = this.search.userRecord;
    if (userRecord.length > 10) {
      this.uiFlag.displayUserActivity = userRecord.slice(0, 10);
      this.uiFlag.showAll = false;
    } else {
      this.uiFlag.displayUserActivity = userRecord;
      this.uiFlag.showAll = true;
    }

  }

  /**
   * 使用者點擊"更多"後，顯示所有參賽列表
   * @event click
   * @author kidin-1090821
   */
  handleSeeMore() {
    this.uiFlag.displayUserActivity = this.search.userRecord;
    this.uiFlag.showAll = true;
  }

  /**
   * 取消隱藏navbar和取消訂閱
   */
  ngOnDestroy() {
    this.utils.setHideNavbarStatus(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (this.rxKeywordInput) {
      this.rxKeywordInput.unsubscribe();
    }

  }

}
