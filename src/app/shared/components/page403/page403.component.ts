import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page403',
  templateUrl: './page403.component.html',
  styleUrls: ['./page403.component.css']
})
export class Page403Component implements OnInit, OnDestroy {
  count = 5;
  constructor(private router: Router) {}
  countDown: any;
  ngOnInit() {
    this.countDown = setInterval(() => {
      this.count--;
      if (this.count < 0) {
        this.router.navigate(['/dashboard']);
      }
    }, 1000);
  }
  ngOnDestroy() {
    if (this.count < 0) {
      clearInterval(this.countDown);
    }
  }
}
