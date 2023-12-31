import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { buildBase64ImgString } from '../../../../core/utils/index';
import { AuthService, Api20xxService } from '../../../../core/services';
import { appPath } from '../../../../app-path.const';
import { QueryString } from '../../../../core/enums/common';
import { SportTypePipe } from '../../../../core/pipes/sport-type.pipe';
import { SafeHtmlPipe } from '../../../../core/pipes/safe-html.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { NgIf, NgStyle, NgFor } from '@angular/common';

@Component({
  selector: 'app-train-live',
  templateUrl: './train-live.component.html',
  styleUrls: ['./train-live.component.scss'],
  standalone: true,
  imports: [NgIf, MatCardModule, NgStyle, NgFor, TranslateModule, SafeHtmlPipe, SportTypePipe],
})
export class TrainLiveComponent implements OnInit, AfterViewInit {
  classLists: any;
  isDemoMode = true;
  demoClassDesc = `
  High-low impact aerobics classes consist of a traditional dance-inspired routine. With low-impact aerobics,
  you always have one foot on the floor. you don't do any jumping or hopping. High-impact aerobics moves at a slower pace,
  but you jump around a lot. High-low combines the two types of routines.`;
  @ViewChild('desc') descElement: ElementRef;

  constructor(
    private router: Router,
    private authService: AuthService,
    private api20xxService: Api20xxService
  ) {}

  ngOnInit() {
    const body = {
      token: this.authService.token,
      classType: '7',
    };
    this.api20xxService.fetchClassRoomList(body).subscribe((res) => {
      this.classLists = res.info.classList;
      this.classLists = this.classLists.map((_list) => {
        _list.coachAvatar =
          _list.coachAvatar && _list.coachAvatar.length > 0
            ? buildBase64ImgString(_list.coachAvatar)
            : '/assets/images/user2.png';
        _list.groupDesc = this.handleClassInfo(_list.groupDesc);
        return _list;
      });
    });
  }

  ngAfterViewInit() {
    this.handleEllipsis(this.descElement.nativeElement);
  }

  goToClass(id, type) {
    const {
      dashboard: { home, coachDashboard },
    } = appPath;
    this.router.navigateByUrl(`/${home}/${coachDashboard}/${id}?${QueryString.type}=${type}`);
  }

  hasOverflow(el, height) {
    const currentHeight = +this.computeStyle(el, 'height').replace('px', '');
    return currentHeight > height;
  }

  handleClassInfo(str) {
    let classInfo = str.replace(/\r\n|\n/g, '').trim();
    if (classInfo.length > 50) {
      classInfo = classInfo.substring(0, 50) + '  ...';
    }
    return classInfo;
  }

  handleEllipsis(el) {
    let text = el.innerText.split(' ');
    while (this.hasOverflow(el, 70) && text.length > 0) {
      text = text.slice(0, -1);
      el.innerText = `${text.join(' ')}...`;
    }
  }

  computeStyle(elem, prop) {
    if (!window.getComputedStyle) {
      window.getComputedStyle = function (el: any, pseudo) {
        // this.el = el;
        this.getPropertyValue = function (prop) {
          const re = /(\-([a-z]){1})/g;
          if (prop === 'float') {
            prop = 'styleFloat';
          }
          if (re.test(prop)) {
            prop = prop.replace(re, function () {
              return arguments[2].toUpperCase();
            });
          }
          return el.currentStyle && el.currentStyle[prop] ? el.currentStyle[prop] : null;
        };
        return this;
      };
    }

    return window.getComputedStyle(elem, null).getPropertyValue(prop);
  }
}
