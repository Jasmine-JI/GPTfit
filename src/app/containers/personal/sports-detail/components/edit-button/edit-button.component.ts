import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EditActivityProfile } from '../../../../../core/models/form';
import { SymbolsValidator } from '../../../../../core/utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, Api21xxService } from '../../../../../core/services';
import { Api2108Post } from '../../../../../core/models/api/api-21xx';
import { LoadingMaskComponent } from '../../../../../components';

@Component({
  selector: 'app-edit-button',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, LoadingMaskComponent],
  templateUrl: './edit-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './edit-button.component.scss'],
})
export class EditButtonComponent implements OnChanges {
  /**
   * 舊有檔案名稱
   */
  @Input() fileName = '';

  /**
   * 運動檔案id
   */
  @Input() fileId: number;

  /**
   * 向父組件傳遞檔案名稱更新
   */
  @Output() changeFileName = new EventEmitter<string>();

  /**
   * 顯示編輯表單視窗與否
   */
  displayEditBox = false;

  /**
   * 編輯檔案表單
   */
  formGroup: FormGroup;

  /**
   * api 是否正在傳送中
   */
  isLoading = false;

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService: AuthService,
    private api21xxService: Api21xxService
  ) {}

  ngOnChanges(): void {
    this.createForm();
  }

  /**
   * 建立驗證表單
   */
  createForm() {
    const nameReg = /^[^$%\\]+$/;
    this.formGroup = new FormGroup<EditActivityProfile>({
      dispName: new FormControl(this.fileName, [
        Validators.required,
        Validators.maxLength(24),
        SymbolsValidator(nameReg),
      ]),
    });
  }

  /**
   * 顯示編輯視窗
   */
  showEditBox() {
    this.displayEditBox = true;
  }

  /**
   * 取消編輯檔案名稱
   */
  cancelEdit() {
    this.displayEditBox = false;
    this.formGroup.patchValue({ dispName: this.fileName });
  }

  /**
   * 送出新檔案名稱
   */
  submit() {
    const { errors, value: dispName } = this.formGroup.controls.dispName;
    if (!errors) {
      const { token } = this.authService;
      const body: Api2108Post = {
        token,
        fileId: this.fileId,
        fileInfo: {
          dispName,
        },
      };

      this.isLoading = true;
      this.api21xxService.fetchEditActivityProfile(body).subscribe({
        next: () => this.handleEditSuccess(dispName),
        error: () => this.handleEditFailed(),
      });
    }
  }

  /**
   * 處理編輯檔案名稱成功
   * @param name 檔案名稱
   */
  handleEditSuccess(name: string) {
    this.changeFileName.emit(name);
    this.displayEditBox = false;
    this.showEditResultMsg('universal_status_updateCompleted');
    this.isLoading = false;
  }

  /**
   * 處理編輯檔案名稱失敗
   * @param name 檔案名稱
   */
  handleEditFailed() {
    this.showEditResultMsg('universal_popUpMessage_updateFailed');
    this.isLoading = false;
  }

  /**
   * 顯示編輯結果訊息
   * @param msgKey 訊息翻譯鍵名
   */
  showEditResultMsg(msgKey: string) {
    const msg = this.translate.instant(msgKey);
    this.snackBar.open(msg, 'OK', { duration: 1000 });
  }
}
