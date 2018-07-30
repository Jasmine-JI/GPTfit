import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InnerSelectorWinComponent } from '../inner-selector-win/inner-selector-win.component';

@Component({
  selector: 'app-inner-settings',
  templateUrl: './inner-settings.component.html',
  styleUrls: ['./inner-settings.component.css']
})
export class InnerSettingsComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }
  openSelectorWin(_type: number) {
    let targetAdminName = '';
    if (_type === 1) {
      targetAdminName = '系統開發員(10)';
    } else if (_type === 2) {
      targetAdminName = '系統維護員(20)';
    } else {
      targetAdminName = '行銷與企劃員(29)';
    }
    this.dialog.open(InnerSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `${targetAdminName}選擇設定`,
        body: `嘿`
      }
    });
  }
}
