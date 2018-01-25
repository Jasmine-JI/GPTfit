import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-db-result-dialog',
  templateUrl: './db-result-dialog.component.html',
  styleUrls: ['./db-result-dialog.component.css']
})
export class DbResultDialogComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
  }

}
