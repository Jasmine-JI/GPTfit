import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  events: any;
  constructor(
    private router: Router,
    private eventInfoService: EventInfoService
  ) {}

  ngOnInit() {
    const params = new HttpParams();
    this.eventInfoService.fetchEventInfo(params).subscribe(results => this.events = results);
  }
  toCreatePage() {
    this.router.navigateByUrl('/dashboardalaala/event/create');
  }
  remove(id, idx) {
    this.eventInfoService.removeEvent(id).subscribe(results => {
      this.events.splice(idx, 1);
    });
  }
}
