import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss', '../settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  isUploading = false;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  maxFileSize = 1048576;
  userIcon: string;
  constructor() {}

  ngOnInit() {}
}
