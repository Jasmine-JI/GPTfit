import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-hr-zone-dialog',
  templateUrl: './hr-zone-dialog.component.html',
  styleUrls: ['./hr-zone-dialog.component.css']
})
export class HrZoneDialogComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService
  ) {}

  get userId() {
    return this.data.userId;
  }
  get zones() {
    return this.data.zones;
  }
  get methodName() {
    if (this.data.method === 1) {
      return `${this.translate.instant('universal_userProfile_maximalHeartRate')}%(%MHR)`;
    }
    return `${this.translate.instant('universal_userProfile_maximalHeartRate')}%(%HRR)`;
  }

  ngOnInit() {}
}
