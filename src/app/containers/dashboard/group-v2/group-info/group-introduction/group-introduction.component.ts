import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-group-introduction',
  templateUrl: './group-introduction.component.html',
  styleUrls: ['./group-introduction.component.scss', '../group-info.component.scss']
})
export class GroupIntroductionComponent implements OnInit {

  /**
   * ui需要用到的各種flag
   */
  uiFlag = {
    editMode: false
  }

  /**
   * 頁面主要顯示的內容
   */
  groupInfo = {

  }

  /**
   * 編輯完成送出request的body
   */
  editBody = {

  }

  constructor() { }

  ngOnInit(): void {

  }

  /**
   * 開啟編輯模式或關閉編輯模式並送出request
   * @author kidin-1091103
   */
  handleEdit() {
    if (!this.uiFlag.editMode) {
      this.uiFlag.editMode = true;
    } else {
      this.uiFlag.editMode = false;
    }

  }

}
