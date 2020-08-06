import { Component, OnInit, Inject, Output, HostListener } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupService } from '../../services/group.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-people-selector-win',
  templateUrl: './people-selector-win.component.html',
  styleUrls: ['./people-selector-win.component.css']
})
export class PeopleSelectorWinComponent implements OnInit {
  fakeDatas = [];
  chooseIndex: number;
  chooseExistIndex: number;
  groupLists: any;
  chooseGroupId = '';
  keyword = '';

  get title() {
    return this.data.title;
  }

  get adminLevel() {
    return this.data.adminLevel;
  }

  get type() {
    return this.data.type;
  }

  get adminLists() {
    return this.data.adminLists || [];
  }

  get onChange() {
    return this.data.onDelete;
  }

  get isInnerAdmin() {
    return this.data.isInnerAdmin;
  }

  areaType: number;
  constructor(
    private dialog: MatDialog,
    private groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  @HostListener('document:click')
  onClick() {
    this.areaType = 0;
  }

  ngOnInit() {
    this.handleGroupOptions();
  }

  confirm() {
    this.data.onConfirm(this.type, this.adminLists);
    this.dialog.closeAll();
  }

  handleBtnColor(_areaType, e) {
    e.stopPropagation();
    this.areaType = _areaType;
  }

  handleItem(idx) {
    this.chooseExistIndex = -1;
    this.chooseIndex = idx;
  }

  handleExistItem(idx) {
    this.chooseIndex = -1;
    this.chooseExistIndex = idx;
  }

  assignUser() {
    if (this.chooseIndex > -1) {
      const chooseData = this.fakeDatas[this.chooseIndex];
      this.adminLists.push(chooseData);
      this.fakeDatas.splice(this.chooseIndex, 1);
      this.chooseIndex = -1;
    }
  }

  removeUser() {
    if (this.chooseExistIndex > -1) {
      const chooseData = this.adminLists[this.chooseExistIndex];
      this.fakeDatas.push(chooseData);
      this.adminLists.splice(this.chooseExistIndex, 1);
      this.chooseExistIndex = -1;
    }
  }

  handleGroupOptions() {
    this.groupService.getGroupList().subscribe(_res => this.groupLists = _res);
  }

  /**
   * 根據查詢類型進行搜尋
   * @author kidin-1090806
   */
  search() {
    if (this.chooseGroupId.length > 0 || this.isInnerAdmin) {
      let params = new HttpParams();
      params = params.set('type', '0');
      params = params.set('keyword', this.keyword);
      params = params.set('searchType', this.type);

      if (this.isInnerAdmin) {
        params = params.set('groupId', '0-0-0-0-0-0');
      } else {
        params = params.set('groupId', this.chooseGroupId);
      }

      this.groupService.searchMember(params).subscribe(_result => {
        this.fakeDatas = _result;
        this.fakeDatas = this.fakeDatas.filter(_data => {
          return this.adminLists.findIndex(_adminList => _data.userId === _adminList.userId) === -1;
        });
      });

    } else {
      this.fakeDatas = [];
    }
  }

}
