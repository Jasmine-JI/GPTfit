import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-train-live',
  templateUrl: './train-live.component.html',
  styleUrls: ['./train-live.component.css']
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
    private coachService: CoachService,
    private utils: UtilsService,
    private router: Router
  ) {}

  ngOnInit() {
    const body = {
      token: this.utils.getToken() || '',
      classType: '7'
    };
    this.coachService.fetchClassRoomList(body).subscribe(res => {
      this.classLists = res.info.classList;
      this.classLists = this.classLists.map(_list => {
        _list.coachAvatar =
          _list.coachAvatar && _list.coachAvatar.length > 0
            ? this.utils.buildBase64ImgString(_list.coachAvatar)
            : '/assets/images/user.png';
        _list.groupDesc = this.handleClassInfo(_list.groupDesc);
        return _list;
      });
    });
  }

  ngAfterViewInit() {
    this.handleEllipsis(this.descElement.nativeElement);
  }

  goToClass(id, type) {
    this.router.navigateByUrl(`/dashboard/coach-dashboard/${id}?type=${type}`);
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
      window.getComputedStyle = function(el: any, pseudo) {
        // this.el = el;
        this.getPropertyValue = function(prop) {
          const re = /(\-([a-z]){1})/g;
          if (prop === 'float') {
            prop = 'styleFloat';
          }
          if (re.test(prop)) {
            prop = prop.replace(re, function() {
              return arguments[2].toUpperCase();
            });
          }
          return el.currentStyle && el.currentStyle[prop]
            ? el.currentStyle[prop]
            : null;
        };
        return this;
      };
    }

    return window.getComputedStyle(elem, null).getPropertyValue(prop);
  }
}
