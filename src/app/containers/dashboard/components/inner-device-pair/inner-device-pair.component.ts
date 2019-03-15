import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { Router } from '@angular/router';
import { getUrlQueryStrings } from '@shared/utils/';

@Component({
  selector: 'app-inner-device-pair',
  templateUrl: './inner-device-pair.component.html',
  styleUrls: ['./inner-device-pair.component.scss']
})
export class InnerDevicePairComponent implements OnInit {
  constructor(public dialog: MatDialog, private router: Router) {}
  targetUserId: number;
  deviceSN: string;
  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
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
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: true
      }
    });
  }
  handleConfirm(_lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.targetUserId = userIds[0];
    this.router.navigateByUrl(
      `${location.pathname}?targetUserId=${this.targetUserId}`
    );
  }
  watchDeviceSNDetail() {
    this.router.navigateByUrl(
      `/dashboard/system/device/info/${this.deviceSN}`
    );
  }
}
