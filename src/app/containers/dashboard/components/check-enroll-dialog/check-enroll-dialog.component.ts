import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-check-enroll-dialog',
  templateUrl: './check-enroll-dialog.component.html',
  styleUrls: ['./check-enroll-dialog.component.css']
})
export class CheckEnrollDialogComponent implements OnInit {
  constructor(private router: Router, private dialog: MatDialog) {}

  ngOnInit() {}
  goBack() {
    this.router.navigateByUrl('/dashboardalaala/event-calendar');
    this.dialog.closeAll();
  }
}
