import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HrZoneRange } from '../../../models/chart-data';

@Component({
  selector: 'app-hrzone-info',
  templateUrl: './hrzone-info.component.html',
  styleUrls: ['./hrzone-info.component.scss']
})
export class HrzoneInfoComponent implements OnInit, OnChanges {
  @Input() hrZoneRange: HrZoneRange;

  constructor() {
  }

  ngOnInit() { }

  ngOnChanges () { }

}
