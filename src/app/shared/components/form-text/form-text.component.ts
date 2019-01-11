import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DEFAULT_MAXLENGTH } from '@shared/utils/';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-text',
  templateUrl: './form-text.component.html',
  styleUrls: ['./form-text.component.css']
})
export class FormTextComponent implements OnInit {
  @Input() class_name = 'form-field';
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXT;
  @Input() isInvalid: boolean;
  @Input() type = 'text';
  @Input() content: string;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() control: FormGroup;
  @Input() controlName: string;
  @Input() disabled = false;
  @Input() placeholder = '';
  @Input() min = 0;
  @Input() max = 255;
  @Output() onChange = new EventEmitter();
  invalidClassName = `${this.class_name} ${this.class_name}--invalid`;
  ngOnInit() {}
  setMyClasses() {
    const classes = {
      'form-field': true,
      'form-field--invalid': this.isInvalid
    };
    return classes;
  }
  handleChange(event) {
    const value = event.target.value;
    this.onChange.emit(value);
  }
}
