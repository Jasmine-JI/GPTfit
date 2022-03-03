import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { OfficialActivityService } from '../../services/official-activity.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AlbumType } from '../../../../shared/models/image';
import { ImageUploadService } from '../../../dashboard/services/image-upload.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';

@Component({
  selector: 'app-edit-carousel',
  templateUrl: './edit-carousel.component.html',
  styleUrls: ['./edit-carousel.component.scss']
})
export class EditCarouselComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject;

  /**
   * ui會用到的flag
   */
  uiFlag = {
    progress: 100,
    showImageCropperId: null,
    dragId: null,
    showNewBlock: true,
    passCheck: true
  };

  /**
   * 上傳圖床所需資訊
   */
  imgUpload = <any>{};

  originCarouselList = [];
  carouselList = [];
  token = this.utils.getToken();
  currentTimestamp = this.utils.getCurrentTimestamp('ms');
  defaultEffectTimestamp = this.currentTimestamp + 7 * 86400 * 1000;  // 預設7天後到期
  readonly AlbumType = AlbumType;

  constructor(
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private translateService: TranslateService,
    private router: Router,
    private imageUploadService: ImageUploadService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.getCarousel();
  }

  /**
   * 取得輪播列表
   * @author kidin-1101209
   */
  getCarousel() {
    const { token, officialActivityService: { filterInvalidCarousel } } = this;
    this.officialActivityService.getEventAdvertise({ token }).subscribe(res => {
      if (this.utils.checkRes(res)) {
        this.originCarouselList = res.advertise;
        // 移除時間過期之輪播內容
        this.carouselList = res.advertise
          .filter(_advertise => filterInvalidCarousel(_advertise))
          .map((_advertise, index) => {
            _advertise.advertiseId = index + 1;
            return _advertise;
          });

      }

    });

  }

  /**
   * 確認為新增輪播或編輯輪播
   * @param id {number}-欲更新輪播之編號
   * @param string {any}-欲更新之輪播設定
   * @param value {string | number}-欲更新輪播設定之值
   * @author kidin-1101209
   */
  addCarouselList(
    id: number,
    key: string = null,
    value: string | number = null
  ) {
    this.uiFlag.showNewBlock = false;
    setTimeout(() => {
      const carouselLength = this.carouselList.length;
      if (id > carouselLength) {
        const defaultDate = Math.round(this.defaultEffectTimestamp / 1000);
        this.carouselList.push({
          advertiseId: id,
          link: key === 'link' ? value : null,
          effectDate: key === 'effectDate' ? value : defaultDate
        });

      } else {
        if (key) this.carouselList[id - 1][key] = value;
      }

      // 透過setTimeout讓view先刷新透過ngIf清空input值
      this.uiFlag.showNewBlock = true;
    });
    
  }




  /**
   * 顯示圖片裁切器
   * @param id {number}-指定id
   * @author kidin-1101209
   */
  showImageCropperId(id: number) {
    this.uiFlag.showImageCropperId = id;
  }

  /**
   * 關閉圖片裁切器
   * @param e {any}
   * @author kidin-1101209
   */
  closeImageCropper(e: any) {
    if (e.action === 'complete') {
      const { showImageCropperId } = this.uiFlag;
      const { origin, base64 } = e.img;
      Object.assign(this.imgUpload, {
        [showImageCropperId]: {
          origin,
          crop: base64
        }

      });

      this.addCarouselList(showImageCropperId);
    }

    this.uiFlag.showImageCropperId = null;
  }

  /**
   * 上傳照片至圖床
   * @author kidin-1101209
   */
  uploadImg() {
    let imgArray = [];
    let formData = new FormData();
    formData.set('token', this.token);
    formData.set('targetType', '3');
    formData.set('targetEventId', '0');
    for (let _advertiseId in this.imgUpload) {
      const { crop: newAdvertiseImg } = this.imgUpload[_advertiseId];
      [imgArray, formData] =
        this.appendNewImg(
          imgArray,
          formData,
          AlbumType.advertise,
          newAdvertiseImg,
          +_advertiseId
        );

    }

    formData.set('img', JSON.stringify(imgArray));
    return this.imageUploadService.addImg(formData);
  }
  
  /**
   * 將新圖片加至新增清單(imgArray)與formData中
   * @param imgArray {Array<{ albumType: AlbumType; fileNameFull: string; }>}-新增清單
   * @param formData {any}
   * @param type {AlbumType}-圖片類別
   * @param newImg {string | Blob}-base64圖片或圖片檔案
   * @param id {number}-流水id
   * @author kidin-1101209
   */
  appendNewImg(
    imgArray: Array<{ albumType: AlbumType; fileNameFull: string; id?: number;}>,
    formData: any,
    type: AlbumType,
    newImg: string | Blob,
    id: number = null
  ) {
    const index = imgArray.length;
    const fileName = this.utils.createImgFileName(index, 0);
    const fileNameFull = `${fileName}.jpg`;
    const newFile = this.utils.base64ToFile(newImg as string, fileName);
    imgArray.push({
      albumType: type,
      fileNameFull: fileNameFull,
      id
    });

    formData.append('file', newFile);
    return [imgArray, formData];
  }

  /**
   * 輸入連結
   * @param e {MouseEvent}
   * @param id {number}-欲更新輪播之編號
   * @author kidin-1101209
   */
  handleLinkInput(e: MouseEvent, id: number) {
    const { value } = (e as any).target;
    if (value) this.addCarouselList(id, 'link',  value);
  }

  /**
   * 取得所選時間
   * @param e {Event}
   * @param id {number}-欲更新輪播之編號
   * @author kidin-1101209
   */
  getSelectTime(e: Event, id: number) {
    const selectTime = (e as any).target.value;
    const selectTimestamp = Math.round((new Date(selectTime)).getTime() / 1000);
    this.addCarouselList(id, 'effectDate',  selectTimestamp);
  }

  /**
   * 移除指定id之輪播
   * @param id {number}-指定id
   * @author kidin-1101209
   */
  deleteCarousel(id: number) {
    const delIndex = id - 1;
    this.carouselList.splice(delIndex, 1);
    this.reArrangeList();
  }

  /**
   * 取消編輯輪播
   * @author kidin-1101209
   */
  cancelEdit() {
    this.navigateHomePage();
  }

  /**
   * 儲存輪播
   * @author kidin-1101209
   */
  saveEdit() {
    this.uiFlag.passCheck = this.checkCarousel();
    const { passCheck, progress } = this.uiFlag;
    if (passCheck && progress === 100) {
      this.uiFlag.progress = 30;
      const { token } = this;
      let advertise = this.utils.deepCopy(this.carouselList);
      advertise = advertise.concat(this.getInvalidList());
      const body = { token, advertise };
      combineLatest([
        this.officialActivityService.updateEventAdvertise(body),
        this.translateService.get('hellow world')  // 確保多國語系載入完成
      ]).pipe(
        switchMap(result => {
          const updateResult = result[0];
          const imgChange = Object.keys(this.imgUpload).length > 0;
          if (imgChange) {
            if (this.utils.checkRes(updateResult)) {
              return this.uploadImg();
            } else {
              return of(updateResult);
            }

          } else {
            return of(updateResult);
          }
          
        })
      ).subscribe(res => {
        if (this.utils.checkRes(res)) {
          const currentTimeStamp = this.utils.getCurrentTimestamp('ms');
          this.officialActivityService.setCarouselTime(currentTimeStamp);
          const msg = this.translateService.instant('universal_status_updateCompleted');
          this.utils.showSnackBar(msg);
          this.navigateHomePage();
        } else {
          const msg = this.translateService.instant('universal_popUpMessage_updateFailed');
          this.utils.showSnackBar(msg);
        }

        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 確認新增的輪播是否皆有圖片
   * @author kidin-1101228
   */
  checkCarousel() {
    for (let i = 0; i < this.carouselList.length; i++) {
      const _list = this.carouselList[i];
      const { advertiseId, img } = _list;
      if (!img && !this.imgUpload[advertiseId]) {
        return false;
      }

    }

    return true;
  }

  /**
   * 將編輯後之輪播列表與舊輪播長度比對後，將多餘的輪播其有效時間改為現在時間使其失效
   * @author kidin-1101213
   */
  getInvalidList() {
    const currentLength = this.carouselList.length;
    const originLength = this.originCarouselList.length;
    if (currentLength < originLength) {
      const delList = this.originCarouselList
        .splice(currentLength, originLength - currentLength)
        .map((_delList, index) => {
          _delList = {
            advertiseId: currentLength + index + 1,
            img: null,
            link: null,
            effectDate: Math.round(this.currentTimestamp / 1000)
          };

          return _delList;
        });
      
      return delList;
    } else {
      return [];
    }

  }

  /**
   * 導回官方活動首頁
   * @author kidin-1101209
   */
  navigateHomePage() {
    this.router.navigateByUrl('/official-activity/activity-list');
  }

  /**
   * 變更輪播排序
   * @param id {number}-內容序列
   * @param direction {'up' | 'down'}-目標移動方向
   * @author kidin-1101222
   */
  shiftCarousel(id: number, direction: 'up' | 'down') {
    const idx = id - 1;
    const switchIndex = idx + (direction === 'up' ? -1 : 1);
    [this.carouselList[idx], this.carouselList[switchIndex]] = [this.carouselList[switchIndex], this.carouselList[idx]];
    this.reArrangeList();
  }

  /**
   * 根據輪播順序重新編排id與圖片上傳id
   * @author kidin-1101224
   */
  reArrangeList() {
    const imgUpload = {};
    this.carouselList = this.carouselList.map((_list, index) => {
      const oldId = _list.advertiseId;
      const newId = index + 1;
      _list.advertiseId = newId;
      const uploadImg = this.imgUpload[oldId];
      if (uploadImg) Object.assign(imgUpload, { [newId]: uploadImg });
      return _list;
    });

    this.imgUpload = imgUpload;
  }

  /**
   * 取消事件預設動作與冒泡
   * @author kidin-1101213
   */
  cancelDefault(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete;
  }

}
