import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {}
  toCreatePage() {
    this.router.navigateByUrl('/dashboardalaala/event/create');
  }
}
