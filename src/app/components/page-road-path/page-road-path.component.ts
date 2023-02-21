import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RoadPath } from '../../core/models/compo';

@Component({
  selector: 'app-page-road-path',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './page-road-path.component.html',
  styleUrls: ['./page-road-path.component.scss'],
})
export class PageRoadPathComponent {
  @Input() pathList: RoadPath;
}
