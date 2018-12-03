import { Component, OnInit, ViewEncapsulation, ViewChild  } from '@angular/core';
// import {} from '@types/googlemaps';
declare var google: any;

@Component({
  selector: 'app-privacy-settings',
  templateUrl: './privacy-settings.component.html',
  styleUrls: ['./privacy-settings.component.scss', '../settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PrivacySettingsComponent implements OnInit {
  isDisplayBox = false;
  @ViewChild('gmap') gmapElement: any;
  // map: google.maps.Map;
  map: any;
  mark: any;
  constructor() {
  }

  ngOnInit() {
    const mapProp = {
      center: new google.maps.LatLng(24.123499, 120.660140),
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    this.mark = new google.maps.Marker({position: mapProp.center, title: '大安'});
    this.mark.setMap(this.map);
  }
  mouseEnter() {
    this.isDisplayBox = true;
  }
  mouseLeave() {
    this.isDisplayBox = false;
  }
}
