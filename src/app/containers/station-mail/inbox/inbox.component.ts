import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { StationMailService } from '../services/station-mail.service';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import dayjs from 'dayjs';
import { MessageType, ReadStatus } from '../enum/station-mail';
import { appPath } from '../../../app-path.const';
import { Router, NavigationEnd } from '@angular/router';
import { QueryString } from '../../../core/enums/common';
import { Api50xxService, AuthService } from '../../../core/services';
import { checkResponse, deepCopy } from '../../../core/utils/index';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss', '../station-mail-child.scss'],
})
export class InboxComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isBriefList = false;
  @ViewChild('keywordInput') keywordInput: ElementRef;

  private ngUnsubscribe = new Subject();
  private inputSubscription = new Subscription();
  private resizeEventSubscription = new Subscription();

  /**
   * ui 用到的flag
   */
  uiFlag = {
    isMobile: false,
    isLoading: false,
    currentFoucusId: null,
    openSelectMode: false,
    selectAll: false,
  };

  /**
   * 站內信清單
   */
  mailList: Array<any> = [];

  /**
   * 備份清單
   */
  backupList: Array<any> = [];

  todayDate = dayjs().format('YYYY-MM-DD');
  yesterdayDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  readonly MessageType = MessageType;
  readonly ReadStatus = ReadStatus;

  constructor(
    private stationMailService: StationMailService,
    private router: Router,
    private api50xxService: Api50xxService,
    private authService: AuthService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkScreenWidth();
    this.subscribeResizeEvent();
    this.refreshMailList(true);
    this.subscribeNewMailNotify();
    this.subscribeLanguageChange();
    this.subscribeRouteChange();
  }

  ngAfterViewInit(): void {
    if (!this.isBriefList) this.subscribeKeywordInput();
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
   * 訂閱語言改變事件
   */
  subscribeLanguageChange() {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.refreshMailList();
    });
  }

  /**
   * 更新信件列表
   * @param init {boolean}-是否正在初始化
   */
  refreshMailList(init = false) {
    if (!this.uiFlag.isLoading) {
      this.uiFlag.isLoading = true;
      this.stationMailService.refreshMailList().subscribe((res) => {
        this.handleMailList(res);
        this.uiFlag.isLoading = false;

        if (init) {
          this.subscribeMailList();
          this.checkPathName();
        }
      });
    }
  }

  /**
   * 訂閱新訊息狀態，以自動更新信件列表
   */
  subscribeNewMailNotify() {
    this.stationMailService.rxNewMailNotify
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((status) => {
        if (status) this.refreshMailList();
      });
  }

  /**
   * 訂閱網址變更事件
   */
  subscribeRouteChange() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      if (e instanceof NavigationEnd) this.checkPathName();
    });
  }

  /**
   * 訂閱信件列表更新，方便其他組件直接對收件匣更新信件列表
   */
  subscribeMailList() {
    this.stationMailService.rxMailList.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.handleMailList(res);
    });
  }

  /**
   *
   * @param list {Array<any>}-信件清單
   */
  handleMailList(list: Array<any>) {
    this.backupList = deepCopy(list);
    this.mailList = this.divideSendDate(this.isBriefList ? list.slice(0, 5) : list);
  }

  /**
   * 若為pc畫面，則確認url是否為收件匣。是則自動轉導至第一封信件詳細內容
   */
  checkPathName() {
    if (!this.uiFlag.isMobile) {
      const [empty, firstPath, secondPath, thirdPath, ...rest] = location.pathname.split('/');
      const isInboxPage = !thirdPath || thirdPath === appPath.stationMail.inbox;
      if (!this.isBriefList && isInboxPage && this.mailList.length > 0) {
        const [date, mailList] = this.mailList[0];
        const { id } = mailList[0];
        this.seeDetail(id);
      }
    }
  }

  /**
   * 前往信件詳細頁面
   */
  seeDetail(messageId: number) {
    const {
      stationMail: { home, mailDetail },
    } = appPath;
    this.router.navigateByUrl(
      `/dashboard/${home}/${mailDetail}?${QueryString.messageId}=${messageId}`
    );
  }

  /**
   * 開啟或關閉選擇刪除模式
   */
  handleDeleteMode() {
    this.uiFlag.openSelectMode = !this.uiFlag.openSelectMode;
  }

  /**
   * 選擇或取消選擇信件
   * @param index {number}-信件清單序列
   * @param subIndex {number}-信件清單次要序列
   */
  handleMailSelected(index: number, subIndex: number) {
    const { selected } = this.mailList[index][1][subIndex];
    this.mailList[index][1][subIndex].selected = !selected;
    if (selected) this.uiFlag.selectAll = false;
  }

  /**
   * 選擇或取消選擇全部信件
   */
  handleMailAllSelected() {
    this.uiFlag.selectAll = !this.uiFlag.selectAll;
    this.backupList = this.backupList.map((_list) => {
      _list.selected = this.uiFlag.selectAll;
      return _list;
    });

    this.mailList = this.divideSendDate(this.backupList);
  }

  /**
   * 刪除信件
   */
  deleteMail() {
    const deleteList = this.mailList
      .map((_list) => _list[1])
      .reduce((prev, current) => prev.concat(current))
      .filter((_list) => _list.selected)
      .map((_list) => _list.id);

    if (deleteList.length > 0) {
      const body = {
        token: this.authService.token,
        messageId: deleteList,
      };

      this.api50xxService.fetchDeleteMessage(body).subscribe((res) => {
        if (checkResponse(res)) {
          this.refreshMailList();
          this.stationMailService.saveDeleteList(deleteList);
        }
      });
    }
  }

  /**
   * 將信件清單依寄件時間切分
   * @param lists {Array<any>}-信件清單
   */
  divideSendDate(lists: Array<any>) {
    const result: any = {};
    lists.forEach((_list) => {
      const sendDate = dayjs(_list.sendTimestamp * 1000).format('YYYY-MM-DD');
      if (!result[sendDate]) result[sendDate] = [];
      result[sendDate].push(_list);
    });

    return Object.entries(result);
  }

  /**
   * 訂閱關鍵字輸入欄位之事件，以搜尋關鍵字
   */
  subscribeKeywordInput() {
    const element = this.keywordInput.nativeElement;
    const keyupEvent = fromEvent(element, 'keyup');
    this.inputSubscription = keyupEvent
      .pipe(debounceTime(300), takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.searchMail(e as KeyboardEvent);
      });
  }

  /**
   * 關鍵字搜尋標題或寄件者
   * @param e {KeyboardEvent}
   */
  searchMail(e: KeyboardEvent) {
    const keyword = (e as any).target.value.trim();
    if (keyword.length > 0) {
      const filterList = this.backupList.filter((_list) => {
        const { title, senderName } = _list;
        return title.includes(keyword) || senderName?.includes(keyword);
      });

      this.mailList = this.divideSendDate(filterList);
    } else {
      this.mailList = this.divideSendDate(this.backupList);
    }
  }

  /**
   * 取消訂閱
   */
  ngOnDestroy(): void {
    if (this.inputSubscription) this.inputSubscription.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
