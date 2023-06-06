import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {
  getUrlQueryStrings,
  checkResponse,
  setLocalStorageObject,
  getLocalStorageObject,
  removeLocalStorageObject,
} from '../../../core/utils';
import { StationMailService } from '../services/station-mail.service';
import {
  AuthService,
  HashIdService,
  Api10xxService,
  Api11xxService,
  Api50xxService,
  NodejsApiService,
  UserService,
  HintDialogService,
} from '../../../core/services';
import { ReceiverType, MessageType } from '../enum/station-mail';
import { Receiver } from '../models/station-mail';
import { Subject, Subscription, fromEvent, of, merge, combineLatest, Observable } from 'rxjs';
import { takeUntil, debounceTime, switchMap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { appPath } from '../../../app-path.const';
import { QueryString } from '../../../core/enums/common';
import { KeyCode } from '../../../core/enums/common/key-code.enum';
import { AccessRight } from '../../../core/enums/common';
import { groupIdReg } from '../../../core/models/regex';
import { LocalStorageKey } from '../../../core/enums/common/local-storage-key.enum';
import { MessageBoxComponent } from '../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-create-mail',
  templateUrl: './create-mail.component.html',
  styleUrls: ['./create-mail.component.scss', '../station-mail-child.scss'],
})
export class CreateMailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('receiverInput') receiverInput: ElementRef;
  @ViewChild('mainContentInput') mainContentInput: ElementRef;

  private ngUnsubscribe = new Subject();
  private inputEventSubscription = new Subscription();
  private pluralSubscription = new Subscription();
  private senderListSubscription = new Subscription();
  private resizeEventSubscription = new Subscription();

  /**
   * ui 用到的flag
   */
  uiFlag = {
    progress: 100,
    isReplyMode: false,
    isMobile: false,
    showReceiverMenu: <Receiver | null>null,
    isFavorite: false,
    needSaveDraft: false,
  };

  /**
   * 新信件之內容
   */
  sendMail = {
    token: this.authService.token,
    title: '',
    content: '',
    receiverType: ReceiverType.assign,
    replyMessageId: <Array<number>>[],
    receiver: <Array<number | string>>[],
    messageType: MessageType.normal,
  };

  /**
   * 信件正文
   */
  textAreaContent = '';

  /**
   * 信件內文總字數
   */
  contentLength = 0;

  /**
   * 接收者概要資訊
   */
  receiverList: Array<Receiver> = [];

  /**
   * 暱稱搜尋結果清單
   */
  searchList: Array<any> = [];

  /**
   * 常用清單
   */
  favoriteList: Array<any> = [];

  /**
   * 黑名單
   */
  blackList: Array<any> = [];

  /**
   * 回覆信件清單(由新到舊排序)
   */
  replyMailList: Array<any> = [];

  /**
   * 草稿內容
   */
  draft: any = this.getDraft();

  readonly contentLimit = 400; // 字數限制
  readonly newlineLimit = 50; // 換行限制
  readonly AccessRight = AccessRight;
  readonly ReceiverType = ReceiverType;
  readonly MessageType = MessageType;

  constructor(
    private stationMailService: StationMailService,
    private authService: AuthService,
    private api10xxService: Api10xxService,
    private api11xxService: Api11xxService,
    private api50xxService: Api50xxService,
    private hashIdService: HashIdService,
    private nodejsApiService: NodejsApiService,
    private hintDialogService: HintDialogService,
    private translateService: TranslateService,
    private router: Router,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkScreenWidth();
    this.subscribeResizeEvent();
    this.checkQueryString();
    this.getContactList();
  }

  ngAfterViewInit(): void {
    if (!this.uiFlag.isReplyMode) this.subScribeReceiverInput();
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
   * 確認url query string，並判斷是否提示引入草稿
   */
  checkQueryString() {
    const { receiver, replyMessageId } = this.draft ?? { receiver: [], replyMessageId: [] };
    const { messageReceiverId, messageId } = QueryString;
    const queryObj = getUrlQueryStrings();
    const receiverId = queryObj[messageReceiverId];
    if (receiverId) {
      const replyMsgId = queryObj[messageId];
      const isSameReceiver = receiverId == receiver[0]?.id;
      const isSameReplyMail = replyMsgId ? replyMsgId == replyMessageId[0] : true;
      if (isSameReceiver && isSameReplyMail) {
        this.askImportDraft(this.handleQueryString.bind(this));
      } else {
        this.handleQueryString();
      }
    } else {
      if (this.draft) this.askImportDraft();
    }
  }

  /**
   * 根據url query string取得收件者與回覆信件資訊
   */
  handleQueryString() {
    const { messageReceiverId, messageReceiverType, messageId } = QueryString;
    const queryObj = getUrlQueryStrings();
    const receiverId = queryObj[messageReceiverId];
    const receiverType = queryObj[messageReceiverType];
    const isGroupMail = receiverType && receiverType === 'g';
    this.handleReplyReceiver(isGroupMail, receiverId as string);
    const msgId = queryObj[messageId] ? +queryObj[messageId] : null;
    this.getReplyContent(msgId);
  }

  /**
   * 取得常用名單與黑名單
   */
  getContactList() {
    this.senderListSubscription = combineLatest([
      this.stationMailService.getFavoriteList(),
      this.stationMailService.getBlackList(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([favoriteList, blackList]) => {
        this.favoriteList = favoriteList;
        this.blackList = blackList;
      });
  }

  /**
   * 儲存標題
   * @param e {FocusEvent}
   */
  saveTitle(e: FocusEvent) {
    this.sendMail.title = (e as any).target.value.trim();
    this.uiFlag.needSaveDraft = true;
  }

  /**
   * 即時計算目前總字數，以及將tag轉為換行符
   * @param e {KeyboardEvent}
   */
  handleMainContentKeyUp(e: KeyboardEvent) {
    const { value } = (e as any).target;
    const mainContent = this.getOnlyTextLength(value);
    this.contentLength = mainContent;
  }

  /**
   * 取得換行符以外的文字長度
   * @param str {string}-字串
   */
  getOnlyTextLength(str: string) {
    return str.trim().split('\n').join('').length;
  }

  /**
   * 儲存正文
   * @param e {FocusEvent}
   */
  saveMainContent(e: FocusEvent) {
    const content = (e as any).target.value.trim();
    this.sendMail.content = content;
    this.uiFlag.needSaveDraft = true;
  }

  /**
   * 確認如果貼上複製內容，則是否超過字數限制
   * @param e {ClipboardEvent}
   */
  checkPaste(e: ClipboardEvent) {
    const contentLength = this.getOnlyTextLength(this.mainContentInput.nativeElement.value);
    const { clipboardData } = (e as any) ?? window;
    const pasteValueLength = clipboardData.getData('text').length;
    const totalLength = pasteValueLength + contentLength;
    if (totalLength > this.contentLimit) e.preventDefault();
  }

  /**
   * 確認是否超過總字數或換行限制
   * @param e {KeyboardEvent}
   */
  checkTextLimit(e: KeyboardEvent) {
    const {
      keyCode,
      target: { value },
    } = e as any;
    const textLength = this.getOnlyTextLength(value);
    const newlineLength = value.split('\n').length;

    const textIsOverLimit = textLength >= this.contentLimit;
    const newlineIsOverLimit = newlineLength >= this.newlineLimit;
    const notBackspace = keyCode !== KeyCode.backspace;
    const isEnter = keyCode === KeyCode.enter;
    if ((textIsOverLimit || (newlineIsOverLimit && isEnter)) && notBackspace) e.preventDefault();
  }

  /**
   * 取得接收者概要資訊
   * @param isGroupMail {boolean}-是否為群組信件
   * @param hashId {string}-經hash過後的使用者編號
   */
  handleReplyReceiver(isGroupMail: boolean, hashId: string) {
    if (isGroupMail) {
      const groupId = this.hashIdService.handleGroupIdDecode(hashId);
      this.handleAddGroup(groupId);
    } else {
      const userId = +this.hashIdService.handleUserIdDecode(hashId);
      this.addReceiver(userId);
    }
  }

  /**
   * 取得回覆信件相關內容
   * @param messageId {number | null}-訊息編號
   */
  getReplyContent(messageId: number | null) {
    this.uiFlag.isReplyMode = false;
    if (messageId) {
      const { token } = this.authService;
      const countryRegion = this.getCountryRegion();

      const body = {
        token: this.authService.token,
        countryRegion,
        messageId,
      };

      this.api50xxService.fetchMessageContent(body).subscribe((res) => {
        if (checkResponse(res)) {
          const { message } = res;
          if (Object.keys(message).length === 0) return false;
          const { replyMessageId } = message;
          message.unfold = false;
          this.replyMailList.push(message);
          const { title } = this.replyMailList[0];
          this.sendMail.title = this.handleReplyTitle(title);
          this.sendMail.replyMessageId = this.replyMailList.map((_list) => _list.id);

          const requestList: Array<Observable<any>> = [];
          replyMessageId.forEach((_id) => {
            const body = { token, countryRegion, messageId: _id };
            requestList.push(this.api50xxService.fetchMessageContent(body));
          });

          combineLatest(requestList).subscribe((res) => {
            const replyMailList = res
              .filter((_res) => checkResponse(_res, false))
              .map((_filterRes) => {
                _filterRes.message.unfold = false;
                return _filterRes.message;
              });

            this.replyMailList = this.replyMailList.concat(replyMailList);
            this.sendMail.replyMessageId = this.replyMailList.map((_list) => _list.id);
          });

          this.uiFlag.isReplyMode = true;
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
   * 處理回覆信件之標題
   * @param title {string}-被回覆之信件標題
   */
  handleReplyTitle(title: string | null) {
    if (!title) return '';
    const prefix = title.slice(0, 3).toLowerCase();
    if (['re:', 're：'].includes(prefix)) return title;
    return `Re: ${title}`;
  }

  /**
   * 訂閱接收者輸入欄位
   */
  subScribeReceiverInput() {
    const targetElement = this.receiverInput.nativeElement;
    const keyUpEvent = fromEvent(targetElement, 'keyup');
    const pasteEvent = fromEvent(targetElement, 'paste');
    this.inputEventSubscription = merge(keyUpEvent, pasteEvent)
      .pipe(
        debounceTime(300),
        switchMap((e: any) => {
          const keyword = e.target.value.trim();
          if (!keyword) return of([]);
          const body = { token: this.authService.token, keyword };
          return this.nodejsApiService.searchNickname(body).pipe(map((res) => res.list));
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((result: Array<any>) => {
        this.searchList = result;
      });
  }

  /**
   * 清除使用者搜尋列表
   */
  clearSearchList() {
    const targetElement = this.receiverInput.nativeElement;
    targetElement.value = '';
    this.searchList = [];
  }

  /**
   * 增加收件者
   * @param index {number}-搜尋清單索引
   */
  checkReceiverRepeat(index: number) {
    const { userId } = this.searchList[index];
    const receiver = { id: userId };
    const notRepeat =
      this.receiverList.findIndex((_receiver) => _receiver.id == receiver.id) === -1;
    if (notRepeat) this.addReceiver(userId);
    this.clearSearchList();
  }

  /**
   * 增加收件者
   * @param id {number}-使用者id
   */
  addReceiver(id: number) {
    const body = {
      token: this.authService.token,
      targetUserId: id,
    };

    this.api10xxService.fetchGetUserProfile(body).subscribe((res) => {
      if (checkResponse(res)) {
        const { nickname, avatarUrl } = res.userProfile;
        this.receiverList.push({ id, name: nickname, avatarUrl });
      }
    });
  }

  /**
   * 取得個人系統權限
   */
  getSystemAccessRight() {
    return this.userService.getUser().systemAccessright;
  }

  /**
   * 先檢查權限再增加群組為收件者
   * @param id {string}-群組 id
   */
  handleAddGroup(id: string) {
    if (this.getSystemAccessRight() <= AccessRight.marketing) {
      this.addGroup(id);
    } else {
      const body = { token: this.authService.token };
      this.api11xxService.fetchMemberAccessRight(body).subscribe((res) => {
        if (checkResponse(res, false)) {
          const { groupAccessRight } = res.info;
          const {
            groups: { brandId, branchId, classId, subClassId },
          } = groupIdReg.exec(id) as any;
          const isAdmin =
            groupAccessRight.findIndex((_group) => {
              const { groupId: _groupId, accessRight: _accessright } = _group;
              if (+_accessright > AccessRight.teacher) return false;

              const {
                groups: {
                  brandId: _brandId,
                  branchId: _branchId,
                  classId: _classId,
                  subClassId: _subClassId,
                },
              } = groupIdReg.exec(_groupId) as any;
              const sameBrand = brandId === _brandId;
              const sameBranch = sameBrand && branchId === _branchId;
              const sameClass = sameBranch && classId === _classId;
              if (sameBrand && +_accessright === AccessRight.brandAdmin) return true;
              if (sameBranch && +_accessright === AccessRight.branchAdmin) return true;
              if (sameClass && +_accessright === AccessRight.coachAdmin) return true;
              return false;
            }) > -1;

          if (isAdmin) this.addGroup(id);
        }
      });
    }
  }

  /**
   * 增加群組為收件者
   * @param id {string}-群組 id
   */
  addGroup(id: string) {
    const body = {
      token: this.authService.token,
      groupId: id,
      avatarType: 3,
    };

    this.api11xxService.fetchGroupListDetail(body).subscribe((res) => {
      if (checkResponse(res)) {
        const { groupName, groupIcon } = res.info;
        this.receiverList.push({ id, name: groupName, avatarUrl: groupIcon, isGroup: true });
      }
    });
  }

  /**
   * 移除收件者
   * @param receiverId {string | number}-收件者編號
   */
  delReceiver(receiverId: string | number) {
    this.receiverList = this.receiverList.filter((_list) => _list.id !== receiverId);
  }

  /**
   * 送出信件
   */
  mailSubmit() {
    if (this.uiFlag.progress === 100) {
      if (this.checkMail()) {
        this.uiFlag.progress = 30;
        const { receiverType } = this.sendMail;
        if (receiverType !== ReceiverType.all) {
          this.sendMail.receiver = this.receiverList.map((_list) =>
            +_list.id ? +_list.id : _list.id
          );
        }

        this.api50xxService.fetchSendMessage(this.sendMail).subscribe((res) => {
          this.uiFlag.progress = 100;
          if (checkResponse(res)) {
            this.uiFlag.needSaveDraft = false;
            this.showResultMessage('universal_message_sentComplete');
            this.returnInbox();
          } else {
            this.showResultMessage('universal_message_sentFail');
          }
        });
      }
    }
  }

  /**
   * 檢查信件各欄位是否皆有值
   */
  checkMail() {
    const {
      sendMail: { title, content, receiverType },
      receiverList,
    } = this;
    const receiverNotEmpty = receiverList.length > 0 || receiverType === ReceiverType.all;
    if (title && content && receiverNotEmpty) {
      return true;
    } else {
      this.showResultMessage('universal_userAccount_fullField');
      return false;
    }
  }

  /**
   * 顯示寄件結果訊息
   * @param msgKey {string}-結果訊息多國語系鍵名
   */
  showResultMessage(msgKey: string) {
    this.translateService
      .get('hello world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const message = this.translateService.instant(msgKey);
        this.hintDialogService.showSnackBar(message);
      });
  }

  /**
   * 放棄訊息編輯
   */
  discardMail() {
    this.uiFlag.needSaveDraft = false;
    this.returnInbox();
  }

  /**
   * 返回收件匣
   */
  returnInbox() {
    const {
      dashboard: { home: dashboardHome },
      stationMail: { home: stationMailHome, inbox },
    } = appPath;
    this.router.navigateByUrl(`/${dashboardHome}/${stationMailHome}/${inbox}`);
  }

  /**
   * 轉導至收件者頁面
   * @param id {number}-收件者編號
   * @param isGroup {boolean}-是否為群組
   */
  navigateSenderPage(id: number, isGroup = false) {
    const { personal, professional } = appPath;
    if (!isGroup) {
      const hashId = this.hashIdService.handleUserIdEncode(`${id}`);
      window.open(`/${personal.home}/${hashId}/${personal.info}`, '_blank');
    } else {
      const hashId = this.hashIdService.handleGroupIdEncode(`${id}`);
      window.open(`/${professional.groupDetail.home}/${hashId}`, '_blank');
    }
  }

  /**
   * 將收件者移出黑名單
   * @param id {number}-收件者編號
   */
  removeBlackList(id: number) {
    const body = {
      token: this.authService.token,
      type: 2,
      action: 2,
      contactList: [id],
    };

    combineLatest([
      this.api50xxService.fetchEditContactList(body),
      this.stationMailService.getBlackList(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([editResult, blackList]) => {
        if (checkResponse(editResult)) {
          const newList = blackList.filter((_list) => _list.id !== id);
          this.stationMailService.saveBlackList(newList as Array<any>);
        }
      });
  }

  /**
   * 確認該聯絡人是否為常用名單
   * @param id {number | string}-使用者編號
   */
  isFavoriteContact(id: number | string) {
    return this.favoriteList.findIndex((_list) => _list.id == id) > -1;
  }

  /**
   * 確認該聯絡人是否為黑名單
   * @param id {number}-使用者編號
   */
  isBlackContact(id: number) {
    return this.blackList.findIndex((_list) => _list.id == id) > -1;
  }

  /**
   * 將收件者加入常用清單
   * @param receiver {Receiver}-收件者編號
   */
  addFavoriteList(receiver: Receiver) {
    const id = receiver.id as number;
    if (this.isBlackContact(id)) this.removeBlackList(id);
    const body = {
      token: this.authService.token,
      type: 1,
      action: 1,
      contactList: [id],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        this.favoriteList?.push(receiver);
        this.stationMailService.saveFavoriteList(this.favoriteList as Array<any>);
      }

      this.unsubscribePluralEvent();
    });
  }

  /**
   * 移除常用清單
   * @param receiver {Receiver}-收件者編號
   */
  removeFavoriteList(receiver: Receiver) {
    const { id } = receiver;
    const body = {
      token: this.authService.token,
      type: 1,
      action: 2,
      contactList: [id],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        const newList = this.favoriteList?.filter((_list) => _list.id != id);
        this.stationMailService.saveFavoriteList(newList as Array<any>);
      }

      this.unsubscribePluralEvent();
    });
  }

  /**
   * 使用者從常用名單加入收件者
   * @param receiver {Receiver}-收件者
   */
  addFavoriteReceiver(receiver: Receiver) {
    const { receiverList } = this;
    // 避免收件者重複
    if (receiverList.findIndex((_receiver) => _receiver.id == receiver.id) === -1) {
      receiverList.push(receiver);
    }
  }

  /**
   * 顯示該收件人菜單與否
   * @param e {MouseEvent}
   * @param receiver {Receiver}-收件者簡易資訊
   */
  showReceiverMenu(e: MouseEvent, receiver: Receiver) {
    e.stopPropagation();
    const { showReceiverMenu } = this.uiFlag;
    if (showReceiverMenu) {
      if (showReceiverMenu.id === receiver.id) {
        return this.unsubscribePluralEvent();
      }
    }

    this.uiFlag.showReceiverMenu = receiver;
    this.uiFlag.isFavorite = this.isFavoriteContact(receiver.id);
    return this.subscribePluralEvent();
  }

  /**
   * 訂閱點擊與滾動事件
   */
  subscribePluralEvent() {
    const scrollElement = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(window, 'click');
    this.pluralSubscription = merge(scrollEvent, clickEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.unsubscribePluralEvent();
      });
  }

  /**
   * 取消訂閱點擊與滾動事件，並關閉選單
   */
  unsubscribePluralEvent() {
    this.uiFlag.showReceiverMenu = null;
    this.pluralSubscription.unsubscribe();
  }

  /**
   * 展開或收合回覆信件
   * @param e {MouseEvent}
   * @param index {number}-回覆信件索引
   */
  unfoldReplyMail(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    const { unfold } = this.replyMailList[index];
    this.replyMailList[index].unfold = !unfold;
  }

  /**
   * 返回原訊息或訊息列表
   */
  turnBack() {
    if (history.length > 0) return history.back();
    const {
      dashboard: { home: dashboardHome },
      stationMail: { home: StationMailHome, inbox },
    } = appPath;
    this.router.navigateByUrl(`/${dashboardHome}/${StationMailHome}/${inbox}`);
  }

  /**
   * 變更信件類別
   * @param e {Event}
   */
  changeMailType(e: any) {
    const type = +e.target.value;
    this.sendMail.messageType = type;
  }

  /**
   * 變更收件者範圍
   * @param e {Event}
   */
  changeReceiverRange(e: any) {
    const range = +e.target.value;
    this.sendMail.receiverType = range;
    if (range === ReceiverType.all) this.sendMail.receiver = [];
  }

  /**
   * 儲存草稿
   */
  saveDraft() {
    const {
      sendMail: { title, content, replyMessageId },
    } = this;
    const hashReceiverList = this.hashReceiverId(this.receiverList);
    const draftObj = {
      title,
      receiver: hashReceiverList,
      content,
      replyMessageId,
    };

    const draftString = JSON.stringify(draftObj);
    setLocalStorageObject(LocalStorageKey.stationMailDraft, draftString);
  }

  /**
   * 取得草稿
   */
  getDraft() {
    const draftString = getLocalStorageObject(LocalStorageKey.stationMailDraft);
    return draftString ? JSON.parse(draftString) : null;
  }

  /**
   * 移除草稿
   */
  removeDraft() {
    removeLocalStorageObject(LocalStorageKey.stationMailDraft);
  }

  /**
   * 詢問是否引入草稿
   * @param callBack {Function}-取消引入草稿後之動作
   */
  askImportDraft(callBack: CallableFunction | null = null) {
    this.translateService
      .get('hello world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const askContent = this.translateService.instant('universal_message_draftDiag');
        const confirmText = this.translateService.instant('universal_operating_confirm');
        const cancelText = this.translateService.instant('universal_operating_cancel');
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: askContent,
            confirmText: confirmText,
            onConfirm: () => this.importDraft(),
            cancelText: cancelText,
            onCancel: () => this.cancelImportDraft(callBack),
          },
        });
      });
  }

  /**
   * 引入草稿
   */
  importDraft() {
    const { title, receiver, content, replyMessageId } = this.draft;
    this.sendMail.title = title;
    this.receiverList = this.decodeReceiverId(receiver);
    this.sendMail.content = content;
    this.textAreaContent = content;
    this.sendMail.replyMessageId = replyMessageId;
    this.getReplyContent(replyMessageId[0]);
    this.uiFlag.needSaveDraft = true;
  }

  /**
   * 取消引入草稿
   */
  cancelImportDraft(callBack: CallableFunction | null = null) {
    this.removeDraft();
    if (callBack) callBack();
  }

  /**
   * 將收件者id進行hash
   * @param receiverList {Array<any>}-收件人清單
   */
  hashReceiverId(receiverList: Array<any>) {
    return receiverList.map((_list) => {
      const { id } = _list;
      const isGroupId = `${id}`.includes('-');
      _list.id = isGroupId
        ? this.hashIdService.handleGroupIdEncode(id)
        : this.hashIdService.handleUserIdEncode(id);
      return _list;
    });
  }

  /**
   * 將收件人id 解 hash
   * @param receiverList {Array<any>}-收件人清單
   */
  decodeReceiverId(receiverList: Array<any>) {
    return receiverList.map((_list) => {
      const { id, isGroup } = _list;
      _list.id = isGroup
        ? this.hashIdService.handleGroupIdDecode(id)
        : this.hashIdService.handleUserIdDecode(id);
      return _list;
    });
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    if (this.uiFlag.needSaveDraft) this.saveDraft();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
