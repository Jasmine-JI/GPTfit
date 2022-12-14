import { Component, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import { Router } from '@angular/router';
import { getUrlQueryStrings } from '../../../../core/utils/index';

@Component({
  selector: 'app-inner-device-pair',
  templateUrl: './inner-device-pair.component.html',
  styleUrls: ['./inner-device-pair.component.scss'],
})
export class InnerDevicePairComponent implements OnInit {
  targetUserId: number;
  targetUserName: string;
  deviceSN: string;

  constructor(public dialog: MatDialog, private router: Router) {}

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
        type: 1,
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: true,
      },
    });
  }

  handleConfirm(type, _lists) {
    const { userId, userName } = _lists[0];
    this.targetUserName = userName;
    this.targetUserId = userId;
    this.router.navigateByUrl(`${location.pathname}?targetUserId=${this.targetUserId}`);
  }

  watchDeviceSNDetail() {
    this.deviceSN = this.deviceSN.toUpperCase();
    this.router.navigateByUrl(`/dashboard/system/device/info/${this.deviceSN}`);
  }
}
