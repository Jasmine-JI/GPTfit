import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-db-result-dialog',
  templateUrl: './db-result-dialog.component.html',
  styleUrls: ['./db-result-dialog.component.scss']
})
export class DbResultDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
  }

}
