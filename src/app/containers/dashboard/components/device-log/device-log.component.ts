import { Component, OnInit, ViewChild } from '@angular/core';
import { DeviceLogService } from '../../services/device-log.service';
import { MatTableDataSource, MatPaginator } from '@angular/material';

@Component({
  selector: 'app-device-log',
  templateUrl: './device-log.component.html',
  styleUrls: ['./device-log.component.css']
})
export class DeviceLogComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  @ViewChild('paginator') paginator: MatPaginator;
  constructor(private deviceLogservice: DeviceLogService) {}

  ngOnInit() {
    this.deviceLogservice.fetchLists().subscribe(res => {
      this.logSource.data = res;
      this.totalCount = res.length;
      this.logSource.paginator = this.paginator;
    });
  }
}
