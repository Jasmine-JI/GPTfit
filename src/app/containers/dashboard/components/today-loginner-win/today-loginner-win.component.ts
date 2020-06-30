import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { EventEnrollService } from '../../services/event-enroll.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-today-loginner-win',
  templateUrl: './today-loginner-win.component.html',
  styleUrls: ['./today-loginner-win.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TodayLoginnerWinComponent implements OnInit {
  logonlist: any;
  collectLists = [];
  get chooseLists() {
    return this.data.chooseLists || [];
  }
  constructor(
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private eventEnrollService: EventEnrollService
  ) {}

  ngOnInit() {
    this.eventEnrollService
      .getTodayLoginList()
      .subscribe(res => {
        this.logonlist = res;
        this.logonlist = this.logonlist.filter(_list => {
          const idx = this.chooseLists.findIndex(
            item => item.userId === _list.userId
          );
          if (idx === -1) {
            return _list;
          }
        });
      });
  }
  handleChooseLists(item) {
    const idx = this.collectLists.findIndex(
      _list => _list.userId === item.userId
    );
    if (idx > -1) {
      this.collectLists.splice(idx, 1);
    } else {
      this.collectLists.push(item);
    }
  }
  confirm() {
    this.data.onConfirm(this.collectLists);
    this.dialog.closeAll();
  }
}
