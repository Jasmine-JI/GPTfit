import { CommonModule, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, UserService } from '../../../../../core/services';
import { EquipmentManagementService } from '../../../services/equipment-management.service';
@Component({
  selector: 'app-edit-sales-channel',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule, MatIconModule],
  templateUrl: './edit-sales-channel.component.html',
  styleUrls: ['./edit-sales-channel.component.scss'],
})
export class EditSalesChannelComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('addChannelInput') addChannelInput: ElementRef;

  @Input() editing: boolean;
  @Input() editSalesChannel: boolean;
  @Output() editSalesChannelChange = new EventEmitter();
  @Output() infoChange = new EventEmitter();

  private ngUnsubscribe = new Subject();

  salesChannelRes: any;
  salesChannelList: string[] = [];
  salesChannelEditing = { editing: false, index: null };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit(): void {
    // this.fileNames = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.editSalesChannel) {
      this.getSavedChannelList();
    }
    if (changes.salesChannelRes) {
      // this.getSavedChannelList();
      // this.judgeEdmitMode();
      // this.textLength = this.orderInfo.memo.length;
    }
  }

  /**
   * 取得已儲存銷售渠道表
   */
  getSavedChannelList() {
    this.equipmentManagementService
      .getSalesChannels()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (!res) {
          // console.log(res);
          this.getSalesChannelsApi();
        } else {
          // console.log(res);
          this.salesChannelRes = res;
          this.salesChannelList = res.name;
        }
      });
  }

  /**
   * 取得銷售通路列表
   */
  getSalesChannelsApi() {
    this.equipmentManagementService
      .getSalesChannelsApi()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (!res.error && res.data.name) {
          this.salesChannelRes = res.data;
          this.equipmentManagementService.setSalesChannels(res.data);
        } else if (res.error) {
          alert(res.description);
        }
      });
  }

  startEditing(i: any) {
    this.salesChannelEditing.editing = true;
    this.salesChannelEditing.index = i;
  }

  /**
   * 新增銷售通路
   */
  addSalesChannelName(salesChannel: string) {
    if (this.isValidChannelName(salesChannel)) {
      //add api
      this.equipmentManagementService
        .addSalesChannelsApi(salesChannel)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res) => {
          if (res.error) {
            alert(res.description);
          } else {
            // console.log('add salesChannel:', salesChannel);
            alert(`成功新增銷售渠道 "${salesChannel}"`);
            this.getSalesChannelsApi();
            if (this.editSalesChannel) {
              this.addChannelInput.nativeElement.value = '';
            }
          }
        });
    }
  }

  updateSalesChannelName(i: number, newSalesChannel: any) {
    if (this.isValidChannelName(newSalesChannel)) {
      const channel_id = this.salesChannelRes.channel_id[i];
      const originSalesChannel = this.salesChannelRes.name[i];
      if (originSalesChannel !== newSalesChannel) {
        //update api
        this.equipmentManagementService
          .updateSalesChannelsApi(channel_id, newSalesChannel)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((res) => {
            if (res.error) {
              alert(res.description);
            } else {
              // console.log('update newSalesChannel:', newSalesChannel);
              alert(`成功將銷售渠道"${originSalesChannel}"修改為"${newSalesChannel}"`);
              this.getSalesChannelsApi();
              if (this.editSalesChannel) {
                this.addChannelInput.nativeElement.value = '';
              }
            }
          });
      }
    }
    this.cancelEditing();
  }

  isValidChannelName(name: string): boolean {
    return name.trim() !== '';
  }

  deleteSalesChannel(i: number, salesChannel: any) {
    // console.log(this.salesChannelRes);
    const channel_id = this.salesChannelRes.channel_id[i];

    if (confirm(`是否刪除銷貨渠道"${salesChannel}"?`) == true) {
      //api deleteSalesChannelsApi
      this.equipmentManagementService
        .deleteSalesChannelsApi(channel_id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res) => {
          if (res.error) {
            alert(res.description);
          } else {
            // console.log('delete salesChannel:', salesChannel);
            alert(`成功刪除銷貨渠道"${salesChannel}"`);
            this.getSalesChannelsApi();
          }
        });
    }
  }

  cancelEditing() {
    this.salesChannelEditing.editing = false;
    this.salesChannelEditing.index = null;
  }

  /**
   * 退出編輯渠道視窗
   */
  closeEdit() {
    this.cancelEditing();

    this.editSalesChannel = false;
    this.editSalesChannelChange.emit(this.editSalesChannel);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
