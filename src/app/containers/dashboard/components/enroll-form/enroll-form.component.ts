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

  constructor() { }

  ngOnInit() {
  }
  enroll({value, valid}) {
    console.log('value: ', value);
    console.log('valid: ', valid);
  }
}
