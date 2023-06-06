import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-connection-error',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './connection-error.component.html',
  styleUrls: ['./connection-error.component.scss'],
})
export class ConnectionErrorComponent {}
