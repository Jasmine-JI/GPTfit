import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { DEFAULT_MAXLENGTH } from '@shared/utils/';
import { UtilsService } from '@shared/services/utils.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-textarea',
  templateUrl: './form-textarea.component.html',
  styleUrls: ['./form-textarea.component.css']
})
export class FormTextareaComponent implements OnInit, OnChanges {
  @Input() class_name = 'form-field';
  @Input() isInvalid = false;
  @Input() content: string;
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXTAREA;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() placeholder = 'Please enter';
  @Output() onChange = new EventEmitter();
  @Input() control: FormGroup;
  @Input() controlName: string;
  @Input() disabled = false;
  @Input() isHadCount = false;
  countText: string;
  preContent = this.content;
  invalidClassName = `${this.class_name} ${this.class_name}--invalid`;
  constructor(private utils: UtilsService) { }

  ngOnInit() { }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.content && changes.content.currentValue) {
      this.countText = `${changes.content.currentValue.length}/${this.maxLength}`;
    }
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
    this.countText = `${value.length}/${this.maxLength}`;
    this.onChange.emit(value);
  }
}
