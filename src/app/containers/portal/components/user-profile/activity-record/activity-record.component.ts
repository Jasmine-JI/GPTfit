import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-activity-record',
  templateUrl: './activity-record.component.html',
  styleUrls: ['./activity-record.component.scss', '../user-profile.component.scss']
})
export class ActivityRecordComponent implements OnInit {
  @Input() userName: string;
  constructor() { }

  ngOnInit() {
  }

}
