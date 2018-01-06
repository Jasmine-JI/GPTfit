import { Component, OnInit } from '@angular/core';
import { EventEnrollService } from '../../services/event-enroll.service';
import { GlobalEventsManager } from '@shared/global-events-manager';

@Component({
  selector: 'app-enroll-preview',
  templateUrl: './enroll-preview.component.html',
  styleUrls: ['./enroll-preview.component.css']
})
export class EnrollPreviewComponent implements OnInit {
  results: any;
  constructor(
    private eventEnrollService: EventEnrollService,
    private globalEventsManager: GlobalEventsManager
  ) {}
  ngOnInit() {
    this.getData();
  }
  getData() {
    this.globalEventsManager.showLoading(true);
    this.eventEnrollService.fetchEnrollData().subscribe(_results => {
      this.globalEventsManager.showLoading(false);
      console.log(_results);
      this.results = _results;
    });
  }
}
