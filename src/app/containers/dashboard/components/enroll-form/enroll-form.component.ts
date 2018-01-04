import { Component, OnInit } from '@angular/core';
import { EventEnrollService } from '../../services/event-enroll.service';

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
    gender: 2,
    attachment: null
  };
  acceptFileExtensions = ['xlsx'];
  maxFileSize = 307200;
  isUploading = false;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  fileName = '';
  fileLink: string;
  tabIdx = 0;
  isBtnDisabled = false;
  constructor(private eventEnrollService: EventEnrollService) {}

  ngOnInit() {}
  handleAttachmentChange(file) {
    if (file) {
      const { value, link } = file;
      this.formData.attachment = value;
      this.fileName = value.name;
      this.fileLink = link;
      this.isBtnDisabled = !(this.tabIdx === 1 && this.fileLink);
    }
  }
  enroll({ value, valid }) {
    value.attachment = this.formData.attachment;
    const formData = new FormData();
    formData.append('file', value.attachment);
    if (this.tabIdx === 1 && this.fileLink) {
      this.eventEnrollService
        .uploadFile(formData)
        .subscribe(results => console.log('results: ', results));
    } else {
      console.log('value: ', value);
      console.log('valid: ', valid);
    }
  }
  downloadFile(e) {
    e.preventDefault();
    location.href = this.fileLink;
  }
  selectTab(idx) {
    this.tabIdx = idx;
    if (this.tabIdx === 1) {
      this.isBtnDisabled = !(this.tabIdx === 1 && this.fileLink);
    } else {
      this.isBtnDisabled = false;
    }
  }
}
