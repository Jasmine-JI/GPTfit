import { Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../../../../shared/services/official-activity.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import mapList from '../../../../../../assets/cloud_run/mapList.json';
import { fromEvent, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';


interface Activity {
  fileName: string;
  name: string;
  mapId: number;
  mapDistance: number;
  eventStatus: string;
  startTimeStamp: number;
  endTimeStamp: number;
  eventImage: string;
  mainColor: string;
  backgroundColor: string;
  card: Array<any>;
  group: Array<any>;
  product: Array<any>;
  discount: Array<any>;
  createTimeStamp: number;
  createUserId: number;
  editTimeStamp: number;
  editUserId: number;
}

@Component({
  selector: 'app-edit-official-activity',
  templateUrl: './edit-official-activity.component.html',
  styleUrls: ['./edit-official-activity.component.scss']
})
export class EditOfficialActivityComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  pageClickEvent = new Subscription();

  @ViewChild('eventTitle') eventTitle: ElementRef;
  @ViewChild('eventImg') eventImg: ElementRef;
  @ViewChild('mainColor') mainColor: ElementRef;
  @ViewChild('bgColor') bgColor: ElementRef;
  @ViewChild('title') title: ElementRef;
  @ViewChild('groupName') groupName: ElementRef;
  @ViewChild('name') name: ElementRef;
  @ViewChild('link') link: ElementRef;
  @ViewChild('price') price: ElementRef;
  @ViewChild('cardImg') cardImg: ElementRef;

  uiFlag = {
    isSaved: true,
    isSaving: false,
    editTitle: false,
    showMapSelector: false,
    showEventTitleInput: false,
    showEditCardContent: false,
    isClickCardImg: false,
    editItem: {
      card: {
        title: null,
        color: null,
        content: null
      },
      group: {
        groupName: null
      },
      product: {
        img: null,
        name: null,
        link: null
      },
      discount: {
        name: null,
        img: null,
        price: null,
        link: null
      }
    }
  };

  pageSetting: Activity;
  cardContent = '';
  mapList: Array<any> = [];
  editor: number;
  formData = new FormData();

  constructor (
    private router: Router,
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.getFile(location.search);
    this.listenClickEvent();
    this.getMapList();
    this.getEditor();
  }

  /**
   * 從query string取得file name，並取得file內容
   * @param search {string}
   * @author kidin-1090903
   */
  getFile(search: string) {
    const fileName = search.split('=')[1];

    if (fileName) {
      const body = {
        token: this.utils.getToken() || '',
        fileName
      };

      this.officialActivityService.getOfficialActivity(body).subscribe(res => {
        if (res.resultCode !== 200) {
          console.log(`Error: ${res.resultMessage}`);
        } else {
          this.pageSetting = res.activity;
        }

      });

    } else {
      this.router.navigateByUrl('/404');
    }

  }

  /**
   * 監聽整個頁面的點擊事件
   * @author kidin-1090907
   */
  listenClickEvent() {
    const page = fromEvent(window, 'click');
    this.pageClickEvent = page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      if (!this.uiFlag.isClickCardImg) {
        this.initUiFlag();
      } else {
        this.uiFlag.isClickCardImg = false;
      }

    });

  }


  /**
   * 取得所有maplist
   * @author kidin-1090907
   */
  getMapList() {
    this.mapList = mapList.mapList.raceMapInfo.slice(0, 48);
  }

  /**
   * 取得當前編輯人員userId
   * @author kidin-1090907
   */
  getEditor() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.editor = res.userId;
    });

  }

  /**
   * 將所有uiFlag（isSaved除外）進行初始化
   * @author kidin-1090907
   */
  initUiFlag() {
    this.uiFlag = {
      isSaved: this.uiFlag.isSaved,
      isSaving: false,
      editTitle: false,
      showMapSelector: false,
      showEventTitleInput: false,
      showEditCardContent: false,
      isClickCardImg: false,
      editItem: {
        card: {
          title: null,
          color: null,
          content: null
        },
        group: {
          groupName: null
        },
        product: {
          img: null,
          name: null,
          link: null
        },
        discount: {
          name: null,
          img: null,
          price: null,
          link: null
        }
      }
    };

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
   * 顯示編輯活動標題輸入框
   * @event click
   * @param e {KeyboardEvent | MouseEvent}
   * @param action {boolean}
   * @author kidin-1090827
   */
  showEventTitleIntput(e: KeyboardEvent | MouseEvent, action: boolean): void {
    e.stopPropagation();
    this.uiFlag.showEventTitleInput = action;

    if (action) {
      setTimeout(() => {
        this.eventTitle.nativeElement.focus();
      });

    }

  }

  /**
   * 儲存活動標題
   * @param e {MouseEvent | KeyboardEvent}
   * @author kidin-1090827
   */
  saveEventTitle(e: MouseEvent | KeyboardEvent): void {
    if ((e as KeyboardEvent).key === 'Enter' || (e as MouseEvent).type === 'focusout') {
      this.pageSetting.name = this.eventTitle.nativeElement.value;
      this.showEventTitleIntput(e, false);
    }

    this.uiFlag.isSaved = false;
  }

  /**
   * 點擊開關後開放或隱藏活動
   * @event click
   * @author kidin-1090826
   */
  handlePublicEvent(): void {
    this.uiFlag.isSaved = false;
    if (this.pageSetting.eventStatus === 'public') {
      this.pageSetting.eventStatus = 'private';
    } else {
      this.pageSetting.eventStatus = 'public';
    }

    this.savePageSetting();
  }

  /**
   * 顯示地圖選擇器
   * @event click
   * @param e {MouseEvent}
   * @author kidin-1090907
   */
  showMapSelector(e: MouseEvent) {
    e.stopPropagation();
    if (this.uiFlag.showMapSelector) {
      this.uiFlag.showMapSelector = false;
    } else {
      this.uiFlag.showMapSelector = true;
    }

  }

  /**
   * 取得使用者所選地圖
   * @param index {number}
   * @author kidin-1090907
   */
  chooseMap(index: number): void {
    this.pageSetting.mapId = index;
    this.pageSetting.mapDistance = (+mapList.mapList.raceMapInfo[index - 1].distance) * 1000;
    this.uiFlag.showMapSelector = false;
    this.uiFlag.isSaved = false;
  }

  /**
   * 取得使用者所選日期
   * @param e {}
   * @author kidin-1090904
   */
  getSelectDate(e: any): void {

    if (
      this.pageSetting.startTimeStamp !== moment(e.startDate).valueOf()
      || this.pageSetting.endTimeStamp !== moment(e.endDate).valueOf()
    ) {
      this.pageSetting.startTimeStamp = moment(e.startDate).valueOf();
      this.pageSetting.endTimeStamp = moment(e.endDate).valueOf();
      this.uiFlag.isSaved = false;
    }

  }

  /**
   * 開啟各種選擇器
   * @event click
   * @param e {MouseEvent}
   * @param el {string}
   * @author kidin-1090827
   */
  handleShowSelector(e: MouseEvent, el: string): void {
    e.stopPropagation();
    setTimeout(() => {
      const element = this[el].nativeElement;
      element.click();
    });

  }

  /**
   * 開啟產品或組合圖片選擇器
   * @param e {MouseEvent}
   * @param type {string}
   * @param id {number}
   * @param el {string}
   * @author kidin-1090914
   */
  openImgSelector(e: MouseEvent, type: string, id: number, el: string) {
    e.stopPropagation();
    this.uiFlag.editItem[type][el] = id;

    setTimeout(() => {
      const element = document.querySelectorAll(`.${type}__img__input`)[id];
      (element as any).click();
    });

  }

  /**
   * 儲存使用者選擇的照片並裝進formdata
   * @param e {Event}
   * @author kidin-1090827
   */
  handleUploadEventImg(e: Event): void {
    const img = (e.target as any).files[0];
    this.formData.set('eventImage', img, img.name);
    this.pageSetting.eventImage = img.name;
    this.uiFlag.isSaved = false;
  }

  /**
   * 儲存活動主色
   * @author kidin-1090827
   */
  saveMainColor(e: Event): void {
    this.pageSetting.mainColor = (e.currentTarget as any).value;
    this.uiFlag.isSaved = false;
  }

  /**
   * 儲存活動背景顏色
   * @author kidin-1090827
   */
  saveBgColor(e: Event): void {
    this.pageSetting.backgroundColor = (e.currentTarget as any).value;
    this.uiFlag.isSaved = false;
  }

  /**
   * 刪除項目
   * @param item {string}-card/group/product
   * @param idx {number}
   * @author kidin-1090827
   */
  deleteRow(item: string, idx: number): void {
    this.pageSetting[item] = this.pageSetting[item].filter((_item: any, index: number) => index !== idx);
    this.uiFlag.isSaved = false;
  }

  /**
   * 增加項目
   * @param item {string}
   * @author kidin-1090827
   */
  addItem(item: string) {
    switch (item) {
      case 'card':
        this.pageSetting.card.push({
          cardId: this.pageSetting.card.length,
          title: '標題',
          content: '內容',
          bgColor: '#ffffff',
          textAlign: 'start',
          fontSize: '24px',
          color: '#000000',
          img: ''
        });

        break;
      case 'group':
        this.pageSetting.group.push({
          groupName: '組別',
          member: [],
          rank: []
        });
        break;
      case 'product':
        this.pageSetting.product.push({
          img: '',
          name: '產品名稱',
          link: '產品連結'
        });
        break;
      case 'discount':
        this.pageSetting.discount.push({
          name: '組合名稱',
          img: '',
          price: '組合價格',
          link: '組合連結'
        });
        break;
    }

    this.uiFlag.isSaved = false;
  }

  /**
   * 顯示編輯輸入框
   * @e {KeyboardEvent}
   * @param type {string}
   * @param id {number}
   * @param item {string}
   * @author kidin-1090827
   */
  editItem(e: KeyboardEvent, type: string, id: number, item: string): void {
    e.stopPropagation();
    this.uiFlag.editItem[type][item] = id;

    switch (item) {
      case 'title':
      case 'groupName':
      case 'name':
      case 'link':
      case 'name':
      case 'price':
      case 'link':
        setTimeout(() => {
          this[item].nativeElement.focus();
        });

        break;
      case 'content':
        this.uiFlag.showEditCardContent = true;
        this.cardContent = this.pageSetting.card[id].content.replace(/(<br>)/g, '\n');
        break;
    }

  }

  /**
   * 儲存輸入內容
   * @event focusout
   * @event keypress
   * @event change
   * @param e {KeyboardEvent | MouseEvent | Event}
   * @param type {string}
   * @param id {number}
   * @param item {string}
   * @author kidin-1090827
   */
  saveItemSetting(e: KeyboardEvent | MouseEvent | Event, type: string, id: number, item: string) {
    if ((e as KeyboardEvent).key === 'Enter' || (e as MouseEvent).type === 'focusout' || (e as any).type === 'change') {
      this.pageSetting[type][id][item] = (e as any).currentTarget.value;
      this.uiFlag.editItem[type][item] = null;
      this.uiFlag.isSaved = false;
    }

  }

  /**
   * 儲存卡片文字對齊方式
   * @event click
   * @param e {KeyboardEvent}
   * @param align {string}
   * @author kidin-1090831
   */
  saveAlign(e: KeyboardEvent, align: string) {
    e.stopPropagation();
    const cardId = this.uiFlag.editItem.card.content;
    this.pageSetting.card[cardId].textAlign = align;
    this.uiFlag.isSaved = false;
  }

  /**
   * 儲存卡片字型大小
   * @param e {Event}
   * @author kidin-1090831
   */
  saveFontSize(e: Event) {
    e.stopPropagation();
    const cardId = this.uiFlag.editItem.card.content,
          size = (e as any).value;
    this.pageSetting.card[cardId].fontSize = `${size}`;
    this.uiFlag.isSaved = false;
  }

  /**
   * 儲存卡片內容文字顏色
   * @param e {Event}
   * @author kidin-1090831
   */
  saveCardFontColor(e: Event) {
    const cardId = this.uiFlag.editItem.card.content;
    this.pageSetting.card[cardId].color = (e.currentTarget as any).value;
    this.uiFlag.isSaved = false;
  }

  /**
   * 顯示卡片的圖片選擇器
   * @event {click}
   * @param e {MouseEvent}
   * @author kidin-1090907
   */
  handleCardImgSelector(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.isClickCardImg = true;

    const element = this.cardImg.nativeElement;
    element.click();
  }

  /**
   * 儲存卡片內容
   * @param e {Event}
   * @author kidin-1090831
   */
  saveCardContent(e: Event) {
    const cardId = this.uiFlag.editItem.card.content;
    this.pageSetting.card[cardId].content = (e.currentTarget as any).value.replace(/\n/g, '<br>');
    this.uiFlag.isSaved = false;
  }

  /**
   * 儲存圖片至fomrData
   * @event change
   * @param e {Event}
   * @param type {string}-顯示區塊
   * @param id {number}-顯示順位
   * @param item {string}-欄位
   * @author kidin-1090914
   */
  saveImg(e: Event, type: string, id: number, item: string) {
    const img = (e.target as any).files[0];

    if (img) {
      this.formData.set(`${type}_${id}`, img, `${type}_${id}.${img.name.split('.')[1]}`);  // 後端圖片以"顯示區塊_id"命名
      this.pageSetting[type][id][item] = img.name;  // 儲存原圖片名稱方便使用者比對
      this.uiFlag.isSaved = false;
      this.uiFlag.editItem[type][item] = null;

      if (type === 'card') {
        this.uiFlag.isClickCardImg = false;
      }
    }

  }

  /**
   * 儲存整個活動設定
   * @author kidin-1090827
   */
  savePageSetting(): void {
    this.uiFlag.isSaving = true;
    this.pageSetting.editTimeStamp = moment().valueOf();
    this.pageSetting.editUserId = this.editor;

    this.formData.set('token', this.utils.getToken());
    this.formData.set('file', JSON.stringify(this.pageSetting));

    this.officialActivityService.editOfficialActivity(this.formData).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`Error: ${res.resultMessage}`);
      } else {
        this.uiFlag.isSaving = false;
        this.uiFlag.isSaved = true;
      }

    });

  }

  /**
   * 儲存整個活動設定並另開新分頁至活動頁面
   * @author kidin-1090827
   */
  previewSetting(): void {
    this.savePageSetting();
    window.open(`/official-activity?file=${this.pageSetting.fileName}`);
  }

  /**
   * 關閉卡片內容編輯器
   * @author kidin-1090831
   */
  closeContentEditor(): void {
    if (this.uiFlag.showEditCardContent === true) {
      this.uiFlag.showEditCardContent = false;
      this.cardContent = '';
    }

  }

  /**
   * 阻止再次點擊輸入框時事件冒泡而隱藏輸入框
   * @param e {MouseEvent}
   * @author kidin-1090907
   */
  stopClickPropagation(e: MouseEvent) {
    e.stopPropagation();
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
