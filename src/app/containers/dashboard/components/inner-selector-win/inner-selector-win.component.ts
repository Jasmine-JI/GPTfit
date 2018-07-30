import { Component, OnInit, Inject, EventEmitter, Output, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-inner-selector-win',
  templateUrl: './inner-selector-win.component.html',
  styleUrls: ['./inner-selector-win.component.css']
})
export class InnerSelectorWinComponent implements OnInit {
  @Output() onConfirm: EventEmitter<any> = new EventEmitter();
  
  get title() {
    return this.data.title;
  }

  get body() {
    return this.data.body;
  }

  get href() {
    return this.data.href;
  }
  get onChange() {
    return this.data.onDelete;
  }
  areaType: number;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}
  @HostListener('document:click')
  onClick() {
    this.areaType = 0;
  }
  ngOnInit() {}
  confirm() {
    this.onConfirm.emit();
    if (this.href) {
      this.router.navigateByUrl(this.href);
    }
    this.dialog.closeAll();
  }
  handleBtnColor(_areaType, e) {
    e.stopPropagation();
    this.areaType = _areaType;
  }

}
