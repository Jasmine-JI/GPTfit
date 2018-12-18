import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
import { Router } from '@angular/router';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

@Component({
  selector: 'app-my-device',
  templateUrl: './my-device.component.html',
  styleUrls: ['./my-device.component.css', '../../../group/group-style.scss']
})
export class MyDeviceComponent implements OnInit, OnDestroy {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  isLoading = false;
  @ViewChild('paginator')
  paginator: MatPaginator;
  constructor(
    private matPaginatorIntl: MatPaginatorIntl,
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private qrcodeService: QrcodeService,
    private utilsService: UtilsService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.globalEventsManager.setFooterRWD(1); // 為了讓footer長高85px
    // 設定顯示筆數資訊文字
    this.matPaginatorIntl.getRangeLabel = (
      page: number,
      pageSize: number,
      length: number
    ): string => {
      if (length === 0 || pageSize === 0) {
        return `第 0 筆、共 ${length} 筆`;
      }

      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;

      return `第 ${startIndex + 1} - ${endIndex} 筆、共 ${length} 筆`;
    };
    this.currentPage = {
      pageIndex: 0,
      pageSize: 10,
      length: null
    };

    this.currentSort = {
      active: '',
      direction: ''
    };
    const updateIdx = this.utilsService.getLocalStorageObject('updateIdx');
    const localSN = this.utilsService.getLocalStorageObject('snNumber') || [];
    const bondStatus = this.utilsService.getLocalStorageObject('bondStatus');
    const token = this.utilsService.getToken();
    const deviceBody = { token };
    this.isLoading = true;
    if (localSN && bondStatus && updateIdx) {
      const body = {
        token,
        bondEquipmentSN: localSN[updateIdx],
        bondStatus
      };
      this.qrcodeService.updateDeviceBonding(body).subscribe(res => {
        if (res.resultCode === 200) {
          this.utilsService.removeLocalStorageObject('updateIdx');
          this.utilsService.removeLocalStorageObject('bondStatus');
          this.qrcodeService.getDeviceList(deviceBody).subscribe(_res => {
            this.isLoading = false;
            this.logSource.data = _res.info.deviceList;
            this.logSource.data = this.logSource.data.map(_data => {
              const idx = localSN.findIndex(_sn => _sn === _data.myEquipmentSN);
              if (idx > -1) {
                return {
                  ..._data,
                  isDisplayNew: true
                };
              } else {
                return { ..._data, isDisplayNew: false };
              }
            });
          });
        }
        if (res.resultCode === 402) {
          this.isLoading = false;
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: '綁定失敗，此裝置已有綁定狀態',
              confirmText: '確定'
            }
          });
        }
        if (res.resultCode === 400) {
          this.isLoading = false;
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: '綁定失敗',
              confirmText: '確定'
            }
          });
        }
      });
    } else {
      this.qrcodeService.getDeviceList(deviceBody).subscribe(_res => {
        this.isLoading = false;
        this.logSource.data = _res.info.deviceList;
        this.logSource.data = this.logSource.data.map(_data => {
          const idx = localSN.findIndex(_sn => _sn === _data.myEquipmentSN);
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
  ngOnDestroy() {
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
  }
  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
  }
  goDetail(id) {
    this.router.navigateByUrl(`dashboard/device/info/${id}`);
  }
}
