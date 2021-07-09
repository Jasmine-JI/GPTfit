import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { Router } from '@angular/router';
import { UtilsService } from '../../../../shared/services/utils.service';

@Component({
  selector: 'app-inner-device-pair',
  templateUrl: './inner-device-pair.component.html',
  styleUrls: ['./inner-device-pair.component.scss']
})
export class InnerDevicePairComponent implements OnInit {
  targetUserId: number;
  deviceSN: string;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private utils: UtilsService
  ) {}
  
  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    this.targetUserId = queryStrings.targetUserId;
  }
  openSelectorWin(e) {
    const adminLists = [];
    e.preventDefault();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `人員選擇`,
        adminLists,
        type: 1,
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: true
      }
    });
  }
  handleConfirm(type, _lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.targetUserId = userIds[0];
    this.router.navigateByUrl(
      `${location.pathname}?targetUserId=${this.targetUserId}`
    );
  }
  watchDeviceSNDetail() {
    this.deviceSN = this.deviceSN.toUpperCase();
    this.router.navigateByUrl(
      `/dashboard/system/device/info/${this.deviceSN}`
    );
  }
}
