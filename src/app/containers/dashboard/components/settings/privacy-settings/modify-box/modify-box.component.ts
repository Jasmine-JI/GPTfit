import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-modify-box',
  templateUrl: './modify-box.component.html',
  styleUrls: ['./modify-box.component.scss']
})
export class ModifyBoxComponent implements OnInit {

  type: string;
  title: string;
  dateRange = 'all';
  openObj = '';

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { }

  ngOnInit() {
    let target;
    switch (this.data.type) {
      case 'sportsFile':
        target = `${this.translate.instant('other.eventArchive')}`;
        this.title = `${this.translate.instant('other.batchEditPrivacy', {object: target})}`;
        break;
      case 'sportsReport':
        target = `${this.translate.instant('other.sportsStatistics')}`;
        this.title = `${this.translate.instant('other.batchEditPrivacy', {object: target})}`;
        break;
      case 'lifeTrackingReport':
        target = `${this.translate.instant('other.lifeStatistics')}`;
        this.title = `${this.translate.instant('other.batchEditPrivacy', {object: target})}`;
        break;
    }


  }

  handleConfirm () {

    this.dialog.closeAll();
  }

  handleCancel () {

    this.dialog.closeAll();
  }

  // 選擇修改的日期類型-kidin-1090327
  selectDateRange (range) {
    this.dateRange = range;
  }

  // 選擇開放隱私權的對象-kidin-1090327
  selectModifyRange (obj) {
    if (obj === this.openObj) {
      this.openObj = '';
    } else {
      this.openObj = obj;
    }
  }

}
