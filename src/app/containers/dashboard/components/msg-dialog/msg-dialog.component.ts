import { Component, OnInit, Inject, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-msg',
  templateUrl: './msg-dialog.component.html',
  styleUrls: ['./msg-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
})
export class MsgDialogComponent implements OnInit {
  @Output() onConfirm: EventEmitter<any> = new EventEmitter();
  get title() {
    return this.data.title;
  }

  get body() {
    return this.data.body;
  }

  get href() {
    return this.data.href;
  }
  get onChange() {
    return this.data.onDelete;
  }
  constructor(
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {}
  confirm() {
    this.onConfirm.emit();
    if (this.href) {
      this.router.navigateByUrl(this.href);
    }
    this.dialog.closeAll();
  }
}
