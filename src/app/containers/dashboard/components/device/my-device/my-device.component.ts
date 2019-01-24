import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  Sort
} from '@angular/material';
import { Router } from '@angular/router';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-device',
  templateUrl: './my-device.component.html',
  styleUrls: ['./my-device.component.css', '../../../group/group-style.scss']
})
export class MyDeviceComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  isLoading = false;
  @ViewChild('paginator')
  paginator: MatPaginator;
  token: string;
  localSN: string[];
  constructor(
    private router: Router,
    private qrcodeService: QrcodeService,
    private utilsService: UtilsService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const queryStrings = this.utilsService.getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;
    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.router.navigateByUrl(
        `/dashboard/device?pageNumber=${this.currentPage.pageIndex + 1}`
      );
      this.getDeviceList();
    });

    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null
    };

    this.currentSort = {
      active: '',
      direction: ''
    };
    const updateIdx = this.utilsService.getLocalStorageObject('updateIdx');
    this.localSN = this.utilsService.getLocalStorageObject('snNumber') || [];
    const bondStatus = this.utilsService.getLocalStorageObject('bondStatus');
    this.token = this.utilsService.getToken();

    this.isLoading = true;
    if (this.localSN && bondStatus && updateIdx) {
      const body = {
        token: this.token,
        bondEquipmentSN: this.localSN[updateIdx],
        bondStatus
      };
      this.qrcodeService.updateDeviceBonding(body).subscribe(res => {
        if (res.resultCode === 200) {
          this.utilsService.removeLocalStorageObject('updateIdx');
          this.utilsService.removeLocalStorageObject('bondStatus');
          this.getDeviceList();
        }
        if (res.resultCode === 402) {
          this.isLoading = false;
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translate.instant(
                'Dashboard.MyDevice.BindingFailedDeviceBound'
              ),
              confirmText: this.translate.instant('SH.Confirm')
            }
          });
        }
        if (res.resultCode === 400) {
          this.isLoading = false;
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translate.instant(
                'Dashboard.MyDevice.BindingFailed'
              ),
              confirmText: this.translate.instant('SH.Confirm')
            }
          });
        }
      });
    } else {
      this.getDeviceList();
    }
  }

  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
  }
  goDetail(id) {
    this.router.navigateByUrl(`dashboard/device/info/${id}`);
  }
  getDeviceList() {
    const deviceBody = {
      token: this.token,
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts:
        (this.currentPage && this.currentPage.pageSize.toString()) || '10'
    };
    this.qrcodeService.getDeviceList(deviceBody).subscribe(_res => {
      this.isLoading = false;
      this.logSource.data = _res.info.deviceList;
      this.totalCount = _res.info.totalCounts;
      this.logSource.data = this.logSource.data.map(_data => {
        const idx = this.localSN.findIndex(_sn => _sn === _data.myEquipmentSN);
        if (idx > -1) {
          return {
            ..._data,
            isDisplayNew: true
          };
        } else {
          return {
            ..._data,
            isDisplayNew: false
          };
        }
      });
    });
  }
}
