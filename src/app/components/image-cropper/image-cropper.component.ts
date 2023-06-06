import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  OnChanges,
  ElementRef,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ImageCroppedEvent, ImageCropperComponent, ImageCropperModule } from 'ngx-image-cropper';
import { Subject } from 'rxjs';
import { HintDialogService } from '../../core/services';
import { AlbumType } from '../../core/enums/api';
import { advertiseRatio } from '../../containers/official-activity/models/official-activity-const';
import { CropperResult } from '../../core/models/compo';

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, ImageCropperModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImgCropperComponent implements OnInit, OnDestroy, OnChanges {
  @Input() imgInputEvent: any;
  @Input() albumType: AlbumType = AlbumType.personalIcon; // 參考api 8001的albumType
  @Output() closeSelector = new EventEmitter();
  @ViewChild('imgUpload', { static: false }) imgUpload: ElementRef;
  @ViewChild(ImageCropperComponent, { static: false }) imageCropper: ImageCropperComponent;

  private ngUnsubscribe = new Subject();

  /**
   * ui上會用到的各個flag
   */
  uiFlag = {
    isImgUpLoading: false,
    imgCropping: false,
    selectedImg: false,
  };

  /**
   * imagecropping要用到的各種設定
   */
  imageCropSetting = {
    imageChangedEvent: <any>null, // 設null可初始化變更事件
    aspectRatio: <number>1, // 圖片比例
    roundCropper: false,
    canvasRotation: 0,
    flipH: false,
    flipV: false,
  };

  /**
   * 裁切結果
   */
  result: CropperResult = {
    action: <'close' | 'complete' | null>null,
    img: {
      albumType: this.albumType,
      base64: null,
      origin: null,
    },
  };

  constructor(private hintDialogService: HintDialogService) {}

  ngOnInit(): void {}

  /**
   * 根據圖片類型設定圖片裁切形狀和比例
   */
  ngOnChanges() {
    this.result.img.albumType = this.albumType;
    switch (this.albumType) {
      case AlbumType.personalIcon:
      case AlbumType.groupIcon:
        this.imageCropSetting.aspectRatio = 1;
        this.imageCropSetting.roundCropper = true;
        break;
      case AlbumType.personalScenery:
      case AlbumType.groupScenery:
        this.imageCropSetting.aspectRatio = 3;
        this.imageCropSetting.roundCropper = false;
        break;
      case AlbumType.eventApplyFee:
        this.imageCropSetting.aspectRatio = 1;
        this.imageCropSetting.roundCropper = false;
        break;
      case AlbumType.advertise:
        this.imageCropSetting.aspectRatio = advertiseRatio;
        this.imageCropSetting.roundCropper = false;
        break;
      default:
        this.imageCropSetting.aspectRatio = 1.75;
        this.imageCropSetting.roundCropper = false;
        break;
    }

    if (this.imgInputEvent !== null) {
      this.handleImgSelected(this.imgInputEvent);
    }
  }

  /**
   * 開啟圖片選擇器
   */
  selectorImg() {
    const imgInput = this.imgUpload.nativeElement;
    imgInput.click();
  }

  /**
   * 關閉圖片選擇器
   */
  closeImgSelector() {
    this.result.action = 'close';
    this.closeSelector.emit(this.result);
  }

  /**
   * 處理使用者選擇照片
   */
  handleImgSelected(e: any) {
    this.uiFlag.isImgUpLoading = true;
    this.uiFlag.selectedImg = true;
    this.result.img.origin = e; // 將事件儲存起來讓使用者可再次編輯
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
  loadImageFailed() {
    this.hintDialogService.openAlert('Image format error! Please try again');
  }

  /**
   * 逆時針旋轉90度
   */
  rotateLeft() {
    this.imageCropSetting.canvasRotation--;
    this.flipAfterRotate();
  }

  /**
   * 順時針旋轉90度
   */
  rotateRight() {
    this.imageCropSetting.canvasRotation++;
    this.flipAfterRotate();
  }

  /**
   * 圖片選轉時，垂直與水平翻轉 flag要交換
   */
  flipAfterRotate() {
    const { flipH, flipV } = this.imageCropSetting;
    this.imageCropSetting = {
      ...this.imageCropSetting,
      flipH: flipV,
      flipV: flipH,
    };
  }

  /**
   * 水平翻轉
   */
  flipHorizontal() {
    const { flipH } = this.imageCropSetting;
    this.imageCropSetting.flipH = !flipH;
  }

  /**
   * 垂直翻轉
   */
  flipVertical() {
    const { flipV } = this.imageCropSetting;
    this.imageCropSetting.flipV = !flipV;
  }

  /**
   * 完成裁切
   */
  finishCrop() {
    this.result.action = this.uiFlag.selectedImg ? 'complete' : 'close';
    this.closeSelector.emit(this.result);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
