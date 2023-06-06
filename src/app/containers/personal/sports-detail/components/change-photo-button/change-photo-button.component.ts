import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, UserService, Api80xxService } from '../../../../../core/services';
import { SportsDetailService } from '../../sports-detail.service';
import { AlbumType, PhotoTargetType } from '../../../../../core/enums/api';
import { ImgCropperComponent, LoadingMaskComponent } from '../../../../../components';
import dayjs from 'dayjs';
import { v5 as uuidv5 } from 'uuid';
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { CropperResult } from '../../../../../core/models/compo';
import { base64ToFile } from '../../../../../core/utils';
import { Api8001Post, Api8001Response, Api8002Post } from '../../../../../core/models/api/api-80xx';

@Component({
  selector: 'app-change-photo-button',
  standalone: true,
  imports: [CommonModule, TranslateModule, ImgCropperComponent, LoadingMaskComponent],
  templateUrl: './change-photo-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './change-photo-button.component.scss'],
})
export class ChangePhotoButtonComponent {
  /**
   * 運動檔案流水編號
   */
  @Input() fileId: number;

  /**
   * 運動檔案佈景圖位址
   */
  @Input() photo: string;

  /**
   * 向父組件傳遞檔案名稱更新
   */
  @Output() changePhoto = new EventEmitter<string>();

  /**
   * 顯示編輯視窗與否
   */
  displayEditBox = false;

  /**
   * 是否正在讀取中
   */
  isLoading = false;

  readonly AlbumType = AlbumType;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private sportsDetailService: SportsDetailService,
    private api80xxService: Api80xxService,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * 顯示編輯視窗
   */
  showEditBox() {
    this.displayEditBox = true;
  }

  /**
   * 照片裁切完畢並上傳檔案
   * @param e 照片裁切後結果
   */
  closeSelector(e: CropperResult) {
    if (e.action !== 'complete') return this.closeEditBox();

    this.isLoading = true;
    this.getUploadFormData(e)
      .pipe(
        switchMap((formData) => this.deletePreviousPhoto(formData)),
        switchMap((formData) => this.uploadPhoto(formData))
      )
      .subscribe({
        next: (result) => this.handleUploadSuccess(result),
        error: () => this.handleUploadFailed(),
      });
  }

  /**
   * 上傳圖片
   * @param e 照片裁切後結果
   */
  getUploadFormData(e: CropperResult) {
    const { base64 } = e.img;
    const formData = new FormData();
    const { userId } = this.userService.getUser();
    const fileName = this.createFileName(0, userId);
    const imgArr = [
      {
        albumType: AlbumType.personalSportFile,
        fileNameFull: `${fileName}.jpg`,
        activityFileId: this.fileId,
      },
    ];
    formData.set('token', this.authService.token);
    formData.set('targetType', `${PhotoTargetType.perosnal}`);
    formData.append('file', base64ToFile(base64, fileName));
    formData.set('img', JSON.stringify(imgArr));
    return of(formData);
  }

  /**
   * 若使用者有上傳過照片，則需先刪除再上傳
   * @param formData api 8001 post form data
   */
  deletePreviousPhoto(formData: Api8001Post) {
    const { haveFileSenery } = this.sportsDetailService;
    if (!haveFileSenery) return of(formData);
    const { fileId, photo } = this;
    const body: Api8002Post = {
      token: this.authService.token,
      targetType: PhotoTargetType.perosnal,
      img: [
        {
          albumType: AlbumType.personalSportFile,
          activityFileId: fileId,
          fileNameFull: this.getPhotoName(photo),
        },
      ],
    };

    return this.api80xxService.fetchDeleteimg(body).pipe(map(() => formData));
  }

  /**
   * 若使用者有上傳過照片，則需先刪除再上傳
   * @param formData api 8001 post form data
   */
  uploadPhoto(formData: Api8001Post) {
    return this.api80xxService.fetchAddimg(formData);
  }

  /**
   * 關閉照片選擇視窗
   */
  closeEditBox() {
    this.displayEditBox = false;
  }

  /**
   * 處理上傳運動檔案佈景成功
   */
  handleUploadSuccess(result: Api8001Response) {
    this.isLoading = false;
    const { url } = result.img[0];
    const normalSizeUrl = url.replace('_128', '');
    this.changePhoto.emit(normalSizeUrl);
    const msg = 'universal_popUpMessage_uploadSuccess';
    this.showSnackBarMsg(msg);
    this.closeEditBox();
  }

  /**
   * 處理上傳運動檔案佈景失敗
   */
  handleUploadFailed() {
    this.isLoading = false;
    const msg = 'universal_popUpMessage_uploadFailed';
    this.showSnackBarMsg(msg);
  }

  /**
   * 顯示上傳運動檔案資訊
   * @param msg 訊息的翻譯鍵名
   */
  showSnackBarMsg(msgKey: string) {
    const msg = this.translate.instant(msgKey);
    this.snackBar.open(msg, 'OK', { duration: 1000 });
  }

  /**
   * 建立圖片名稱
   * @param length {number}-檔案索引
   * @param userId {string}-使用者id
   */
  createFileName(length: number, userId: number) {
    const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL);
    const keyword = `${dayjs().valueOf().toString()}${length}${userId}`;
    return uuidv5(keyword, nameSpace);
  }

  /**
   * 從url中取得file name
   * @param url {string}
   * @author kidin-1100817
   */
  getPhotoName(url: string) {
    const pathArr = url.split('/');
    return pathArr[pathArr.length - 1];
  }
}
