import { Component, OnInit, Inject } from '@angular/core';
import { MessageBoxComponent } from '../message-box/message-box.component';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../../core/services';
import { Router } from '@angular/router';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
})
export class BottomSheetComponent implements OnInit {
  title: string;
  confirmText: string;
  cancelText: string;
  text: string;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private hashIdService: HashIdService,
    @Inject(MAT_BOTTOM_SHEET_DATA) private data: any
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });

    this.getAndInitTranslations();
  }

  get groupId() {
    return this.data.groupId;
  }

  /**
   * 待翻譯套件載入完成再產生翻譯
   * @author kidin-1091105
   */
  getAndInitTranslations() {
    this.translate
      .get([
        'universal_group_disclaimer',
        'universal_operating_agree',
        'universal_operating_disagree',
        'universal_group_createClassStatement',
      ])
      .subscribe((translation) => {
        this.title = translation['universal_group_disclaimer'];
        this.confirmText = translation['universal_operating_agree'];
        this.cancelText = translation['universal_operating_disagree'];
        this.text = translation['universal_group_createClassStatement'];
      });
  }

  /**
   * 使用者點選之後導至該新建群組頁面
   * @param event {MouseEvent}
   * @param type {string}-使用者點選的類別
   * @author kidin-1091105
   */
  openLink(e: MouseEvent, type: string): void {
    this.bottomSheetRef.dismiss();
    if (type !== 'cancel') {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: this.title,
          body: this.text,
          confirmText: this.confirmText,
          cancelText: this.cancelText,
          onConfirm: () => {
            this.router.navigateByUrl(
              `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
                this.groupId
              )}/group-introduction?createType=${type}`
            );
          },
        },
      });
    }
  }
}
