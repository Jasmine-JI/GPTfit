import { Component, OnInit } from '@angular/core';
import { DeviceLogService } from '../../services/device-log.service';
import { MatTableDataSource } from '@angular/material';

@Component({
  selector: 'app-device-log',
  templateUrl: './device-log.component.html',
  styleUrls: ['./device-log.component.css']
})
export class DeviceLogComponent implements OnInit {
  logSource: any;

  constructor(private deviceLogservice: DeviceLogService) {
    this.logSource = new MatTableDataSource<any>();
  }

  ngOnInit() {
    this.deviceLogservice.fetchLists().subscribe(res => this.logSource.data = res);
  }
}
