import {
  Component,
  OnInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  SimpleChange,
  ViewEncapsulation
} from '@angular/core';
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
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-my-device',
  templateUrl: './my-device.component.html',
  styleUrls: ['./my-device.component.css', '../../../group/group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MyDeviceComponent implements OnInit, OnChanges {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  isLoading = false;
  @ViewChild('paginator')
  paginator: MatPaginator;
  token: string;
  localSN: string[];
  @Input() targetUserId: number;
  constructor(
    private router: Router,
    private qrcodeService: QrcodeService,
    private utilsService: UtilsService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private snackbar: MatSnackBar,
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
          const afterBondingTip1 = this.translate.instant(
            'Dashboard.MyDevice.AfterBondingTip1'
          );
          const afterBondingTip2 = this.translate.instant(
            'Dashboard.MyDevice.AfterBondingTip2'
          );
          const afterBondingTip3 = this.translate.instant(
            'Dashboard.MyDevice.AfterBondingTip3'
          );
          if (this.utilsService.getSessionStorageObject('bindingSN')) {
            return this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Fit pair',
                body: `<div class="fit-pair"><div class="title">${afterBondingTip1}</div>
  <div class="image-container"><img src="/assets/fitPairDemo.png" style="width: 100%" /></div>
  <div class="tip2">${afterBondingTip2}</div><div>${afterBondingTip3}</div></div>`,
                confirmText: this.translate.instant('SH.Agree'),
                cancelText: this.translate.instant('SH.Disagree'),
                onCancel: () => this.utilsService.removeSessionStorageObject('bindingSN'),
                onConfirm: this.handleFitPair.bind(this)
              }
            });
          }

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
              body: this.translate.instant('Dashboard.MyDevice.BindingFailed'),
              confirmText: this.translate.instant('SH.Confirm')
            }
          });
        }
      });
    } else {
      this.getDeviceList();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    const currentItem: SimpleChange = changes.targetUserId;
    if (
      !currentItem.firstChange &&
      currentItem.currentValue !== +currentItem.previousValue
    ) {
      this.getDeviceList();
    }
  }
  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
  }
  goDetail(id) {
    if (
      this.targetUserId &&
      location.pathname.indexOf('/system/device-pair-management') > -1
    ) {
      this.router.navigateByUrl(`dashboard/system/device/info/${id}`);
    } else {
      this.router.navigateByUrl(`dashboard/device/info/${id}`);
    }
  }
  getDeviceList() {
    const deviceBody = {
      token: this.token,
      targetUserId: (this.targetUserId && this.targetUserId.toString()) || '',
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts:
        (this.currentPage && this.currentPage.pageSize.toString()) || '10'
    };
    this.qrcodeService.getDeviceList(deviceBody).subscribe(_res => {
      this.isLoading = false;
      if (_res.resultCode === 402) {
        return this.router.navigateByUrl('/403');
      }
      if (_res.resultCode === 200) {
        this.logSource.data = _res.info.deviceList;
        this.totalCount = _res.info.totalCounts;
        this.logSource.data = this.logSource.data.map(_data => {
          const idx = this.localSN.findIndex(
            _sn => _sn === _data.myEquipmentSN
          );
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
      }
    });
  }
  handleFitPair() {
    const body = {
      token: this.token,
      myEquipmentSN: this.utilsService.getSessionStorageObject('bindingSN'),
      fitPairStatus: '1', // 僅限我(頭像與運動檔案)
      deviceSettingJson: ''
    };
    this.qrcodeService.editDeviceInfo(body).subscribe(res => {
      this.utilsService.removeSessionStorageObject('bindingSN');
      if (res.resultCode === 200) {
        this.snackbar.open(
          'enabled successfully!',
          'OK',
          { duration: 3000 }
        );
      } else {
        this.snackbar.open(
          'Failed to enable!',
          'OK',
          { duration: 3000 }
        );
      }
    });
  }
}
