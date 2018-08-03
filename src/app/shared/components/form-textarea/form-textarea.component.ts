import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DEFAULT_MAXLENGTH } from '@shared/utils/';
import { UtilsService } from '@shared/services/utils.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-textarea',
  templateUrl: './form-textarea.component.html',
  styleUrls: ['./form-textarea.component.css']
})
export class FormTextareaComponent implements OnInit {
  @Input() class_name = 'form-field';
  @Input() isInvalid = false;
  @Input() content: string;
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXTAREA;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() placeholder = '請輸入';
  @Output() onChange = new EventEmitter();
  @Input() control: FormGroup;
  @Input() controlName: string;
  preContent = this.content;
  invalidClassName = `${this.class_name} ${this.class_name}--invalid`;
  constructor(private utils: UtilsService) {}

  ngOnInit() {
  }
  handleAutoHeight(textarea) {
    let adjustedHeight = textarea.currentTarget.clientHeight;
    adjustedHeight = Math.max(
      textarea.currentTarget.scrollHeight,
      adjustedHeight
    );
    if (adjustedHeight > textarea.currentTarget.clientHeight) {
      textarea.currentTarget.style.height = adjustedHeight + 'px';
    }
  }
  handleChange(event) {
    const value = event.target.value;
    this.handleAutoHeight(event);
    this.remindText = `${value.length}/${this.maxLength}`;
    this.onChange.emit(value);
  }
}
