import { HashIdService } from './../../../../shared/services/hash-id.service';
import { UtilsService } from './../../../../shared/services/utils.service';
import { Component, OnInit, Inject, Output, HostListener } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupService } from '../../services/group.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-people-selector-win',
  templateUrl: './people-selector-win.component.html',
  styleUrls: ['./people-selector-win.component.scss']
})
export class PeopleSelectorWinComponent implements OnInit {

  pushCondition = ['地區', '系統', '應用', '群組', '會員', '語言'];
  lanTmpList = [];

  uiFlag = {
    titleChoice: false,
    titleIdx: 0,
    showTitleSelector: false,
    canSearch: true
  };

  tmpPushSetting: any;
  tmpNotAssignCondition: any;
  fakeDatas = [];
  selectedDatas = [];
  chooseIndex: number;
  chooseExistIndex: number;
  groupLists: any;
  chooseGroupId = '';
  keyword = '';

  get title() {
    return this.data.title;
  }

  get titleIdx() {
    return this.data.titleIdx;
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

  get pushSetting() {
    return this.data.pushSetting;
  }

  get notAssignCondition() {
    return this.data.notAssignCondition;
  }

  areaType: number;
  constructor(
    private dialog: MatDialog,
    private groupService: GroupService,
    private utlis: UtilsService,
    private hashids: HashIdService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  @HostListener('document:click')
  onClick() {
    this.areaType = 0;
  }

  ngOnInit() {
    this.handleGroupOptions();
    this.checkType();
  }

  /**
   * 確認資料類型
   * @author kidin-1090917
   */
  checkType() {

    switch (this.type) {
      case 1:
      case 2:
        this.selectedDatas = this.adminLists;
        break;
      case 3:

        if (Array.isArray(this.title)) {
          this.uiFlag.titleChoice = true;
          this.uiFlag.titleIdx = this.titleIdx;

          // 複製資料避免污染原資料使得取消鍵無法發揮作用
          this.tmpNotAssignCondition = this.utlis.deepCopy(this.notAssignCondition);
          this.tmpPushSetting = this.utlis.deepCopy(this.pushSetting);
          this.changeTitle(null, this.uiFlag.titleIdx);
        }

        break;
    }

  }

  /**
   * 開啟或關閉標題選擇器
   */
  openTitleSelector() {
    if (this.uiFlag.showTitleSelector) {
      this.uiFlag.showTitleSelector = false;
    } else {
      this.uiFlag.showTitleSelector = true;
    }

  }

  /**
   * 切換標題
   * @param e {MouseEvent}
   * @param idx {number}
   * @author kidin-1090917
   */
  changeTitle(e: MouseEvent, idx: number) {
    if (e !== null) {
      e.stopPropagation();
    }

    this.uiFlag.titleIdx = idx;
    this.uiFlag.showTitleSelector = false;
    this.keyword = '';

    switch (idx) {
      case 0:
        this.fakeDatas = this.tmpNotAssignCondition.countryRegion;
        this.selectedDatas = this.tmpPushSetting.pushMode.countryRegion;
        this.uiFlag.canSearch = false;
        break;
      case 1:
        this.fakeDatas = this.tmpNotAssignCondition.system;
        this.selectedDatas = this.tmpPushSetting.pushMode.system;
        this.uiFlag.canSearch = false;
        break;
      case 2:
        this.fakeDatas = this.tmpNotAssignCondition.app;
        this.selectedDatas = this.tmpPushSetting.pushMode.app;
        this.uiFlag.canSearch = false;
        break;
      case 3:
        this.fakeDatas = this.tmpNotAssignCondition.groupId;
        this.selectedDatas = this.tmpPushSetting.pushMode.groupId;
        this.uiFlag.canSearch = true;
        break;
      case 4:
        this.fakeDatas = this.tmpNotAssignCondition.userId;
        this.selectedDatas = this.tmpPushSetting.pushMode.userId;
        this.uiFlag.canSearch = true;
        break;
      case 5:
        this.fakeDatas = this.tmpNotAssignCondition.language;
        this.selectedDatas = this.getLanguageList(this.tmpPushSetting.message);
        this.uiFlag.canSearch = false;
        break;
    }

  }

  /**
   * 取得已選擇的語言列表
   * @param message {Array<Object>}
   * @returns Array<string>-語言列表
   * @author kidin-1090918
   */
  getLanguageList(message: Array<any>) {
    const lanList = [];
    message.forEach(_message => {
      lanList.push(`${_message.language}-${_message.countryRegion}`);
    });

    return lanList;
  }

  /**
   * 加入使用者所選的語言
   * @param lan {string}-使用者所選的語言
   * @author kidin-1090918
   */
  getLanguageObj(lan: string) {
    const newLan = {
      language: lan.split('-')[0],
      countryRegion: lan.split('-')[1],
      title: '',
      content: '',
      deepLink: ''
    };

    return newLan;
  }

  confirm() {
    switch (this.type) {
      case 1:
      case 2:
        this.data.onConfirm(this.type, this.selectedDatas);
        break;
      case 3:
        this.data.onConfirm(this.tmpPushSetting, this.tmpNotAssignCondition);
        break;
    }

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

  /**
   * 加入所選項目
   * @author kidin-1090921
   */
  assignItem() {

    if (this.chooseIndex > -1) {
      const chooseData = this.fakeDatas[this.chooseIndex];
      this.fakeDatas.splice(this.chooseIndex, 1);

      switch (this.type) {
        case 1:
        case 2:
          this.adminLists.push(chooseData);
          break;
        case 3:

          if (this.uiFlag.titleIdx === 5) {
            this.tmpPushSetting.message.push(this.getLanguageObj(chooseData));
            this.selectedDatas = this.getLanguageList(this.tmpPushSetting.message);
          } else {
            this.selectedDatas.push(chooseData);
          }

          break;
      }

      this.chooseIndex = -1;
    }

  }

  /**
   * 移除所選項目
   * @author kidin-1090921
   */
  removeItem() {
    if (this.chooseExistIndex > -1) {
      const chooseData = this.selectedDatas[this.chooseExistIndex];
      this.fakeDatas.push(chooseData);

      if (this.type === 3 && this.uiFlag.titleIdx === 5) {
        this.tmpPushSetting.message.splice(this.chooseExistIndex, 1);
        this.selectedDatas = this.getLanguageList(this.tmpPushSetting.message);
      } else {
        this.selectedDatas.splice(this.chooseExistIndex, 1);
      }

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

    if (this.type === 3 && this.uiFlag.titleIdx === 3) {
      const groupId = this.hashids.handleGroupIdDecode(this.keyword),
            body = {
              token: this.utlis.getToken(),
              groupId: groupId,
              findRoot: 1,
              avatarType: 2
            };
      this.groupService.fetchGroupListDetail(body).subscribe(res => {
        if (res.resultCode === 200) {
          this.fakeDatas = [{
            groupId,
            groupName: res.info.groupName
          }];

        }

      });
    } else {

      if (this.chooseGroupId.length > 0 || this.isInnerAdmin) {
        let params = new HttpParams();
        params = params.set('type', '0');
        params = params.set('keyword', this.keyword);
        if (this.type === 3) {
          params = params.set('searchType', '1');
        } else {
          params = params.set('searchType', this.type);
        }


        if (this.isInnerAdmin) {
          params = params.set('groupId', '0-0-0-0-0-0');
        } else {
          params = params.set('groupId', this.chooseGroupId);
        }

        this.groupService.searchMember(params).subscribe(_result => {
          this.fakeDatas = _result;
          this.fakeDatas = this.fakeDatas.filter(_data => {
            return this.selectedDatas.findIndex(_selectedData => _data.userId === _selectedData.userId) === -1;
          });

        });

      } else {
        this.fakeDatas = [];
      }

    }

  }

}
