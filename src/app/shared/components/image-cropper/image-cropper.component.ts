import {
    Component,
    OnInit,
    Output,
    EventEmitter,
    Input,
    ViewChild,
    OnChanges,
    ElementRef,
    OnDestroy
} from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from '../../services/utils.service';
import { AlbumType } from '../../models/image';
import { advertiseRatio } from '../../../containers/official-activity/models/official-activity-const';

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss']
})
export class ImgCropperComponent implements OnInit, OnDestroy, OnChanges {

  @Input() imgInputEvent: any;
  @Input() albumType: AlbumType = 1;  // 參考api 8001的albumType
  @Output() closeSelector = new EventEmitter();
  @ViewChild('imgUpload', {static: false}) imgUpload: ElementRef;
  @ViewChild(ImageCropperComponent, {static: false}) imageCropper: ImageCropperComponent;

  private ngUnsubscribe = new Subject();

  /**
   * ui上會用到的各個flag
   */
  uiFlag = {
    isImgUpLoading: false,
    imgCropping: false,
    selectedImg: false
  };

  /**
   * imagecropping要用到的各種設定
   */
  imageCropSetting = {
    imageChangedEvent: <any>null,  // 設null可初始化變更事件
    aspectRatio: <number>1,  // 圖片比例
    roundCropper: false,
    maintainAspectRatio: true
  };

  /**
   * 裁切結果
   */
  result = {
    action: <'close' | 'complete' | null>null,
    img: {
      albumType: this.albumType,
      base64: null,
      origin: null
    }
  };
  

  constructor(
    private utils: UtilsService
  ) { }

  ngOnInit(): void {
  }

  /**
   * 根據圖片類型設定圖片裁切形狀和比例
   * @author kidin-1091125
   */
  ngOnChanges() {
    this.result.img.albumType = this.albumType;
    switch (this.albumType) {
      case AlbumType.personalIcon:
      case AlbumType.groupIcon:
        this.imageCropSetting.aspectRatio = 1;
        this.imageCropSetting.roundCropper = true;
        this.imageCropSetting.maintainAspectRatio = true;
        break;
      case AlbumType.personalScenery:
      case AlbumType.groupScenery:
        this.imageCropSetting.aspectRatio = 3;
        this.imageCropSetting.roundCropper = false;
        this.imageCropSetting.maintainAspectRatio = true;
        break;
      case AlbumType.eventApplyFee:
        this.imageCropSetting.aspectRatio = 1;
        this.imageCropSetting.roundCropper = false;
        this.imageCropSetting.maintainAspectRatio = true;
        break;
      case AlbumType.advertise:
        this.imageCropSetting.aspectRatio = advertiseRatio;
        this.imageCropSetting.roundCropper = false;
        this.imageCropSetting.maintainAspectRatio = true;
        break;
      default:
        this.imageCropSetting.aspectRatio = 1.75;
        this.imageCropSetting.roundCropper = false;
        this.imageCropSetting.maintainAspectRatio = true;
        break;
    }

    if (this.imgInputEvent !== null) {
      this.handleImgSelected(this.imgInputEvent);
    }

  }

  /**
   * 開啟圖片選擇器
   * @author kidin-1091124
   */
  selectorImg() {
    const imgInput = this.imgUpload.nativeElement;
    imgInput.click();
  }

  /**
   * 關閉圖片選擇器
   * @author kidin-1091123
   */
  closeImgSelector() {
    this.result.action = 'close';
    this.closeSelector.emit(this.result);
  }

  /**
   * 處理使用者選擇照片
   * @author kidin-1091124
   */
  handleImgSelected(e: any) {
    this.uiFlag.isImgUpLoading = true;
    this.uiFlag.selectedImg = true;
    this.result.img.origin = e;  // 將事件儲存起來讓使用者可再次編輯
    this.imageCropSetting.imageChangedEvent = e;
  }

  // 裁切後的base64圖片-kidin-1090109
  imageCropped(e: ImageCroppedEvent) {
    this.result.img.base64 = e.base64;
  }

  /**
   * 裁切套件將圖片載入完成的狀態
   */
  imageLoaded() {
    console.info('Image loaded');
  }

  /**
   * 裁切套件將圖片載入完成且可裁切的狀態
   */
  cropperReady() {
    this.uiFlag.isImgUpLoading = false;
  }
  
  /**
   * 圖片載入失敗
   */
  loadImageFailed () {
    this.utils.openAlert('Image format error! Please try again');
  }

  /**
   * 逆時針旋轉90度
   * @author kidin-1091124
   */
  rotateLeft() {
    this.imageCropper.rotateLeft();
  }

  /**
   * 順時針旋轉90度
   * @author kidin-1091124
   */
  rotateRight() {
    this.imageCropper.rotateRight();
  }

  /**
   * 水平翻轉
   * @author kidin-1091124
   */
  flipHorizontal() {
    this.imageCropper.flipHorizontal();
  }

  /**
   * 垂直翻轉
   * @author kidin-1091124
   */
  flipVertical() {
    this.imageCropper.flipVertical();
  }

  /**
   * 完成裁切
   * @author kidin-1091125
   */
  finishCrop() {
    this.result.action = this.uiFlag.selectedImg ? 'complete' : 'close';
    this.closeSelector.emit(this.result);
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1091124
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
