import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../services/group.service';
import { HttpParams } from '@angular/common/http';
import { UtilsService } from '@shared/services/utils.service';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
@Component({
  selector: 'app-inner-test',
  templateUrl: './inner-test.component.html',
  styleUrls: ['./inner-test.component.scss']
})
export class InnerTestComponent implements OnInit {
  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    public dialog: MatDialog
  ) {}
  userName: string;
  smallIcon: string;
  middleIcon: string;
  largeIcon: string;
  smallIconWidth: number;
  smallIconHeight: number;
  middleIconWidth: number;
  middleIconHeight: number;
  largeIconWidth: number;
  largeIconHeight: number;
  isWrong = false;
  smallFileSize: number;
  middleFileSize: number;
  largeFileSize: number;

  ngOnInit() {
  }
  getUserAvartar(userId) {
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    this.groupService.fetchUserAvartar(params).subscribe(res => {
      if (res.resultCode === 200) {
        this.userName = res.userName;
        this.smallIcon = this.utils.buildBase64ImgString(res.smallIcon);
        this.middleIcon = this.utils.buildBase64ImgString(res.middleIcon);
        this.largeIcon = this.utils.buildBase64ImgString(res.largeIcon);
        this.handleAvartarInfo(this.smallIcon, 1);
        this.handleAvartarInfo(this.middleIcon, 2);
        this.handleAvartarInfo(this.largeIcon, 3);
      } else {
        this.isWrong = true;
      }
    });
  }
  handleAvartarInfo(icon, type) {
    const image = new Image();
    image.src = icon;
    const head = 'data:image/jpg; base64';
    const imgFileSize = Math.round(((icon.length - head.length) * 3) / 4);

    setTimeout(() => {
      const width = image.width;
      const height = image.height;
      if (type === 1) {
        this.smallIconWidth = width;
        this.smallIconHeight = height;
        this.smallFileSize = imgFileSize;
      } else if (type === 2) {
        this.middleIconWidth = width;
        this.middleIconHeight = height;
        this.middleFileSize = imgFileSize;
      } else {
        this.largeIconWidth = width;
        this.largeIconHeight = height;
        this.largeFileSize = imgFileSize;
      }
    }, 500);

  }
  openSelectorWin(e) {
    const adminLists = [];
    e.preventDefault();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: `人員選擇`,
        adminLists,
        onConfirm: this.handleConfirm.bind(this)
      }
    });
  }
  handleConfirm(_lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.getUserAvartar(userIds[0]);
  }
}
