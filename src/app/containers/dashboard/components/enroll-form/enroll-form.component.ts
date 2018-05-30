import { Component, OnInit, ViewChild } from '@angular/core';
import { EventEnrollService } from '../../services/event-enroll.service';
import { EventInfoService } from '../../services/event-info.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import {
  debounce,
  getUrlQueryStrings
} from '@shared/utils/';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl
} from '@angular/forms';
import { getLocalStorageObject } from '@shared/utils/';

@Component({
  selector: 'app-enroll-form',
  templateUrl: './enroll-form.component.html',
  styleUrls: ['./enroll-form.component.css']
})
export class EnrollFormComponent implements OnInit {
  isIDFormatErr = false;
  isIDEnroll = false;
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
  session_id: string;
  eventInfo: any;
  signupMethod: number;
  @ViewChild('f') form: any;
  complexForm: FormGroup;
  counrtyCode = '+886';
  constructor(
    private eventEnrollService: EventEnrollService,
    private eventInfoService: EventInfoService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
    this.handleSearchPhone = debounce(this.handleSearchPhone, 1000);
    // this.handleSearchIDNum = debounce(this.handleSearchIDNum, 1000);
    this.complexForm = this.fb.group({
      // 定義表格的預設值
      userName: ['', Validators.required],
      signupMethod: ['', Validators.required],
      address: ['', Validators.required],
      ageRange: '不透露',
      gender: 2
    });
  }

  ngOnInit() {
    this.event_id = this.route.snapshot.paramMap.get('event_id');
    const queryStrings = getUrlQueryStrings(location.search);
    const { session_id } = queryStrings;
    this.session_id = session_id;
    let params = new HttpParams();
    if (this.event_id && this.session_id) {
      params = params.set('event_id', this.event_id);
      params = params.set('session_id', this.session_id);
    }

    this.eventInfoService
      .fetchEventInfo(params)
      .subscribe(datas => (this.eventInfo = datas));
  }

  public onEmailChange(e: any, { controls: { email } }): void {
    if (e.target.value.length > 0 && email.status === 'VALID') {
      this.handleSearchEmail(email.value);
    }
    if (e.target.value.length === 0) {
      this.emailErr = '';
    }
  }

  public onPhoneChange(code): void {
    this.counrtyCode = code;
    const phoneValue = this.complexForm.get('phone').value;
    if (phoneValue.length > 0) {
      this.handleSearchPhone(phoneValue);
    }
  }
  // public onIDNumChange(e: any, { controls: { idNumber } }): void {
  //   if (e.target.value.length > 0 && idNumber.status === 'VALID') {
  //     this.handleSearchIDNum(idNumber);
  //   }
  //   if (e.target.value.length === 0) {
  //     this.idNumErr = '';
  //   }
  // }
  // handleSearchIDNum(idNumber) {
  //   let params = new HttpParams();
  //   params = params.set('event_id', this.event_id);
  //   params = params.set('idNumber', this.formData.idNumber);
  //   this.isIDNumLoading = true;
  //   this.eventEnrollService.getIDNum(params).subscribe(
  //     result => {
  //       this.isIDNumLoading = false;
  //       this.idNumErr = '';
  //     },
  //     err => {
  //       this.isIDNumLoading = false;
  //       this.idNumErr = err.error;
  //     }
  //   );
  // }
  handleSearchPhone(phone) {
    let params = new HttpParams();
    params = params.set('event_id', this.event_id);
    params = params.set('phone', phone);
    this.isPhoneLoading = true;
    this.eventEnrollService.getPhone(params).subscribe(
      result => {
        this.isPhoneLoading = false;
        this.phoneErr = '';
      },
      err => {
        this.isPhoneLoading = false;
        this.phoneErr = err.error;
      }
    );
  }
  handleTab() {
    if (this.tabIdx === 0) {
      this.complexForm.removeControl('attachment');
    } else {
      const attachmentControl: FormControl = new FormControl(
        null,
        Validators.required
      );
      this.complexForm.addControl('attachment', attachmentControl);
    }
  }
  handleRadioBtn(value) {
    if (value === '1') {
      this.phoneErr = '';
      this.complexForm.removeControl('phone');
      const emailControl: FormControl = new FormControl('', [
        Validators.required,
        Validators.pattern(
          /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
        )
      ]);
      this.complexForm.addControl('email', emailControl);
    } else {
      this.complexForm.removeControl('email');
      this.emailErr = '';
      const phoneControl: FormControl = new FormControl(
        '',
        Validators.required
      );
      this.complexForm.addControl('phone', phoneControl);
    }
  }
  handleSearchEmail(email) {
    let params = new HttpParams();
    params = params.set('event_id', this.event_id);
    params = params.set('email', encodeURIComponent(email).trim());
    this.isEmailLoading = true;
    this.eventEnrollService.getEmail(params).subscribe(
      result => {
        this.isEmailLoading = false;
        this.emailErr = '';
      },
      err => {
        this.isEmailLoading = false;
        this.emailErr = err.error;
      }
    );
  }
  handleAttachmentChange(file) {
    if (file) {
      const { value, link } = file;
      this.complexForm.value.attachment = value;
      this.fileName = value.name;
      this.fileLink = link;
      this.isBtnDisabled = !(this.tabIdx === 1 && this.fileLink);
    }
  }
  enroll({ value, valid }) {
    if (this.tabIdx === 1 && this.fileLink) {
      const formData = new FormData();
      formData.append('file', value.attachment);
      formData.append('eventId', this.event_id);
      formData.append('sessionId', this.session_id);
      return this.eventEnrollService.uploadFile(formData).subscribe(results => {
        window.alert(results);
      });
    }
    if (valid && this.phoneErr.length === 0 && this.emailErr.length === 0) {
      const data = value;
      data.pay_method = '臨櫃付款';
      data.status = '已付款';
      data.event_id = this.event_id;
      data.session_id = this.session_id;
      data.session_name = this.eventInfo.session_name;
      data.idNumber = ''; // 因為把身分證欄位拿掉
      if (data.signupMethod === 2) {
        data.email = '';
        data.country_code = this.counrtyCode;
      } else {
        data.phone = '';
      }
      this.eventEnrollService.enroll(data).subscribe(
        results => {
          this.dialog.open(MsgDialogComponent, {
            hasBackdrop: true,
            data: {
              title: 'Message',
              body: 'Registration success and back to event calendar',
              href: '/dashboard/event-calendar'
            }
          });
          this.form.resetForm();
          this.complexForm.patchValue({
            ageRange: '不透露',
            gender: 2
          });
        },
        err => {
          this.dialog.open(MsgDialogComponent, {
            hasBackdrop: true,
            data: {
              title: 'Message',
              body: err.errorMessage
            }
          });
        }
      );
    }
  }
  showCheckEnrollDialog() {
    this.dialog.open(MsgDialogComponent, { hasBackdrop: true });
  }
  downloadFile(e) {
    e.preventDefault();
    location.href = this.fileLink;
  }
  downloadExample(e) {
    e.preventDefault();
    location.href = '../../../../../assets/files/enrollExample.xlsx';
  }
  selectTab(idx) {
    this.tabIdx = idx;
    if (this.tabIdx === 1) {
      this.isBtnDisabled = !(this.tabIdx === 1 && this.fileLink);
    } else {
      this.isBtnDisabled = false;
    }
  }
  goBack() {
    const hosts = [
      '192.168.1.235',
      'app.alatech.com.tw',
      'cloud.alatech.com.tw'
    ];
    const hostName = getLocalStorageObject('hostName');
    const isHostName = hostName
      ? hosts.some(_host => hostName.indexOf(_host) > -1)
      : false;
    if (isHostName) {
      return window.history.back();
    }
    return this.router.navigateByUrl('/dashboard/event-calendar');
  }
  goViewEnroll(eventId, sessionId) {
    this.router.navigateByUrl(
      `/dashboard/enroll/${eventId}/preview?session_id=${sessionId}`
    );
  }
}
