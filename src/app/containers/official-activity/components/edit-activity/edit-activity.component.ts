import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import {
  UserService,
  AuthService,
  HintDialogService,
  ApiCommonService,
} from '../../../../core/services';
import { Subject, Subscription, fromEvent, merge, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { OfficialActivityService } from '../../services/official-activity.service';
import dayjs from 'dayjs';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { MapLanguageEnum } from '../../../../core/enums/common';
import * as DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import { AlbumType } from '../../../../core/enums/api';
import { ImageUploadService } from '../../../dashboard/services/image-upload.service';
import { SelectDate } from '../../../../core/models/common';
import {
  EventInfo,
  EventDetail,
  CardTypeEnum,
  HaveProduct,
  EventStatus,
} from '../../models/activity-content';
import { AccessRight } from '../../../../core/enums/common';
import {
  setLocalStorageObject,
  getLocalStorageObject,
  removeLocalStorageObject,
  createImgFileName,
  checkImgFormat,
  base64ToFile,
  deepCopy,
} from '../../../../core/utils';
import { day } from '../../../../core/models/const';
import { Gender } from '../../../../core/enums/personal';
import { appPath } from '../../../../app-path.const';

const leaveMessage = '尚未儲存，是否仍要離開此頁面？';
const contentTextLimit = 2500; // 詳細內容單一區塊字數上限
const contentInnerHtmlLimit = 4096; // 詳細內容含html標籤後的字數上限

type DateType = 'applyStartDate' | 'applyEndDate' | 'raceStartDate' | 'raceEndDate';
type EditSection = 'content' | 'group' | 'applyFee';
enum HaveNumberLimit {
  no = 1,
  yes,
}

@Component({
  selector: 'app-edit-activity',
  templateUrl: './edit-activity.component.html',
  styleUrls: ['./edit-activity.component.scss'],
})
export class EditActivityComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private globalEventSubscription = new Subscription();

  @ViewChild('imgUploadInput') imgUploadInput: ElementRef;

  /**
   * ui 會用到的各個flag
   */
  uiFlag = {
    progress: 100,
    editMode: <'create' | 'edit'>'edit',
    isSaved: true,
    showMapList: false,
    showAgeSelector: null,
    showGenderSelector: null,
    openImgSelector: null,
    imgCurrentEditId: null,
    numberLimit: HaveNumberLimit.no,
  };

  imgUpload = {
    theme: {
      origin: null,
      crop: null,
    },
    content: {},
    applyFee: {},
  };

  currentTimestamp = dayjs().startOf('day').unix();
  applyStartDateMin = this.currentTimestamp * 1000;
  language = MapLanguageEnum.TW;
  mapList: Array<any>;
  systemAccessright = AccessRight.guest;
  eventId: number;
  eventInfo: EventInfo;
  eventDetail: EventDetail;
  originEventStatus: EventStatus = EventStatus.notAudit;
  selectedMap: string;
  deleteList = {
    contentId: [],
    groupId: [],
    applyFeeId: [],
  };

  /**
   * 編輯文字區塊暫存文字，處理每次輸入文字時selection會從零開始的問題
   */
  tempContent = '';

  private compareContent = {
    eventInfo: <EventInfo>null,
    eventDetail: <EventDetail>null,
  };

  readonly defaultNumberLimit = 50;
  readonly AlbumType = AlbumType;
  readonly ageList = this.createAgeList();
  readonly CardTypeEnum = CardTypeEnum;
  readonly Sex = Gender;
  readonly HaveProduct = HaveProduct;
  readonly EventStatus = EventStatus;
  readonly HaveNumberLimit = HaveNumberLimit;
  readonly AccessRight = AccessRight;
  readonly toolbarConfig = {
    placeholder: '請輸入內文...',
    toolbar: {
      items: [
        'heading',
        '|',
        'fontfamily',
        'fontsize',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'alignment',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'numberedList',
        'bulletedList',
        '|',
        'link',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        '|',
        'undo',
        'redo',
      ],
    },
  };

  public editor = DecoupledEditor;

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private officialActivityService: OfficialActivityService,
    private dialog: MatDialog,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {
    this.getAccessRight();
    this.checkEditMode();
    this.getEvent();
    this.getMapLanguage();
    this.getAllCloudrunMap();
  }

  /**
   * 確認權限，權限不符則進入403頁面
   * @author kidin-1101015
   */
  getAccessRight() {
    const token = this.authService.token;
    if (token) {
      this.userService
        .getUser()
        .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res) => {
          this.systemAccessright = this.userService.getUser().systemAccessright;
        });
    }
  }

  /**
   * 訂閱before unload Event，避免未儲存跳出
   * @author kidin-1101026
   */
  subscribeBeforeUnloadEvent() {
    const unloadEvent = fromEvent(window, 'beforeunload');
    unloadEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      const { isSaved } = this.uiFlag;
      if (isSaved) {
        return true;
      } else {
        (e || window.event).returnValue = leaveMessage as any;
        return leaveMessage;
      }
    });
  }

  /**
   * 確認為創建新活動或編輯舊活動
   * @author kidin-1101020
   */
  checkEditMode() {
    this.eventId = +this.route.snapshot.paramMap.get(appPath.officialActivity.eventId);
    if (this.eventId < 0) {
      this.uiFlag.editMode = 'create';
    } else {
      this.uiFlag.editMode = 'edit';
      this.applyStartDateMin = this.currentTimestamp * 1000 + day;
    }
  }

  /**
   * 確認是否有暫存草稿
   * @param eventId {number}-活動流水id
   * @author kidin-1101029
   */
  checkDraft(eventId: number) {
    const eventDraftString = getLocalStorageObject('eventDraft');
    if (eventDraftString) {
      const eventDraft = JSON.parse(eventDraftString);
      const { eventId: draftEventId } = eventDraft.eventInfo;
      if (draftEventId === eventId) this.askImportDraft(eventDraft);
    }
  }

  /**
   * 跳出提示框詢問是否引入草稿
   * @param draft {any}-草稿內容
   */
  askImportDraft(draft: any) {
    const importMessage = '存在暫存草稿，是否引入？';
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: importMessage,
        confirmText: '確定',
        onConfirm: () => this.importDraft(draft),
        cancelText: '取消',
        onCancel: () => this.removeDraft(),
      },
    });
  }

  /**
   * 引入草稿
   * @param draft {any}-草稿內容
   * @author kidin-1101029
   */
  importDraft(draft: any) {
    const { eventInfo, eventDetail, del } = draft;
    this.eventInfo = eventInfo;
    this.originEventStatus = eventInfo.eventStatus;
    this.eventDetail = eventDetail;
    this.getSelectMapName();
    this.checkNumberLimit();
    if (this.uiFlag.editMode === 'edit') this.deleteList = del;
  }

  /**
   * 確認此活動是否有人數限制
   * @author kidin-1101119
   */
  checkNumberLimit() {
    const { numberLimit } = this.eventInfo;
    if (numberLimit && numberLimit > 0) {
      this.uiFlag.numberLimit = HaveNumberLimit.yes;
    } else {
      this.uiFlag.numberLimit = HaveNumberLimit.no;
    }
  }

  /**
   * 建立或取得活動內容
   * @author kidin-1101029
   */
  getEvent() {
    const eventId = +this.route.snapshot.paramMap.get(appPath.officialActivity.eventId);
    const { editMode } = this.uiFlag;
    if (editMode === 'create') {
      this.createNewEventBody();
    } else {
      this.getEventDetail(eventId);
    }
  }

  /**
   * 移除草稿
   * @author kidin-1101029
   */
  removeDraft() {
    removeLocalStorageObject('eventDraft');
  }

  /**
   * 取得使用的語系
   * @author kidin-1101021
   */
  getMapLanguage() {
    const language = getLocalStorageObject('locale');
    switch (language) {
      case 'zh-tw':
        this.language = MapLanguageEnum.TW;
        break;
      case 'zh-cn':
        this.language = MapLanguageEnum.CN;
        break;
      case 'es-es':
        this.language = MapLanguageEnum.ES;
        break;
      default:
        this.language = MapLanguageEnum.EN;
        break;
    }
  }

  /**
   * 取得雲跑地圖
   * @author kidin-1101021
   */
  getAllCloudrunMap() {
    this.officialActivityService
      .getRxAllMapInfo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res: any) => {
        this.mapList = deepCopy(res).sort((a, b) => +a.distance - +b.distance);
        this.getSelectMapName();
      });
  }

  /**
   * 建立新賽事物件
   * @author kidin-1101020
   */
  createNewEventBody() {
    const startTimestamp = dayjs().add(30, 'day').startOf('day').unix();
    const endTimestamp = dayjs().add(60, 'day').endOf('day').unix();
    this.eventInfo = {
      eventName: '',
      eventId: -1,
      description: '',
      eventStatus: EventStatus.notAudit,
      applyDate: {
        startDate: startTimestamp,
        endDate: endTimestamp,
      },
      raceDate: {
        startDate: startTimestamp,
        endDate: endTimestamp,
      },
      cloudrunMapId: -1,
    };

    this.eventDetail = {
      content: [],
      applyFee: [
        {
          feeId: 1,
          title: '報名費用',
          fee: 49999,
          haveProduct: HaveProduct.no,
        },
      ],
      group: [
        {
          id: 1,
          name: '分組',
          gender: Gender.unlimit,
        },
      ],
    };

    this.uiFlag.isSaved = false;
    this.checkDraft(this.eventInfo.eventId);
    this.subscribeBeforeUnloadEvent();
  }

  /**
   * 取得指定活動詳細內容
   * @param eventId {number}-活動流水id
   * @author kidin-1101020
   */
  getEventDetail(eventId: number) {
    this.uiFlag.progress = 30;
    this.officialActivityService.getEventDetail({ eventId }).subscribe((res) => {
      if (this.apiCommonService.checkRes(res)) {
        const { eventInfo, eventDetail } = res;
        this.eventInfo = eventInfo;
        this.originEventStatus = eventInfo.eventStatus;
        this.getSelectMapName();
        this.checkNumberLimit();
        const { eventStatus } = this.eventInfo;
        if (eventStatus === EventStatus.cancel) {
          // 取消賽事則該賽事凍結不得編輯
          const { officialActivity } = appPath;
          this.router.navigateByUrl(`/${officialActivity.home}/${officialActivity.activityList}`);
        } else {
          this.eventDetail = this.filterVarible(eventDetail);
          this.compareContent = deepCopy({
            eventInfo,
            eventDetail,
          });

          this.checkDraft(this.eventInfo.eventId);
        }
      }

      this.subscribeBeforeUnloadEvent();
      this.uiFlag.progress = 100;
    });
  }

  /**
   * 將不必要的變數移除
   * @param eventDetail {EventDetail}-活動詳細資訊
   */
  filterVarible(eventDetail: EventDetail) {
    eventDetail.group = eventDetail.group.map((_group) => {
      delete _group.currentApplyNumber;
      return _group;
    });

    return eventDetail;
  }

  /**
   * 編輯完成，依編輯模式不同使用不同api進行儲存
   * @author kidin-1101020
   */
  editComplete() {
    const emptyElement = document.querySelectorAll('.empty__warn');
    const { content } = this.eventDetail;
    if (emptyElement.length) {
      const message = '尚有必填欄位未完成';
      this.hintDialogService.openAlert(message);
    } else if (content.length === 0) {
      const message = '請新增活動詳細內容';
      this.hintDialogService.openAlert(message);
    } else {
      const { editMode } = this.uiFlag;
      if (editMode === 'create') {
        this.createEvent();
      } else {
        this.saveEdit();
      }
    }
  }

  /**
   * 取消編輯
   * @author kidni-1101020
   */
  cancelEdit() {
    const { isSaved } = this.uiFlag;
    if (!isSaved) {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: leaveMessage,
          confirmText: '確定',
          onConfirm: () => this.turnBack(),
          cancelText: '取消',
        },
      });
    } else {
      this.turnBack();
    }
  }

  /**
   * 返回上一頁
   * @author kidin-1101020
   */
  turnBack() {
    this.uiFlag.isSaved = true;
    this.removeDraft();
    window.history.back();
  }

  /**
   * 建立新活動
   * @author kidin-1101020
   */
  createEvent() {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.progress = 30;
      delete this.eventInfo.eventId;
      const token = this.authService.token;
      const { eventInfo, eventDetail } = this;
      const body = {
        token,
        eventInfo,
        eventDetail,
      };

      this.officialActivityService
        .createEvent(body)
        .pipe(
          switchMap((createRes) => {
            if (this.apiCommonService.checkRes(createRes)) {
              const { eventId } = createRes;
              return this.uploadImg(eventId).pipe(
                map((uploadRes) => {
                  uploadRes = {
                    eventId,
                    ...uploadRes,
                  };

                  return uploadRes;
                })
              );
            }
          })
        )
        .subscribe((result) => {
          if (this.apiCommonService.checkRes(result)) {
            this.saveSuccess();
            const newEventId = result.eventId;
            const { officialActivity } = appPath;
            this.router.navigateByUrl(
              `/${officialActivity.home}/${officialActivity.activityDetail}/${newEventId}`
            );
          }

          this.uiFlag.progress = 100;
        });
    }
  }

  /**
   * 上傳照片至圖床
   * @param eventId {number}-活動流水id
   * @author kidin-1101028
   */
  uploadImg(eventId: number) {
    let imgArray = [];
    let formData = new FormData();
    const token = this.authService.token;
    const { theme, content, applyFee } = this.imgUpload;
    formData.set('token', token);
    formData.set('targetType', '3');
    formData.set('targetEventId', `${eventId}`);

    const newTheme = theme.crop;
    if (newTheme) {
      [imgArray, formData] = this.appendNewImg(
        imgArray,
        formData,
        eventId,
        AlbumType.eventTheme,
        newTheme
      );
    }

    for (const _contentId in content) {
      const newContentImg = content[_contentId];
      [imgArray, formData] = this.appendNewImg(
        imgArray,
        formData,
        eventId,
        AlbumType.eventContent,
        newContentImg,
        +_contentId
      );
    }

    for (const _applyFeeId in applyFee) {
      const { crop: newFeeImg } = applyFee[_applyFeeId];
      [imgArray, formData] = this.appendNewImg(
        imgArray,
        formData,
        eventId,
        AlbumType.eventApplyFee,
        newFeeImg,
        +_applyFeeId
      );
    }

    formData.set('img', JSON.stringify(imgArray));
    return this.imageUploadService.addImg(formData);
  }

  /**
   * 將新圖片加至新增清單(imgArray)與formData中
   * @param imgArray {Array<{ albumType: AlbumType; fileNameFull: string; }>}-新增清單
   * @param formData {any}
   * @param eventId {number}-活動流水id
   * @param type {AlbumType}-圖片類別
   * @param newImg {string | Blob}-base64圖片或圖片檔案
   * @param id {number}-流水id
   * @author kidin-1101029
   */
  appendNewImg(
    imgArray: Array<{ albumType: AlbumType; fileNameFull: string; id?: number }>,
    formData: any,
    eventId: number,
    type: AlbumType,
    newImg: string | Blob,
    id: number = null
  ) {
    const index = imgArray.length;
    const fileName = createImgFileName(index, eventId);
    const fileNameFull = `${fileName}.jpg`;
    const newFile = base64ToFile(newImg as string, fileName);
    switch (type) {
      case AlbumType.eventTheme:
        imgArray.push({
          albumType: type,
          fileNameFull: fileNameFull,
        });

        break;
      case AlbumType.eventApplyFee:
      case AlbumType.eventContent:
        imgArray.push({
          albumType: type,
          fileNameFull: fileNameFull,
          id,
        });

        break;
    }

    formData.append('file', newFile);
    return [imgArray, formData];
  }

  /**
   * 儲存變更
   * @author kidin-1101020
   */
  saveEdit() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      const token = this.authService.token;
      const { eventInfo, eventDetail, compareContent, eventId: targetEventId } = this;
      const newContent = { eventInfo, eventDetail };
      const editContent = this.getEditContent(compareContent, newContent);
      const deleteList = this.checkDeleteList();
      const body = {
        token,
        targetEventId,
        ...editContent,
        ...deleteList,
      };

      this.officialActivityService
        .editEventDetail(body)
        .pipe(
          switchMap((editRes) => {
            if (this.apiCommonService.checkRes(editRes)) {
              if (this.checkImgChange()) {
                return this.uploadImg(targetEventId);
              } else {
                return of(editRes);
              }
            }
          })
        )
        .subscribe((result) => {
          if (this.apiCommonService.checkRes(result)) {
            this.saveSuccess();
            const { officialActivity } = appPath;
            const url = `/${officialActivity.home}/${officialActivity.activityDetail}/${targetEventId}`;
            this.router.navigateByUrl(url);
          }

          this.uiFlag.progress = 100;
        });
    }
  }

  /**
   * 建立或編輯活動成功後移除草稿
   * @author kidin-1101116
   */
  saveSuccess() {
    this.uiFlag.isSaved = true;
    this.removeDraft();
  }

  /**
   * 確認是否有照片待上傳
   * @author kidin-1101101
   */
  checkImgChange() {
    const {
      theme: { crop },
      content,
      applyFee,
    } = this.imgUpload;
    const themeChange = crop !== null;
    const contentImgChange = Object.keys(content).length > 0;
    const applyFeeImgChange = Object.keys(applyFee).length > 0;
    return themeChange || contentImgChange || applyFeeImgChange;
  }

  /**
   * 比對新舊內容，以取得待更新的部份
   * @param compareObj {any}-原內容
   * @param newObj {any}-更新後之內容
   * @author kidin-1101101
   */
  getEditContent(compareObj: any, newObj: any) {
    let editPart = {};
    for (const _key in compareObj) {
      const compareValue = compareObj[_key];
      const newValue = newObj[_key];
      switch (_key) {
        case 'eventInfo':
        case 'eventDetail': {
          const editedObj = this.getEditContent(compareValue, newValue);
          const editedObjSize = Object.keys(editedObj).length;
          if (editedObjSize > 0) {
            editPart = {
              ...editPart,
              [_key]: editedObj,
            };
          } else {
            // eventInfo, eventDetail沒編輯亦要帶空物件
            editPart = {
              ...editPart,
              [_key]: {},
            };
          }

          break;
        }
        case 'applyDate':
        case 'raceDate':
          if (this.isDifferentObject(newValue, compareValue)) {
            editPart = {
              [_key]: newValue,
              ...editPart,
            };
          }

          break;
        case 'content':
        case 'applyFee':
        case 'group':
          // 有任何不同就整個更新
          if (this.isDifferentArray(newValue, compareValue)) {
            editPart = {
              [_key]: newValue,
              ...editPart,
            };
          }

          break;
        // img 另外使用圖床api處理
        case 'themeImg':
        // 不予處理
        case 'lastEditDate':
        case 'currentApplyNumber':
          break;
        default:
          if (compareValue !== newValue) {
            editPart = {
              [_key]: newValue,
              ...editPart,
            };
          }

          break;
      }
    }

    return editPart;
  }

  /**
   * 確認僅一層的兩個物件是否相等
   * @param newObj {any}-新物件
   * @param oldObj {any}-舊物件
   * @author kidin-1101101
   */
  isDifferentObject(newObj: any, oldObj: any) {
    const oldObjSize = Object.keys(oldObj).length;
    const newObjSize = Object.keys(newObj).length;
    if (newObjSize !== oldObjSize) {
      return true;
    } else {
      let isDifferent = false;
      for (const _key in oldObj) {
        const _oldValue = oldObj[_key];
        const _newValue = newObj[_key];
        if (_newValue !== _oldValue) isDifferent = true;
      }

      return isDifferent;
    }
  }

  /**
   * 確認兩個陣列是否相等
   * @param newArray {Array<any>}-新陣列
   * @param oldArray {Array<any>}-舊陣列
   * @author kidin-1101101
   */
  isDifferentArray(newArray: Array<any>, oldArray: Array<any>) {
    const newValueLength = newArray.length;
    const compareValueLength = oldArray.length;
    if (newValueLength !== compareValueLength) {
      return true;
    } else {
      for (let i = 0; i < oldArray.length; i++) {
        const _compareObj = oldArray[i];
        const _newObj = newArray[i];
        for (const _compareObjKey in _compareObj) {
          if (_newObj[_compareObjKey] !== undefined) {
            const _newValue = _newObj[_compareObjKey];
            const _oldValue = _compareObj[_compareObjKey];
            if (_compareObjKey !== 'age') {
              if (_newValue !== _oldValue) return true;
            } else {
              return this.isDifferentObject(_newObj, _compareObj);
            }
          } else {
            return true;
          }
        }
      }
    }
  }

  /**
   * 確認是否有任何需刪除的內文區塊/分組/報名組合
   * @author kidin-1101103
   */
  checkDeleteList() {
    const { content: newContent, applyFee: newApplyFee, group: newGroup } = this.eventDetail;
    const { content, applyFee, group } = this.compareContent.eventDetail;
    if (newContent.length < content.length) {
      const delLength = content.length - newContent.length;
      this.deleteList.contentId = this.getDeleleteIdList(newContent.length, delLength);
    }

    if (newApplyFee.length < applyFee.length) {
      const delLength = applyFee.length - newApplyFee.length;
      this.deleteList.applyFeeId = this.getDeleleteIdList(newApplyFee.length, delLength);
    }

    if (newGroup.length < group.length) {
      const delLength = group.length - newGroup.length;
      this.deleteList.groupId = this.getDeleleteIdList(newGroup.length, delLength);
    }

    const { contentId, groupId, applyFeeId } = this.deleteList || {
      contentId: [],
      groupId: [],
      applyFeeId: [],
    };
    const haveDeleteContent = contentId.length > 0;
    const haveDeleteGroup = groupId.length > 0;
    const haveDeleteApplyFee = applyFeeId.length > 0;
    if (haveDeleteContent || haveDeleteGroup || haveDeleteApplyFee) {
      return {
        del: this.deleteList,
      };
    } else {
      return {};
    }
  }

  /**
   * 取得刪除區塊之id清單
   * @param base {number}-開始刪除的基準id
   * @param length {number}-刪除數目
   * @author kidin-1101224
   */
  getDeleleteIdList(base: number, length: number) {
    const list = [];
    for (let i = 0; i < length; i++) {
      const deleteId = base + 1 + i;
      list.push(deleteId);
    }

    return list;
  }

  /**
   * 跳出提示確認是否發佈賽事
   * @author kidin-1110208
   */
  releaseEventAlert() {
    const { eventStatus } = this.eventInfo;
    if (eventStatus === EventStatus.cancel) {
      this.eventInfo.eventStatus = EventStatus.notAudit;
    } else {
      const message = '確認是否發佈賽事？';
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: message,
          confirmText: '是',
          onConfirm: () => this.confirmReleaseEvent(),
          cancelText: '否',
          onCancel: () => this.uncheckReleaseEvent(),
        },
      });
    }
  }

  /**
   * 確認發布活動
   * @author kidin-1110208
   */
  confirmReleaseEvent() {
    this.eventInfo.eventStatus = EventStatus.audit;
  }

  /**
   * 取消活動發布
   */
  uncheckReleaseEvent() {
    this.eventInfo.eventStatus = EventStatus.notAudit;
    const targetElement = document.getElementById('event__status__audit') as any;
    targetElement.checked = false;
  }

  /**
   * 跳出提示確認是否取消賽事
   * @author kidin-1101115
   */
  cancelEventAlert() {
    const { eventStatus } = this.eventInfo;
    if (eventStatus === EventStatus.cancel) {
      this.eventInfo.eventStatus = EventStatus.audit;
    } else {
      const message = '一旦取消賽事將凍結該賽事不得編輯，是否仍要取消賽事？';
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: message,
          confirmText: '是',
          onConfirm: () => this.confirmCancelEvent(),
          cancelText: '否',
          onCancel: () => this.uncheckCancelEvent(),
        },
      });
    }
  }

  /**
   * 確定取消賽事
   * @author kidin-1101118
   */
  confirmCancelEvent() {
    this.eventInfo.eventStatus = EventStatus.cancel;
  }

  /**
   * 取消賽事取消
   * @author kidin-1101115
   */
  uncheckCancelEvent() {
    this.eventInfo.eventStatus = EventStatus.audit;
    const targetElement = document.getElementById('event__status__cancel') as any;
    targetElement.checked = false;
  }

  /**
   * 新增影片連結編輯框
   * @author kidin-1101020
   */
  addContentVideo() {
    this.uiFlag.isSaved = false;
    const newContentId = this.createNewContentId();
    this.eventDetail.content.push({
      contentId: newContentId,
      cardType: CardTypeEnum.video,
      title: '',
      videoLink: '',
    });
  }

  /**
   * 新增圖片編輯框
   * @author kidin-1101020
   */
  addContentImg() {
    this.uiFlag.isSaved = false;
    const newContentId = this.createNewContentId();
    this.eventDetail.content.push({
      contentId: newContentId,
      cardType: CardTypeEnum.img,
      title: '',
    });
  }

  /**
   * 新增內文編輯框
   * @author kidin-1101020
   */
  addContentText() {
    this.uiFlag.isSaved = false;
    const newContentId = this.createNewContentId();
    this.eventDetail.content.push({
      contentId: newContentId,
      cardType: CardTypeEnum.text,
      title: '',
      text: '',
    });
  }

  /**
   * 產生新區塊的contentId
   * @author kidin-1101022
   */
  createNewContentId() {
    const contentLength = this.eventDetail.content.length;
    return contentLength + 1;
  }

  /**
   * 輸入活動名稱
   * @param e {MouseEvent}
   * @author kidin-1101020
   */
  handleTitleInput(e: Event) {
    const title = (e as any).target.value.trim();
    const { eventName } = this.eventInfo;
    if (title !== eventName) {
      this.eventInfo.eventName = title;
      this.saveDraft();
    }
  }

  /**
   * 取得所選日期，並確認各日期是否衝突(競賽日期必於報名日期之後)
   * @param date {sting}-所選日期
   * @param type {DateType}-該日期類別
   * @author kidin-1101021
   */
  getSelectDate(date: SelectDate, type: DateType) {
    const {
      applyDate: { startDate: applyStartTimestamp, endDate: applyEndTimestamp },
      raceDate: { startDate: raceStartTimestamp, endDate: raceEndTimestamp },
    } = this.eventInfo;
    const newStartTimestamp = dayjs(date.startDate).unix();
    const newEndTimestamp = dayjs(date.endDate).unix();

    switch (type) {
      case 'applyStartDate':
        if (newStartTimestamp !== applyStartTimestamp) {
          this.eventInfo.applyDate = {
            startDate: newStartTimestamp,
            endDate: applyEndTimestamp < newEndTimestamp ? newEndTimestamp : applyEndTimestamp,
          };

          this.eventInfo.raceDate = {
            startDate:
              raceStartTimestamp < newStartTimestamp ? newStartTimestamp : raceStartTimestamp,
            endDate: raceEndTimestamp < newEndTimestamp ? newEndTimestamp : raceEndTimestamp,
          };

          this.saveDraft();
        }

        break;
      case 'applyEndDate':
        if (newEndTimestamp !== applyEndTimestamp) {
          this.eventInfo.applyDate = {
            startDate:
              applyStartTimestamp > newStartTimestamp ? newStartTimestamp : applyStartTimestamp,
            endDate: newEndTimestamp,
          };

          this.eventInfo.raceDate.endDate =
            raceEndTimestamp < newEndTimestamp ? newEndTimestamp : raceEndTimestamp;

          this.saveDraft();
        }

        break;
      case 'raceStartDate':
        if (newStartTimestamp !== raceStartTimestamp) {
          this.eventInfo.raceDate = {
            startDate: newStartTimestamp,
            endDate: raceEndTimestamp < newEndTimestamp ? newEndTimestamp : raceEndTimestamp,
          };

          this.saveDraft();
        }

        break;
      case 'raceEndDate':
        if (newEndTimestamp !== raceEndTimestamp) {
          this.eventInfo.raceDate = {
            startDate:
              raceStartTimestamp > newStartTimestamp ? newStartTimestamp : raceStartTimestamp,
            endDate: newEndTimestamp,
          };

          this.saveDraft();
        }

        break;
    }
  }

  /**
   * 選擇是否有總人數限制
   * @param e {MouseEvent}
   * @author kidin-1101115
   */
  selectPeopleLimit(e: MouseEvent) {
    const { value } = (e as any).target;
    if (value == HaveNumberLimit.no) {
      this.uiFlag.numberLimit = HaveNumberLimit.no;
      this.eventInfo.numberLimit = -1; // 使用-1當作無限制人數
    } else {
      this.uiFlag.numberLimit = HaveNumberLimit.yes;
      Object.assign(this.eventInfo, { numberLimit: this.defaultNumberLimit });
    }
  }

  /**
   * 輸入總人數限制
   * @param e {MouseEvent}
   * @author kidin-1101115
   */
  handlePeopleLimitInput(e: MouseEvent) {
    const { value } = (e as any).target;
    this.uiFlag.numberLimit = HaveNumberLimit.yes;
    Object.assign(this.eventInfo, { numberLimit: +value });
    const element = document.getElementById('peopel__limit') as any;
    element.checked = true;
  }

  /**
   * 顯示地圖
   * @author kidin-1101021
   */
  showMapList(e: KeyboardEvent) {
    e.stopPropagation();
    if (this.checkCanEdit()) {
      this.uiFlag.showMapList = true;
      this.subscribeGlobalEvent();
    }
  }

  /**
   * 確認是否為新建模式或現在時間尚未超出活動報名時間
   * @author kidin-1101116
   */
  checkCanEdit() {
    const {
      uiFlag: { editMode },
      currentTimestamp,
      eventInfo,
    } = this;
    const isCreateMode = editMode === 'create';
    const beforeEventApplyStart = currentTimestamp < eventInfo.applyDate.startDate;
    const notAudit = this.originEventStatus === EventStatus.notAudit;
    return isCreateMode || beforeEventApplyStart || notAudit;
  }

  /**
   * 訂閱全域點擊與滾動事件
   * @author kidin-1101021
   */
  subscribeGlobalEvent() {
    const scrollElement = document.getElementById('main__edit__content');
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(document, 'click');
    this.globalEventSubscription = merge(scrollEvent, clickEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.unSubscribeGlobalEvent();
      });
  }

  /**
   * 取消訂閱全域點擊與滾動事件
   * @author kidin-1101021
   */
  unSubscribeGlobalEvent() {
    this.uiFlag.showMapList = false;
    this.uiFlag.showAgeSelector = null;
    this.uiFlag.showGenderSelector = null;
    if (this.globalEventSubscription) {
      this.globalEventSubscription.unsubscribe();
    }
  }

  /**
   * 選擇地圖
   * @param e {KeyboardEvent}
   * @param id {string}-map id
   * @author kidin-1101021
   */
  selectMap(e: KeyboardEvent, id: string) {
    e.stopPropagation();
    const oldMapId = this.eventInfo.cloudrunMapId;
    const newMapId = +id;
    if (newMapId !== oldMapId) {
      this.eventInfo.cloudrunMapId = newMapId;
      this.getSelectMapName(newMapId);
      this.saveDraft();
    }

    this.unSubscribeGlobalEvent();
  }

  /**
   * 取得所選雲跑地圖名稱
   * @param mapId {number}-雲跑地圖流水編號
   * @author kidin-1110301
   */
  getSelectMapName(mapId: number = null) {
    const { mapList, eventInfo, language } = this;
    if (eventInfo && mapList) {
      const { cloudrunMapId } = eventInfo;
      const id = mapId ?? cloudrunMapId;
      const index = mapList.findIndex((_map) => _map.mapId == id);
      this.selectedMap = mapList[index > -1 ? index : 0].info[language].mapName;
    }
  }

  /**
   * 輸入活動簡介
   * @param e {MouseEvent}
   * @author kidin-1101021
   */
  handleDescriptionInput(e: MouseEvent) {
    const newDescription = (e as any).target.value.trim();
    const { description } = this.eventInfo;
    if (newDescription !== description) {
      this.eventInfo.description = newDescription;
      this.saveDraft();
    }
  }

  /**
   * 輸入區塊標題
   * @param e {MouseEvent}
   * @param id {number}-區塊前端自定義流水id
   * @param kidin-1101021
   */
  handleContentTitleInput(e: MouseEvent, id: number) {
    const newTitle = (e as any).target.value.trim();
    const { title } = this.eventDetail.content[id - 1];
    if (newTitle !== title) {
      this.eventDetail.content[id - 1].title = newTitle;
      this.saveDraft();
    }
  }

  /**
   * 輸入區塊文字
   * @param e {ChangeEvent}-ckeditor change event
   * @param id {number}-區塊前端自定義流水id
   */
  handleContentTextInput(e: ChangeEvent, id: number) {
    const oldText = this.eventDetail.content[id - 1].text;
    const newText = e.editor.getData();
    const innerHtmlLengthOver = newText.length > contentInnerHtmlLimit;
    const textLengthOver = this.countContentLength(newText) > contentTextLimit;
    if (oldText === newText) return false;
    if (innerHtmlLengthOver || textLengthOver) {
      e.editor.setData(this.tempContent);
      this.hintDialogService.showSnackBar('HTML或字數超出限制');
    } else {
      this.tempContent = newText;
    }

    this.saveDraft();
  }

  /**
   * 聚焦時，將該區塊文字複製並暫存
   * @param e 聚焦事件
   * @param id 區塊編號
   */
  handleFocusInput(e, id: number) {
    this.tempContent = this.eventDetail.content[id - 1].text;
  }

  /**
   * 離焦時，將該區塊編輯後的文字存回原有內容中
   * @param e 離焦事件
   * @param id 區塊編號
   */
  handleFocusoutInput(e, id: number) {
    this.eventDetail.content[id - 1].text = this.tempContent;
  }

  /**
   * 輸入影片Url
   * @param e {MouseEvent}
   * @param id {number}-區塊前端自定義流水id
   * @param kidin-1101028
   */
  handleVideoUrlInput(e: MouseEvent, id: number) {
    const newUrl = (e as any).target.value.trim();
    const { videoLink } = this.eventDetail.content[id - 1];
    const embedLink = this.checkEmbedUrl(newUrl);
    if (embedLink !== videoLink) {
      this.eventDetail.content[id - 1].videoLink = embedLink;
      this.saveDraft();
    }
  }

  /**
   * 針對youtube縮網址轉換為嵌入式網址
   * @param link {string}-影片連結
   * @author kidin-1101222
   */
  checkEmbedUrl(link: string) {
    const youtubeAbbreviatedUrl = 'https://youtu.be/';
    if (link.includes(youtubeAbbreviatedUrl)) {
      const linkCode = link.split(youtubeAbbreviatedUrl)[1];
      return `https://www.youtube.com/embed/${linkCode}`;
    } else {
      return link;
    }
  }

  /**
   * 計算純文字字數（不含html 與 style）
   * @param htmlString {string}-編輯的內容
   * @author kidin-1101027
   */
  countContentLength(htmlString: string) {
    let length = 0;
    let passCount = false;
    for (let i = 0; i < htmlString.length; i++) {
      const _word = htmlString[i];
      switch (_word) {
        case '<':
          passCount = true;
          break;
        case '>':
          passCount = false;
          break;
        default:
          if (!passCount) length++;
      }
    }

    return length;
  }

  /**
   * 顯示警告視窗
   * @param type {EditSection}-編輯的區塊類別
   * @param id {number}-該區塊流水id
   * @author kidin-1101028
   */
  showDeleteAlert(type: EditSection, id: number) {
    const message = '確認是否刪除此區塊？';
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: message,
        confirmText: '確定',
        onConfirm: () => this.deleteSection(type, id),
        cancelText: '取消',
      },
    });
  }

  /**
   * 根據類別刪除指定區塊
   * @param type {EditSection}-編輯的區塊類別
   * @param id {number}-該區塊流水id
   * @author kidin-1101028
   */
  deleteSection(type: EditSection, id: number) {
    switch (type) {
      case 'content':
        this.deleteContent(id);
        break;
      case 'group':
        this.deleteGroup(id);
        break;
      case 'applyFee':
        this.deleteApplyFee(id);
        break;
    }
  }

  /**
   * 刪除指定內容
   * @param id {number}-指定的內容流水id
   * @author kidin-1101028
   */
  deleteContent(id: number) {
    const imgUploadCache = {};
    this.eventDetail.content = this.eventDetail.content
      .filter((_content) => _content.contentId !== id)
      .map((_content, index) => {
        const oldId = _content.contentId;
        const newId = index + 1;
        _content.contentId = newId;
        const uploadImg = this.imgUpload.content[oldId];
        if (uploadImg) Object.assign(imgUploadCache, { [newId]: uploadImg });
        return _content;
      });

    this.imgUpload.content = imgUploadCache;
    this.saveDraft();
  }

  /**
   * 變更內容區塊排序
   * @param index {number}-內容索引
   * @param direction {'up' | 'down'}-目標移動方向
   * @author kidin-1101222
   */
  shiftContent(index: number, direction: 'up' | 'down') {
    const targetContent = deepCopy(this.eventDetail.content[index]);
    const switchIndex = index + (direction === 'up' ? -1 : 1);
    const switchContent = deepCopy(this.eventDetail.content[switchIndex]);
    [this.eventDetail.content[index], this.eventDetail.content[switchIndex]] = [
      switchContent,
      targetContent,
    ];
    const imgUploadCache = {};
    this.eventDetail.content = this.eventDetail.content.map((_content, index) => {
      const oldId = _content.contentId;
      const newId = index + 1;
      _content.contentId = newId;
      const uploadImg = this.imgUpload.content[oldId];
      if (uploadImg) Object.assign(imgUploadCache, { [newId]: uploadImg });
      return _content;
    });

    this.imgUpload.content = imgUploadCache;
    this.saveDraft();
  }

  /**
   * 取消預設動作
   * @param e {MouseEvent}
   * @author kidin-1101025
   */
  cancelDefault(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * 輸入分組名稱
   * @param e {MouseEvent}
   * @param id {number}
   * @author kidin-1101026
   */
  handleGroupTitleInput(e: MouseEvent, id: number) {
    const name = (e as any).target.value;
    const targetIndex = id - 1;
    const oldName = this.eventDetail.group[targetIndex].name;
    const repeat = this.eventDetail.group.findIndex((_group, index) => {
      return _group.name === name && targetIndex !== index;
    });

    if (repeat > -1) {
      this.hintDialogService.showSnackBar('分組名稱重複');
      this.eventDetail.group[targetIndex].name = '';
    } else if (name !== oldName) {
      this.eventDetail.group[targetIndex].name = name;
      this.saveDraft();
    }
  }

  /**
   * 輸入優惠組合名稱
   * @param e {MouseEvent}
   * @param id {number}
   * @author kidin-1101026
   */
  handleFeeTitleInput(e: MouseEvent, id: number) {
    const title = (e as any).target.value;
    const targetIndex = id - 1;
    const oldTitle = this.eventDetail.applyFee[targetIndex].title;
    const repeat = this.eventDetail.applyFee.findIndex((_applyFee, index) => {
      return _applyFee.title === title && targetIndex !== index;
    });

    if (repeat > -1) {
      this.hintDialogService.showSnackBar('報名組合名稱重複');
      this.eventDetail.applyFee[targetIndex].title = '';
    } else if (title !== oldTitle) {
      this.eventDetail.applyFee[targetIndex].title = title;
      this.saveDraft();
    }
  }

  /**
   * 輸入優惠組合費用
   * @param e {MouseEvent}
   * @param id {number}
   * @author kidin-1101026
   */
  handleFeeInput(e: MouseEvent, id: number) {
    const fee = +(e as any).target.value;
    const targetIndex = id - 1;
    const maxFee = 49999; // 綠界付款ATM最大付款金額
    const oldFee = +this.eventDetail.applyFee[targetIndex].fee;
    if (fee !== oldFee) {
      this.eventDetail.applyFee[targetIndex].fee = fee > maxFee ? maxFee : fee;
      this.saveDraft();
    }
  }

  /**
   * 展開或收合年齡選單
   * @param type {'min' | 'max'}-年齡上限或下限
   * @param id {number}-分組id
   * @author kidin-1101026
   */
  openAgeSelector(e: MouseEvent, type: 'min' | 'max', id: number) {
    e.stopPropagation();
    this.unSubscribeGlobalEvent();
    if (this.checkCanEdit()) {
      const { showAgeSelector } = this.uiFlag;
      const target = `${type}-${id}`;
      if (showAgeSelector !== target) {
        this.uiFlag.showAgeSelector = target;
        this.subscribeGlobalEvent();
      }
    }
  }

  /**
   * 建立年齡清單供編輯者選擇
   * @author kidin-1101025
   */
  createAgeList() {
    const ageList: Array<number> = [];
    for (let i = 0; i < 101; i++) {
      ageList.push(i);
    }

    return ageList;
  }

  /**
   * 選擇限制年齡
   * @param e {MouseEvent}
   * @param age {number}-所選年齡
   * @author kidin-1101026
   */
  selectLimitAge(e: MouseEvent, age: number) {
    e.stopPropagation();
    const [type, id] = this.uiFlag.showAgeSelector.split('-');
    const targetIndex = id - 1;
    const targetGroup = this.eventDetail.group[targetIndex];
    let editAge: number;
    if (type === 'max') {
      editAge = age < 0 ? 100 : age;
    } else {
      editAge = age < 0 ? 0 : age;
    }

    if (targetGroup.age === undefined) {
      if (editAge) {
        this.eventDetail.group[targetIndex] = {
          age: {
            min: 0,
            max: 100,
          },
          ...this.eventDetail.group[targetIndex],
        };

        this.eventDetail.group[targetIndex].age[type] = editAge;
      }
    } else {
      this.eventDetail.group[targetIndex].age[type] = editAge;
      const { min, max } = this.eventDetail.group[targetIndex].age;
      if (!min && !max) {
        delete this.eventDetail.group[targetIndex].age;
      }
    }

    this.saveDraft();
    this.unSubscribeGlobalEvent();
  }

  /**
   * 展開或收合性別選單
   * @param e {MouseEvent}
   * @param id {number}-分組id
   * @author kidin-1101026
   */
  openGenderSelector(e: MouseEvent, id: number) {
    e.stopPropagation();
    this.unSubscribeGlobalEvent();
    if (this.checkCanEdit()) {
      const { showGenderSelector } = this.uiFlag;
      if (showGenderSelector !== id) {
        this.uiFlag.showGenderSelector = id;
        this.subscribeGlobalEvent();
      }
    }
  }

  /**
   * 選擇限制性別
   * @param e {MouseEvent}
   * @param gender {number}-所選性別
   * @author kidin-1101026
   */
  selectLimitGender(e: MouseEvent, gender: Gender) {
    e.stopPropagation();
    const targetIndex = this.uiFlag.showGenderSelector - 1;
    const oldGenderLimit = this.eventDetail.group[targetIndex].gender;
    if (gender !== oldGenderLimit) {
      this.eventDetail.group[targetIndex].gender = gender;
      this.saveDraft();
    }

    this.unSubscribeGlobalEvent();
  }

  /**
   * 刪除指定分組
   * @param id {number}-指定的分組id
   * @author kidin-1101026
   */
  deleteGroup(id: number) {
    this.eventDetail.group = this.eventDetail.group
      .filter((_group) => _group.id !== id)
      .map((_group, index) => {
        _group.id = index + 1;
        return _group;
      });

    this.saveDraft();
  }

  /**
   * 刪除指定報名組合
   * @param id {number}-指定的報名組合id
   * @author kidin-1101026
   */
  deleteApplyFee(id: number) {
    const imgUploadCache = {};
    this.eventDetail.applyFee = this.eventDetail.applyFee
      .filter((_applyFee) => _applyFee.feeId !== id)
      .map((_applyFee, index) => {
        const oldId = _applyFee.feeId;
        const newId = index + 1;
        _applyFee.feeId = newId;
        const uploadImg = this.imgUpload.applyFee[oldId];
        if (uploadImg) Object.assign(imgUploadCache, { [newId]: uploadImg });
        return _applyFee;
      });

    this.imgUpload.applyFee = imgUploadCache;
    this.saveDraft();
  }

  /**
   * 新增新項目
   * @param type {'group' | 'applyFee'}-欲新增之項目類別
   * @author kidin-1101026
   */
  addNewItem(type: 'group' | 'applyFee') {
    if (type === 'group') {
      const newId = this.eventDetail.group.length + 1;
      this.eventDetail.group.push({
        id: newId,
        name: '',
        gender: Gender.unlimit,
      });
    } else {
      const newId = this.eventDetail.applyFee.length + 1;
      this.eventDetail.applyFee.push({
        feeId: newId,
        title: '',
        fee: 49999,
        haveProduct: HaveProduct.no,
      });
    }

    this.saveDraft();
  }

  /**
   * 待文字編輯器套件加載完成後，顯示於畫面上
   * @author kidin-1101027
   */
  editorOnReady(editor: any) {
    editor.ui
      .getEditableElement()
      .parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());

    // console.log('ckeditor', Array.from(editor.ui.componentFactory.names()));
  }

  /**
   * 關閉圖片選擇器
   * @param e {any}
   * @author kidin-1100812
   */
  closeSelector(e: any) {
    if (e.action === 'complete') {
      const { openImgSelector, imgCurrentEditId } = this.uiFlag;
      const { origin, base64 } = e.img;
      switch (openImgSelector) {
        case AlbumType.eventTheme:
          this.imgUpload.theme.origin = origin;
          this.imgUpload.theme.crop = base64;
          break;
        case AlbumType.eventApplyFee: {
          const targetId = `${imgCurrentEditId}`;
          Object.assign(this.imgUpload.applyFee, {
            [targetId]: {
              origin,
              crop: base64,
            },
          });

          this.uiFlag.imgCurrentEditId = null;
          break;
        }
      }
    }

    this.uiFlag.openImgSelector = null;
  }

  /**
   * 顯示圖片裁切
   */
  selectorThemeImg() {
    this.uiFlag.openImgSelector = AlbumType.eventTheme;
  }

  /**
   * 開啟內文圖片選擇器
   * @param id {number}-指定內容區塊流水號
   * @author kidin-1101028
   */
  selectorContentImg(id: number) {
    this.uiFlag.imgCurrentEditId = id;
    const inputElement = this.imgUploadInput.nativeElement;
    inputElement.click();
  }

  /**
   * 開啟費用方案圖片選擇器
   * @author kidin-1101029
   */
  selectorApplyFeeImg(id: number) {
    this.uiFlag.imgCurrentEditId = id;
    this.uiFlag.openImgSelector = AlbumType.eventApplyFee;
  }

  /**
   * 取消變更佈景圖片
   * @author kidin-1101028
   */
  cancelEditThemeImg() {
    this.imgUpload.theme = {
      origin: null,
      crop: null,
    };
  }

  /**
   * 使用者選擇圖片
   * @param e {Event}
   * @author kidin-1101028
   */
  handleContentImgSelected(e: Event) {
    const img = (e as any).target.files[0];
    if (img) {
      this.getBase64(img)
        .pipe(
          switchMap((e) => {
            const { currentTarget, type } = e;
            if (type === 'load') {
              const { result } = currentTarget as any;
              return checkImgFormat(result);
            } else {
              const message = '載入圖片失敗<br>請重新選擇圖片';
              this.dialog.open(MessageBoxComponent, {
                hasBackdrop: true,
                data: {
                  title: 'Message',
                  body: message,
                  confirmText: '確定',
                },
              });

              return of(e);
            }
          }),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe((base64) => {
          const targetId = `${this.uiFlag.imgCurrentEditId}`;
          Object.assign(this.imgUpload.content, {
            [targetId]: base64,
          });

          this.uiFlag.isSaved = false;
          this.uiFlag.imgCurrentEditId = null;
        });
    }
  }

  /**
   * 變更該組合是否需要出貨（包含商品）的狀態
   * @param e {MouseEvent}
   * @param feeId {number}-該費用組合之id
   * @author kidin-1101115
   */
  changeHaveProductStatus(e: MouseEvent, feeId: number) {
    const index = feeId - 1;
    const { haveProduct } = this.eventDetail.applyFee[index];
    if (haveProduct == HaveProduct.no) {
      this.eventDetail.applyFee[index].haveProduct = HaveProduct.yes;
    } else {
      this.eventDetail.applyFee[index].haveProduct = HaveProduct.no;
    }
  }

  /**
   * 取消變更指定內容圖片
   * @param id {number}-指定內容區塊流水號
   * @author kidin-1101028
   */
  cancelEditContentImg(id: number) {
    const targetId = `${id}`;
    if (Object.prototype.hasOwnProperty.call(this.imgUpload.content, targetId)) {
      delete this.imgUpload.content[targetId];
    }
  }

  /**
   * 取消變更指定費用組合圖片
   * @param id {number}-指定費用組合區塊流水號
   * @author kidin-1101028
   */
  cancelEditApplyFeeImg(id: number) {
    const targetId = `${id}`;
    if (Object.prototype.hasOwnProperty.call(this.imgUpload.applyFee, targetId)) {
      delete this.imgUpload.applyFee[targetId];
    }
  }

  /**
   * 暫存草稿
   * @author kidin-1101029
   */
  saveDraft() {
    this.uiFlag.isSaved = false;
    const draft = {
      eventInfo: this.eventInfo,
      eventDetail: this.eventDetail,
    };

    const eventDraft = JSON.stringify(draft);
    setLocalStorageObject('eventDraft', eventDraft);
  }

  /**
   * 取得base64圖片
   * @param file {Blob}-圖片檔案
   */
  getBase64(file: Blob) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const base64OnLoad = fromEvent(reader, 'load');
    const base64OnError = fromEvent(reader, 'error');
    return merge(base64OnLoad, base64OnError);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
