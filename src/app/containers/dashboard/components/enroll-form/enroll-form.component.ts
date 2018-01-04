import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-enroll-form',
  templateUrl: './enroll-form.component.html',
  styleUrls: ['./enroll-form.component.css']
})
export class EnrollFormComponent implements OnInit {
  isIDFormatErr = false;
  isIDEnroll = false;
  formData = {
    userName: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
    gender: 2
  };
  acceptFileExtensions = ['jpg', 'jpeg', 'gif', 'png'];
  maxFileSize = 307200;
  isUploading = false;
  fileLink: string;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  constructor() {}

  ngOnInit() {}
  enroll({ value, valid }) {
    console.log('value: ', value);
    console.log('valid: ', valid);
  }
}
