import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-confirm-button',
  templateUrl: './confirm-button.component.html',
  styleUrls: ['./confirm-button.component.css']
})
export class ConfirmButtonComponent implements OnInit {
  @Input() className: string;
  @Input() disabled: boolean;
  @Input() content: string;
  constructor() { }

  ngOnInit() {
  }

}
