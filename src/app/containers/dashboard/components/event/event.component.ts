import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  events: any;
  isLoading = false;
  constructor(
    private router: Router,
    private eventInfoService: EventInfoService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const params = new HttpParams();
    this.isLoading = true;
    this.eventInfoService.fetchEventInfo(params).subscribe(results => {
      this.isLoading = false;
      this.events = results.filter((value, idx, self) => {
        return (
          self.findIndex(_self => _self.event_id === value.event_id) === idx
        );
      });
    });
  }
  toCreatePage() {
    this.router.navigateByUrl('/dashboard/system/event/create');
  }
  remove(id, idx) {
    const removeDialogRef = this.dialog.open(MsgDialogComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: this.translate.instant('universal_popUpMessage_confirmDelete')
      }
    });
    removeDialogRef.componentInstance.onConfirm.subscribe(() => {
      this.eventInfoService.removeEvent(id).subscribe(results => {
        this.events.splice(idx, 1);
      },
      err => {
        this.dialog.open(MsgDialogComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: this.translate.instant('universal_popUpMessage_error')
          }
        });
      });
    });
  }
  toEdit(id) {
    this.router.navigateByUrl('/dashboard/system/event/edit/' + id);
  }
}
