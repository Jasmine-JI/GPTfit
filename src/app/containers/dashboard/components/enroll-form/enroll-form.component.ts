import { Component, OnInit } from '@angular/core';
import { EventEnrollService } from '../../services/event-enroll.service';
import {
  debounce
} from '@shared/utils/';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

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
    ageRange: '21~25歲',
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
  active = false; // select options的開關
  emailErr = '';
  phoneErr = '';
  idNumErr = '';
  isEmailLoading = false;
  isPhoneLoading = false;
  isIDNumLoading = false;
  event_id: string;
  constructor(
    private eventEnrollService: EventEnrollService,
    private route: ActivatedRoute
  ) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
    this.handleSearchPhone = debounce(this.handleSearchPhone, 1000);
    this.handleSearchIDNum = debounce(this.handleSearchIDNum, 1000);
  }

  ngOnInit() {
    this.event_id = this.route.snapshot.paramMap.get('event_id');
  }

  public onEmailChange(e: any, { controls: { email } }): void {
    if (e.target.value.length > 0 && email.status === 'VALID') {
      this.handleSearchEmail(email);
    }
    if (e.target.value.length === 0) {
      this.emailErr = '';
    }
  }
  public onPhoneChange(e: any, { controls: { phone } }): void {
    if (e.target.value.length > 0 && phone.status === 'VALID') {
      this.handleSearchPhone(phone);
    }
    if (e.target.value.length === 0) {
      this.phoneErr = '';
    }
  }
  public onIDNumChange(e: any, { controls: { idNumber } }): void {
    if (e.target.value.length > 0 && idNumber.status === 'VALID') {
      this.handleSearchIDNum(idNumber);
    }
    if (e.target.value.length === 0) {
      this.idNumErr = '';
    }
  }
  handleSearchIDNum(idNumber) {
    let params = new HttpParams();
    params = params.set('event_id', this.event_id);
    params = params.set('idNumber', this.formData.idNumber);
    this.isIDNumLoading = true;
    this.eventEnrollService.getIDNum(params).subscribe(
      result => {
        this.isIDNumLoading = false;
        idNumber.status = 'VALID';
        this.idNumErr = '';
      },
      err => {
        this.isIDNumLoading = false;
        idNumber.status = 'INVALID';
        this.idNumErr = err.error;
      }
    );
  }
  handleSearchPhone(phone) {
    let params = new HttpParams();
    params = params.set('event_id', this.event_id);
    params = params.set('phone', this.formData.phone);
    this.isPhoneLoading = true;
    this.eventEnrollService.getPhone(params).subscribe(
      result => {
        this.isPhoneLoading = false;
        phone.status = 'VALID';
        this.phoneErr = '';
      },
      err => {
        this.isPhoneLoading = false;
        phone.status = 'INVALID';
        this.phoneErr = err.error;
      }
    );
  }
  handleSearchEmail(email) {
    let params = new HttpParams();
    params = params.set('event_id', this.event_id);
    params = params.set('email', this.formData.email);
    this.isEmailLoading = true;
    this.eventEnrollService.getEmail(params).subscribe(
      result => {
        this.isEmailLoading = false;
        email.status = 'VALID';
        this.emailErr = '';
      },
      err => {
        this.isEmailLoading = false;
        email.status = 'INVALID';
        this.emailErr = err.error;
      }
    );
  }
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
    }
    if (valid) {
      const data = value;
      data.country_code = '886';
      data.pay_method = '臨櫃付款';
      data.status = '已付款';
      data.event_seesion = '0-1';
      this.eventEnrollService
        .enroll(data)
        .subscribe(results => console.log('results: ', results));
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
