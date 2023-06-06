import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  HostListener,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
})
export class UploadFileComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isUserAvastarMode: false;
  @Input() accept: string;
  @Input() isImageFileMode = false;
  @Input() imageURL: string;

  fileInformation: any;
  isImgVertical$ = new BehaviorSubject<boolean>(false);
  isUploadNewImg$ = new BehaviorSubject<boolean>(false);
  errorMsg: string;

  // 裁切圖片所需變數-kidin-1090109
  imageChangedEvent: any = '';
  croppedImage: any = '';
  imgSelected = false;
  imgCropping = false;
  isImgUpLoading = false;
  canvasRotation = 0;
  flipH = false;
  flipV = false;

  @Output() onChange = new EventEmitter();
  @ViewChild('fileUpload', { static: false })
  set lookUp(ref: any) {
    ref.nativeElement.value = null;
  }

  // 拖曳經過時無任何事件
  @HostListener('dragover', ['$event'])
  public onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // 禁止拖曳出去
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // 拖曳照片至定點放開後觸發圖片裁切功能
  @HostListener('drop', ['$event'])
  public onDrop(evt) {
    this.handleChange(evt);
  }

  @ViewChild(ImageCropperComponent, { static: false })
  imageCropper: ImageCropperComponent;

  constructor(private translate: TranslateService) {}

  ngOnInit() {}

  // 監測是否有選擇新圖片
  ngOnChanges(changes: SimpleChanges) {}

  handleBtnEvent() {
    const inputSection = document.getElementById('inputFile');
    inputSection.click();
  }

  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    if (width < height) {
      this.isImgVertical$.next(true);
    } else {
      this.isImgVertical$.next(false);
    }
  }

  handleChange(event) {
    const files = event.target.files;
    const acceptFileArray = this.accept;
    if (files.length > 0) {
      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        const fileName = files[0].name.split('.');
        const fileType = fileName[fileName.length - 1];
        this.fileInformation = {
          value: files[0] || null,
          link: fileReader.result || '',
          isTypeCorrect: false,
        };
        if (acceptFileArray.indexOf(fileType.toUpperCase()) > -1) {
          this.fileInformation.isTypeCorrect = true;
        }
        if (this.fileInformation.isTypeCorrect) {
          this.imgCropping = true;
          this.imgSelected = true;
          this.fileChangeEvent(event);

          this.isUploadNewImg$.next(true);
        } else {
          this.handleErrorMsg();
          this.fileInformation.link = null;
          this.isUploadNewImg$.next(false);
        }
        return this.onChange.emit(this.fileInformation);
      };
      fileReader.readAsDataURL(files[0]);
    }
  }

  handleErrorMsg() {
    const { isTypeCorrect } = this.fileInformation;
    if (!isTypeCorrect) {
      this.fileInformation.errorMsg = this.translate.instant('universal_status_photoRestriction');
    }
  }

  // 關閉裁切功能-kidin-1090109
  closeImgCropping() {
    this.imgCropping = false;
  }

  // 裁切圖片功能-kidin-1090109
  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  // 裁切後的base64圖片-kidin-1090109
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    this.fileInformation.link = event.base64;
    return this.onChange.emit(this.fileInformation);
  }

  imageLoaded() {
    this.isImgUpLoading = true;
  }
  cropperReady() {
    this.isImgUpLoading = false;
  }
  loadImageFailed() {
    console.error('Load failed');
  }

  /**
   * 逆時針旋轉90度
   */
  rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  /**
   * 順時針旋轉90度
   */
  rotateRight() {
    this.canvasRotation++;
    this.flipAfterRotate();
  }

  /**
   * 圖片選轉時，垂直與水平翻轉 flag要交換
   */
  flipAfterRotate() {
    const { flipH, flipV } = this;
    this.flipH = flipV;
    this.flipV = flipH;
  }

  /**
   * 水平翻轉
   */
  flipHorizontal() {
    this.flipH = !this.flipH;
  }

  /**
   * 垂直翻轉
   */
  flipVertical() {
    this.flipV = !this.flipV;
  }

  reEditImg() {
    this.imgCropping = true;
  }

  ngOnDestroy() {}
}
