import { Component, OnInit, OnDestroy } from '@angular/core';
import { StationMailService } from '../services/station-mail.service';
import { Api50xxService, HashIdService, AuthService } from '../../../core/services';
import { checkResponse, getUrlQueryStrings, deepCopy } from '../../../core/utils/index';
import { Router, NavigationEnd } from '@angular/router';
import { appPath } from '../../../app-path.const';
import { QueryString } from '../../../shared/enum/query-string';
import { Subject, fromEvent, Subscription, merge, combineLatest, Observable } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MessageType } from '../enum/station-mail';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-mail-detail',
  templateUrl: './mail-detail.component.html',
  styleUrls: ['./mail-detail.component.scss', '../station-mail-child.scss'],
})
export class MailDetailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private pluralEventSubscription = new Subscription();
  private resizeEventSubscription = new Subscription();
  private senderListSubscription = new Subscription();

  /**
   * ui 用到的flag
   */
  uiFlag = {
    isMobile: false,
    showSenderMenu: false,
    senderIsBlack: false,
    senderIsFavorite: false,
    showReplyMail: false,
  };

  /**
   * 信件詳細內容
   */
  mailDetail: any;

  /**
   * 引言
   */
  foreword = '';

  /**
   * 正文
   */
  mainContent = '';

  /**
   * 常用名單
   */
  favoriteList: Array<any> | null = null;

  /**
   * 黑名單
   */
  blackList: Array<any> | null = null;

  /**
   * 回覆信件清單
   */
  replyMailList: Array<any> = [];

  readonly MessageType = MessageType;

  constructor(
    private stationMailService: StationMailService,
    private api50xxService: Api50xxService,
    private authService: AuthService,
    private router: Router,
    private hashIdService: HashIdService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkScreenWidth();
    this.getMailDetail();
    this.subscribeLanguageChange();
    this.subscribeRouteChange();
    this.subscribeResizeEvent();
    this.subscribeDeleteInboxMailEvent();
  }

  /**
   * 訂閱語言改變事件
   */
  subscribeLanguageChange() {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.getMailDetail();
    });
  }

  /**
   * 訂閱路徑變更事件
   */
  subscribeRouteChange() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      if (e instanceof NavigationEnd) this.getMailDetail();
    });
  }

  /**
   * 初始化變數
   */
  init() {
    this.replyMailList = [];
    this.uiFlag.showReplyMail = false;
  }

  /**
   * 取得信件詳細內容
   */
  getMailDetail() {
    this.init();
    const countryRegion = this.getCountryRegion();
    const queryKey = QueryString.messageId;
    const messageId = +getUrlQueryStrings()[queryKey];
    if (messageId) {
      const body = {
        token: this.authService.token,
        countryRegion,
        messageId,
      };

      this.api50xxService.fetchMessageContent(body).subscribe((res) => {
        if (!checkResponse(res)) {
          this.mailDetail = undefined;
        } else {
          const { message } = res;
          if (Object.keys(message).length === 0) {
            this.mailDetail = undefined;
          } else {
            this.mailDetail = message;
            this.mailDetail.unfold = false;
            this.checkSenderStatus();
            this.handleReadStatus();
          }
        }
      });
    }
  }

  /**
   * 取得國別
   */
  getCountryRegion() {
    return this.translateService.currentLang.split('-')[1].toUpperCase();
  }

  /**
   * 確認螢幕寬度
   */
  checkScreenWidth() {
    const { innerWidth } = window;
    this.uiFlag.isMobile = innerWidth <= 767;
  }

  /**
   * 訂閱 resize event
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeEventSubscription = resizeEvent
      .pipe(debounceTime(1000), takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.checkScreenWidth();
      });
  }

  /**
   * 訂閱收件匣刪除事件
   */
  subscribeDeleteInboxMailEvent() {
    this.stationMailService.rxDeleteList
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((deleteList) => {
        const { id } = this.mailDetail;
        if (deleteList.includes(id)) this.turnBack();
      });
  }

  /**
   * 回覆信件
   */
  replyMail() {
    const { senderId, id } = this.mailDetail;
    const hashId = this.hashIdService.handleUserIdEncode(senderId);
    const { messageReceiverId, messageId } = QueryString;
    this.router.navigateByUrl(
      `${this.getCreateMailUrl()}?${messageReceiverId}=${hashId}&${messageId}=${id}`
    );
  }

  /**
   * 刪除信件
   */
  deleteMail() {
    const {
      authService: { token },
      mailDetail: { id: messageId },
    } = this;
    const body = { token, messageId: [messageId] };
    this.api50xxService.fetchDeleteMessage(body).subscribe((res) => {
      if (checkResponse(res)) {
        this.stationMailService.refreshMailList().subscribe();
        this.turnBack();
      }
    });
  }

  /**
   * 取得建立站內信
   */
  getCreateMailUrl() {
    const {
      stationMail: { home, newMail },
    } = appPath;
    return `/dashboard/${home}/${newMail}`;
  }

  /**
   * 返回收件匣頁面
   */
  turnBack() {
    const {
      stationMail: { home, inbox },
    } = appPath;
    this.router.navigateByUrl(`/dashboard/${home}/${inbox}`);
  }

  /**
   * 顯示寄件人相關選單
   * @param e {MouseEvent}
   */
  showSenderMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showSenderMenu } = this.uiFlag;
    if (showSenderMenu) {
      this.uiFlag.showSenderMenu = false;
      this.unsubScribePluralEvent();
    } else {
      this.uiFlag.showSenderMenu = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 確認寄件者是否被納入常用名單或黑名單
   */
  checkSenderStatus() {
    if (this.senderListSubscription) this.senderListSubscription.unsubscribe();
    this.senderListSubscription = combineLatest([
      this.stationMailService.getFavoriteList(),
      this.stationMailService.getBlackList(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([favoriteList, blackList]) => {
        const { senderId } = this.mailDetail;
        this.favoriteList = favoriteList;
        this.blackList = blackList;
        this.uiFlag.senderIsFavorite =
          favoriteList.findIndex((_favoriteList) => _favoriteList.id == senderId) > -1;
        this.uiFlag.senderIsBlack =
          blackList.findIndex((_blackList) => _blackList.id == senderId) > -1;
      });
  }

  /**
   * 更新信件列表已讀狀態
   */
  handleReadStatus() {
    const { id } = this.mailDetail;
    this.stationMailService.editReadStatus(id);
  }

  /**
   * 轉導至寄件者頁面
   */
  navigateSenderPage() {
    const { senderId } = this.mailDetail;
    const hashId = this.hashIdService.handleUserIdEncode(senderId);
    window.open(`/user-profile/${hashId}/info`, '_blank');
  }

  /**
   * 取得寄件者概要資訊
   */
  getSenderSimpleInfo() {
    const { senderName, senderAvatarUrl, senderId } = this.mailDetail;
    return {
      id: senderId,
      name: senderName,
      avatarUrl: senderAvatarUrl,
    };
  }

  /**
   * 將寄件者加入黑名單
   */
  addBlackList() {
    if (this.uiFlag.senderIsFavorite) this.removeFavoriteList();
    const { senderId } = this.mailDetail;
    const body = {
      token: this.authService.token,
      type: 2,
      action: 1,
      contactList: [senderId],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        this.blackList?.push(this.getSenderSimpleInfo());
        this.stationMailService.saveBlackList(this.blackList as Array<any>);
        this.uiFlag.senderIsBlack = true;
      }
    });
  }

  /**
   * 將寄件者移出黑名單
   */
  removeBlackList() {
    const { senderId } = this.mailDetail;
    const body = {
      token: this.authService.token,
      type: 2,
      action: 2,
      contactList: [senderId],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        this.blackList = (this.blackList as Array<any>).filter((_list) => _list.id != senderId);
        this.stationMailService.saveBlackList(this.blackList as Array<any>);
        this.uiFlag.senderIsBlack = false;
      }
    });
  }

  /**
   * 將寄件者加入常用清單
   */
  addFavoriteList() {
    if (this.uiFlag.senderIsBlack) this.removeBlackList();
    const { senderId } = this.mailDetail;
    const body = {
      token: this.authService.token,
      type: 1,
      action: 1,
      contactList: [senderId],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        this.favoriteList?.push(this.getSenderSimpleInfo());
        this.stationMailService.saveFavoriteList(this.favoriteList as Array<any>);
        this.uiFlag.senderIsFavorite = true;
      }
    });
  }

  /**
   * 移除常用清單
   */
  removeFavoriteList() {
    const { senderId } = this.mailDetail;
    const body = {
      token: this.authService.token,
      type: 1,
      action: 2,
      contactList: [senderId],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        this.favoriteList = (this.favoriteList as Array<any>).filter(
          (_list) => _list.id != senderId
        );
        this.stationMailService.saveFavoriteList(this.favoriteList as Array<any>);
        this.uiFlag.senderIsFavorite = false;
      }
    });
  }

  /**
   * 訂閱點擊與滾動事件
   */
  subscribePluralEvent() {
    const targetElement = document.querySelector('.main__container') as Element;
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(targetElement, 'scroll');
    this.pluralEventSubscription = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => this.unsubScribePluralEvent());
  }

  /**
   * 取消訂閱與點擊事件，並關閉選單
   */
  unsubScribePluralEvent() {
    this.uiFlag.showSenderMenu = false;
    this.pluralEventSubscription.unsubscribe();
  }

  /**
   * 顯示所有回覆訊息
   */
  showAllReplyMail() {
    this.uiFlag.showReplyMail = true;
    const { replyMessageId } = this.mailDetail;
    const { token } = this.authService;
    const countryRegion = this.getCountryRegion();
    const requestList: Array<Observable<any>> = [];
    replyMessageId.forEach((_id) => {
      const body = { token, countryRegion, messageId: _id };
      requestList.push(this.api50xxService.fetchMessageContent(body));
    });

    combineLatest(requestList).subscribe((res) => {
      this.replyMailList = res
        .filter((_res) => checkResponse(_res, false))
        .map((_filterRes) => {
          _filterRes.message.unfold = false;
          return _filterRes.message;
        });
    });
  }

  /**
   * 展開或收合回覆信件
   * @param index {number}-回覆信件序列
   */
  unfoldReplyMail(index: number) {
    const { unfold } = this.replyMailList[index];
    this.replyMailList[index].unfold = !unfold;
  }

  ngOnDestroy(): void {
    if (this.pluralEventSubscription) this.pluralEventSubscription.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
