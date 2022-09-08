import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Api50xxService } from '../../../core/services/api-50xx.service';
import { AuthService } from '../../../core/services/auth.service';
import { StationMailService } from '../services/station-mail.service';
import { checkResponse } from '../../../shared/utils/index';
import { Subject, Subscription, combineLatest, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type ContactListType = 'favorite' | 'black' | null;

@Component({
  selector: 'app-receiver-list',
  templateUrl: './receiver-list.component.html',
  styleUrls: ['./receiver-list.component.scss'],
})
export class ReceiverListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() showBlackList = false;
  @Output() addReceiver = new EventEmitter();

  private ngUnsubscribe = new Subject();
  private senderListSubscription = new Subscription();
  private pluralEventSubscription = new Subscription();
  @ViewChild('searchContactInput') searchContactInput: ElementRef;

  /**
   * ui 用到之flag
   */
  uiFlag = {
    currentTag: <ContactListType>null,
  };

  /**
   * 常用名單
   */
  favoriteList: Array<any> = [];

  /**
   * 黑名單
   */
  blackList: Array<any> = [];

  /**
   * 搜尋結果清單
   */
  searchResultList: Array<any> | null = null;

  constructor(
    private api50xxService: Api50xxService,
    private authService: AuthService,
    private stationMailService: StationMailService
  ) {}

  ngOnInit(): void {
    this.getContactList();
  }

  ngOnChanges(): void {}

  /**
   * 取得常用清單與黑名單
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
   * 選擇為收件者
   * @param index {number}-常用清單列表序列
   */
  selectReceiver(index: number) {
    if (this.uiFlag.currentTag === 'favorite') {
      const receiver = this.favoriteList[index];
      this.addReceiver.emit(receiver);
    }
  }

  /**
   * 移出名單
   * @param e {MouseEvent}
   * @param id {number}-使用者編號
   */
  removeList(e: MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    const { currentTag } = this.uiFlag;
    currentTag === 'favorite' ? this.removeFavoriteList(e, id) : this.removeBlackList(e, id);
  }

  /**
   * 移出黑名單
   * @param e {MouseEvent}
   * @param id {number}-使用者編號
   */
  removeBlackList(e: MouseEvent, id: number) {
    const body = {
      token: this.authService.token,
      type: 2,
      action: 2,
      contactList: [id],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res)) {
        const newList = this.blackList?.filter((_list) => _list.id !== id);
        this.stationMailService.saveBlackList(newList as Array<any>);
      }
    });
  }

  /**
   * 移除常用清單
   * @param e {MouseEvent}
   * @param id {number}-使用者編號
   */
  removeFavoriteList(e: MouseEvent, id: number) {
    const body = {
      token: this.authService.token,
      type: 1,
      action: 2,
      contactList: [id],
    };

    this.api50xxService.fetchEditContactList(body).subscribe((res) => {
      if (checkResponse(res, false)) {
        const newList = this.favoriteList?.filter((_list) => _list.id !== id);
        this.stationMailService.saveFavoriteList(newList as Array<any>);
      }
    });
  }

  /**
   * 切換常用名單或黑名單
   * @param e {MouseEvent}
   * @param tab {ContactListType}-常用清單或黑名單
   */
  switchTag(e: MouseEvent, tab: ContactListType) {
    e.stopPropagation();
    const { currentTag } = this.uiFlag;
    if (tab === currentTag) {
      this.unSubScribePluralEvent();
    } else {
      this.uiFlag.currentTag = tab;
      this.subScribePluralEvent();
    }
  }

  /**
   * 訂閱點擊與滾動事件，以關閉選單
   */
  subScribePluralEvent() {
    const scrollTargetEvent = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(scrollTargetEvent, 'scroll');
    const clickEvent = fromEvent(window, 'click');
    this.pluralEventSubscription = merge(scrollEvent, clickEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.unSubScribePluralEvent();
      });
  }

  /**
   * 關閉選單並取消訂閱點擊與滾動事件
   */
  unSubScribePluralEvent() {
    this.uiFlag.currentTag = null;
    this.searchResultList = null;
    this.pluralEventSubscription.unsubscribe();
  }

  /**
   * 關鍵字搜尋常用名單
   * @param e {KeyboardEvent}
   */
  handleKeywordInput(e: KeyboardEvent) {
    const { currentTag } = this.uiFlag;
    const keyword = (e as any).target.value.toLowerCase();
    keyword.length > 0 ? this.searchList(keyword, currentTag) : this.clearSearchResult();
  }

  /**
   * 搜尋清單
   * @param keyword {string}-關鍵字
   * @param listType {ContactListType}-名單類別
   */
  searchList(keyword: string, listType: ContactListType) {
    const targetList = listType === 'favorite' ? this.favoriteList : this.blackList;
    this.searchResultList = targetList.filter((_list) => {
      const name = _list.name.toLowerCase();
      return name.includes(keyword);
    });
  }

  /**
   * 清除搜尋結果
   */
  clearSearchResult() {
    this.searchResultList = null;
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
