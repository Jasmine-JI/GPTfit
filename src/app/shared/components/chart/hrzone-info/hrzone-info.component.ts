import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HrZoneRange } from '../../../models/chart-data';
import { HrBase } from '../../../models/user-profile-info';

@Component({
  selector: 'app-hrzone-info',
  templateUrl: './hrzone-info.component.html',
  styleUrls: ['./hrzone-info.component.scss']
})
export class HrzoneInfoComponent implements OnInit, OnChanges {
  @Input() hrZoneRange: HrZoneRange;

  readonly HrBase = HrBase;

  constructor() {
  }

  ngOnInit() { }

  ngOnChanges () { }

}
