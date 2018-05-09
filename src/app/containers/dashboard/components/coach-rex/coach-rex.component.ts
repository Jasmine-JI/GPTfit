import {
  Component,
  OnInit,
  OnDestroy,
  trigger,
  state,
  style,
  transition,
  animate,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { fakeDatas, fakeCoachInfo } from './fakeUsers';
import { CoachService } from '../../services/coach.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { Users } from '../../models/fakeUser';
import { Meta } from '@angular/platform-browser';
import * as d3 from 'd3';

@Component({
  selector: 'app-coach-rex',
  templateUrl: './coach-rex.component.html',
  styleUrls: ['./coach-rex.component.css'],
  animations: [
    trigger('animateState', [
      state(
        '0',
        style({
          backgroundColor: '#009fe1'
        })
      ),
      state(
        '1',
        style({
          backgroundColor: '#00e1b4'
        })
      ),
      state(
        '2',
        style({
          backgroundColor: '#5fe100'
        })
      ),
      state(
        '3',
        style({
          backgroundColor: '#dee100'
        })
      ),
      state(
        '4',
        style({
          backgroundColor: '#e18400'
        })
      ),
      state(
        '5',
        style({
          backgroundColor: '#e14a00'
        })
      ),
      state(
        '6',
        style({
          backgroundColor: '#e10019'
        })
      ),
      transition('* => *', animate('1000ms'))
    ])
  ]
})
export class CoachRexComponent implements OnInit, OnDestroy, AfterViewInit {
  width = 0;
  height = 0;
  fakeDatas: any;
  raceId: string;
  timer: any;
  displayCards = [];
  imgClassess = [];
  method = 2;
  window = window;
  isNotFirstChanged = false;
  isNotFirstDrawed = false;
  renderCards = [];
  coachInfo: string;
  hrSortValues: any;
  hrMeanValue = 0;
  hrColors = [
    '#009fe1',
    '#00e1b4',
    '#5fe100',
    '#dee100',
    '#e18400',
    '#e14a00',
    '#e10019'
  ];
  displaySections = [true, true, true];
  isSectionIndividual = false;
  isMoreDisplay = false;
  radius = 10;
  elementRef: ElementRef;
  data = [];
  defChartIds = [2, 3, 4, 5, 6];
  chartWidth = 0;
  chartHeight = 0;
  s: any;
  time = 0;
  constructor(
    private coachService: CoachService,
    private router: Router,
    private route: ActivatedRoute,
    private meta: Meta,
    elementRef: ElementRef
  ) {
    this.elementRef = elementRef;
  }

  ngOnInit() {
    const ratio = window.devicePixelRatio;
    if (location.host !== '192.168.1.235:8080' && ratio === 3) {
      this.meta.updateTag({
        name: 'viewport',
        content: `width=device-width, initial-scale=${1 / ratio}`
      });
    }
    this.fakeDatas = fakeDatas;
    this.fakeDatas.forEach((_data, idx) => {
      const image = new Image();
      image.addEventListener('load', e => this.handleImageLoad(e, idx));
      image.src = _data.imgUrl;
    });
    this.raceId = this.route.snapshot.paramMap.get('raceId');
    this.handleRealTime();
    this.handleCoachInfo(fakeCoachInfo);
  }

  handleArea(data, scaleX, scaleY, idx) {
    d3
      .area()
      .x(function(d) {
        return scaleX(d[0]);
      })
      .y0(this.chartHeight)
      .y1(function(d) {
        return scaleY(d[idx]);
      })
      .curve(d3.curveCardinal);
  }
  handleLine(data, scaleX, scaleY, idx) {
    d3
      .line()
      .x(function(d) {
        return scaleX(d[0]);
      })
      .y(function(d) {
        return scaleY(d[idx]);
      })
      .curve(d3.curveCardinal);
  }

  updateChart() {
    const s = d3.select('#chart').transition();
    this.chartWidth = 1468;
    this.chartHeight = 450;
    s.attr('width', 1468).attr('height', 518);
    const minX = d3.min(this.data, function(d) {
      return d[0];
    });
    const maxX = d3.max(this.data, function(d) {
      return d[0];
    });
    const minY = d3.min(this.data, function(d) {
      return Math.min(...d.slice(1, d.length));
    });
    const maxY = d3.max(this.data, function(d) {
      return Math.max(...d.slice(1, d.length));
    });

    const scaleX = d3
      .scaleLinear()
      .range([0, this.chartWidth])
      .domain([minX, maxX]);

    const scaleY = d3
      .scaleLinear()
      .range([this.chartHeight, 0])
      .domain([minY - 10, maxY + 10]);
    this.data[this.data.length - 1].forEach((_data, idx) => {
      if (idx > 0) {
        const index = this.displayCards.findIndex(_card => (_card.user_id === this.renderCards[idx - 1]));
        const areaGradient = d3
          .select('#chart')
          .select(`#areaGradient${idx}`);
        areaGradient
          .select(`#stop1areaGradient${idx}`)
          .attr('offset', '0%')
          .attr('stop-color', this.hrColors[this.displayCards[index].colorIdx])
          .attr('stop-opacity', 0.8);
        areaGradient
          .select(`#stop2areaGradient${idx}`)
          .attr('offset', '100%')
          .attr('stop-color', this.hrColors[this.displayCards[index].colorIdx])
          .attr('stop-opacity', 0);
        const line = d3
          .line()
          .x(function(d) {
            return scaleX(d[0]);
          })
          .y(function(d) {
            return scaleY(d[idx]);
          })
          .curve(d3.curveCardinal);
        const area = d3
          .area()
          .x(function(d) {
            return scaleX(d[0]);
          })
          .y0(this.chartHeight)
          .y1(function(d) {
            return scaleY(d[idx]);
          })
          .curve(d3.curveCardinal);

        s
          .select(`#line${idx}`)
          .duration(1000)
          .attr('d', line(this.data))
          .attr('stroke', this.hrColors[this.displayCards[index].colorIdx])
          .attr('stroke-width', 5)
          .attr('fill', 'none')
          .attr('transform', 'translate(35,20)');
        s
          .select(`#area${idx}`)
          .duration(1000)
          .attr('d', area(this.data))
          .attr('fill', `url(#areaGradient${idx})`);

      }

    });
    const start = Math.floor((maxY + 10) / 10) * 10;
    const end = Math.floor((minY - 10) / 10) * 10;

    const tmpArr = this.handleRangeArray(start, end);
    const axisY = d3.axisLeft(scaleY).tickValues(tmpArr);
    d3
      .select('#chart')
      .select('#y-axis')
      .transition()
      .call(axisY);
  }
  handleRangeArray(start, end) {
    const final = (end - start) / 10;
    const arr = [];
    for (let i = 0; i <= final; i++) {
      arr.push(start + 10 * i);
      return arr;
    }

  }
  handleDrawChart() {
    const s = d3.select('#chart');

    this.chartWidth = 1468;
    this.chartHeight = 450;
    s.attr('width', 1468).attr('height', 518);
    const minX = d3.min(this.data, function(d) {
      return d[0];
    });

    if (this.data.length > 0) {
      const maxX = d3.max(this.data, function(d) {
        return d[0];
      });
      const minY = d3.min(this.data, function(d) {
        return Math.min(...d.slice(1, d.length));
      });
      const maxY = d3.max(this.data, function(d) {
        return Math.max(...d.slice(1, d.length));
      });

      const scaleX = d3
        .scaleLinear()
        .range([0, this.chartWidth])
        .domain([minX, maxX]);

      const scaleY = d3
        .scaleLinear()
        .range([this.chartHeight, 0])
        .domain([minY - 10, maxY + 10]);
      this.data[this.data.length - 1].forEach((_data, idx) => {
        if (idx > 0) {
          const index = this.displayCards.findIndex(_card => _card.user_id === this.renderCards[idx - 1]);

          const areaGradient = d3
            .select('#chart')
            .append('defs')
            .append('linearGradient')
            .attr('id', `areaGradient${idx}`)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
          areaGradient
            .append('stop')
            .attr('id', `stop1areaGradient${idx}`)
            .attr('offset', '0%')
            .attr('stop-color', this.hrColors[this.displayCards[index].colorIdx])
            .attr('stop-opacity', 0.8);
          areaGradient
            .append('stop')
            .attr('id', `stop2areaGradient${idx}`)
            .attr('offset', '100%')
            .attr('stop-color', this.hrColors[this.displayCards[index].colorIdx])
            .attr('stop-opacity', 0);
          const line = d3
            .line()
            .x(function(d) {
              return scaleX(d[0]);
            })
            .y(function(d) {
              return scaleY(d[idx]);
            })
            .curve(d3.curveCardinal);
          const area = d3
            .area()
            .x(function(d) {
              return scaleX(d[0]);
            })
            .y0(this.chartHeight)
            .y1(function(d) {
              return scaleY(d[idx]);
            })
            .curve(d3.curveCardinal);
          s
            .append('path')
            .attr('id', `line${idx}`)
            .attr('d', line(this.data))
            .attr('stroke', this.hrColors[this.displayCards[index].colorIdx])
            .attr('stroke-width', 5)
            .attr('fill', 'none')
            .attr('transform', 'translate(35,20)');

          s
            .append('path')
            .attr('id', `area${idx}`)
            .attr('d', area(this.data))
            .attr('fill', `url(#areaGradient${idx})`)
            .attr('transform', 'translate(35,20)');
        }
        // axis
        const axisX = d3.axisBottom(scaleX).ticks(10);

        const start = Math.floor((maxY + 10) / 10) * 10;
        const end = Math.floor((minY - 10) / 10) * 10;
        const axisY = d3
          .axisLeft(scaleY)
          .tickValues(this.handleRangeArray(start, end));

        // grid
        const axisXGrid = d3
          .axisBottom(scaleX)
          .ticks(10)
          .tickFormat('')
          .tickSize(-this.chartHeight, 0);

        const axisYGrid = d3
          .axisLeft(scaleY)
          .ticks(10)
          .tickFormat('')
          .tickSize(-this.chartWidth, 0);

        // Axis Grid line
        s
          .append('g')
          .attr('id', 'y-axis')
          .call(axisY)
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('transform', 'translate(35,20)')
          .selectAll('text')
          // .attr('fill', '#000')
          .attr('stroke', 'none')
          .style('font-size', '10px');
      });

    }
  }
  ngAfterViewInit() {
    this.handleDrawChart();
  }
  ngOnDestroy() {
    clearInterval(this.timer);
    this.meta.updateTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1'
    });
  }

  handleRealTime() {
    let params = new HttpParams();
    params = params.set('raceId', this.raceId);
    this.timer = setInterval(() => {
      this.coachService.fetchRealTimeData(params).subscribe(res => {
        this.displayCards = res;
        if (!this.isNotFirstChanged) {
          this.renderCards = this.displayCards.map(_card => _card.user_id);
          this.isNotFirstChanged = true;
        }
        this.handleMethod();
        this.handleChartHr(this.displayCards);
        let sum = 0;
        this.data.push([(this.time + 1) * 2]);
        this.time++;
        this.displayCards.forEach((_card, idx) => {
          const { current_heart_rate, user_id } = _card;
          const index = this.renderCards.findIndex(_id => _id === user_id);
          const image = new Image();
          image.addEventListener('load', e => this.handleImageLoad(e, idx));
          image.src = _card.imgUrl;
          sum += current_heart_rate;
          this.handleCard(current_heart_rate, idx);
          this.data[this.data.length - 1][index + 1] = current_heart_rate;
        });
        if (this.data.length > 0 && !this.isNotFirstDrawed) {
          this.handleDrawChart();
          this.isNotFirstDrawed = true;
        } else {
          this.updateChart();
        }
        this.hrMeanValue = Math.round(sum / this.displayCards.length);
      });
    }, 2000);
  }
  handleChartHr(arr) {
    this.hrSortValues = [...arr]; // use spread operator deep copy because avoid being immutable
    this.hrSortValues = this.hrSortValues.sort(
      (a, b) => b.current_heart_rate - a.current_heart_rate
    );
  }
  handldeSection(idx) {
    this.isSectionIndividual = !this.isSectionIndividual;
    if (this.isSectionIndividual) {
      if (idx === 0) {
        this.displaySections[0] = true;
        this.displaySections[1] = false;
        this.displaySections[2] = false;
      } else if (idx === 1) {
        this.displaySections[0] = false;
        this.displaySections[1] = true;
        this.displaySections[2] = false;
      } else {
        this.displaySections[0] = false;
        this.displaySections[1] = false;
        this.displaySections[2] = true;
      }
    } else {
      this.displaySections[0] = true;
      this.displaySections[1] = true;
      this.displaySections[2] = true;
    }
    this.handleCoachInfo(fakeCoachInfo);
  }
  handleImageLoad(event, idx): void {
    this.width = event.target.width;
    this.height = event.target.height;
    this.imgClassess[idx] =
      this.width > this.height
        ? 'user-photo--landscape'
        : 'user-photo--portrait';
    if (this.imgClassess[idx] === 'user-photo--landscape') {
      const proportion = this.width / this.height;
      if (proportion > 1.5) {
        this.imgClassess[idx] += ' photo-fit__50';
      } else if (proportion > 1.2) {
        this.imgClassess[idx] += ' photo-fit__25';
      }
    }
  }
  handleCoachInfo(str) {
    const info = str.replace(/\r\n|\n/g, '').trim();
    if (
      info.length > 118 &&
      this.displaySections[0] === true &&
      !this.isSectionIndividual
    ) {
      this.coachInfo = info.substring(0, 118);
      this.isMoreDisplay = true;
    } else {
      this.coachInfo = info;
      this.isMoreDisplay = false;
    }
  }
  handleCard(hr, index) {
    this.displayCards[index].colorIdx = this.displayCards[
      index
    ].zones.findIndex(_val => hr < _val);
    if (this.displayCards[index].colorIdx === -1) {
      this.displayCards[index].colorIdx = 6;
    }
  }
  handleMethod() {
    this.displayCards.forEach((data, index) => {
      this.handleHRZone(index, data.age, data.rest_hr);
    });
  }
  handleHRZone(index, age, rest_hr) {
    this.displayCards[index].zones = [];
    // 最大心律法
    if (this.method === 1) {
      let hrValue = (220 - age) * 0.5;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.6;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.7;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.8;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 0.9;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age) * 1;
      this.displayCards[index].zones.push(hrValue);
    } else {
      // 儲備心率法
      let hrValue = (220 - age - rest_hr) * 0.55 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.6 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.65 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.75 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 0.85 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
      hrValue = (220 - age - rest_hr) * 1 + rest_hr;
      this.displayCards[index].zones.push(hrValue);
    }
  }
  stop() {
    clearInterval(this.timer);
  }
  restart() {
    clearInterval(this.timer);
    this.handleRealTime();
  }
}
