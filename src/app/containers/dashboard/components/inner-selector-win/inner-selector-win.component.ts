import { Component, OnInit, Inject, Output, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { GroupService } from '../../services/group.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-inner-selector-win',
  templateUrl: './inner-selector-win.component.html',
  styleUrls: ['./inner-selector-win.component.css']
})
export class InnerSelectorWinComponent implements OnInit {
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

  get adminLists() {
    return this.data.adminLists || [];
  }
  get onChange() {
    return this.data.onDelete;
  }
  areaType: number;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}
  @HostListener('document:click')
  onClick() {
    this.areaType = 0;
  }
  ngOnInit() {
  }
  confirm() {
    const userIds = this.adminLists.map(_list => _list.userId);
    const body = {
      targetRight: this.adminLevel,
      userIds
    };
    this.groupService.updateInnerAdmin(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.data.onConfirm();
        this.dialog.closeAll();
      } else {
        this.router.navigateByUrl(`/404`);
      }
    });
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
  search() {
    let params = new HttpParams();
    params = params.set('type', '0');
    params = params.set('keyword', this.keyword);
    params = params.set('groupId', this.chooseGroupId);
    this.groupService.searchMember(params).subscribe(_result => {
      this.fakeDatas = _result;
      this.fakeDatas = this.fakeDatas.filter(_data => {
        return this.adminLists.findIndex(_adminList => _data.userId === _adminList.userId) === -1;
      });
    });
  }
}
