import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-hr-zone-dialog',
  templateUrl: './hr-zone-dialog.component.html',
  styleUrls: ['./hr-zone-dialog.component.css']
})
export class HrZoneDialogComponent implements OnInit {
  get userId() {
    return this.data.userId;
  }
  get zones() {
    return this.data.zones;
  }
  get methodName() {
    if (this.data.method === 1) {
      return '最大心率法%(%MHR)';
    }
    return '儲備心率法%(%HRR)';
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {}
}
