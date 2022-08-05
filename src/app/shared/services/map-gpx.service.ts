import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
const { API_SERVER } = environment.url;

const apiToken = environment.MAPBOX_API_KEY;
declare let omnivore: any;
declare let L: any;

const defaultCoords: number[] = [40, -80];
const defaultZoom = 8;

@Injectable()
export class MapGPXService {
  gpxs: any;
  constructor(private http: HttpClient) {}

  getActivity(id: number) {
    return this.http.get(API_SERVER + 'map/gpxUrl').subscribe(datas => {
      this.gpxs = datas;
      return this.gpxs.slice(0).find(run => run.id === id);
    });
  }

  plotActivity(id: number) {
    this.http.get(API_SERVER + 'map/gpxUrl').subscribe(datas => {
      this.gpxs = datas;

      const myStyle = {
        color: '#ff0035',
        weight: 5,
        opacity: 0.95
      };

      const map = L.map('map').setView(defaultCoords, defaultZoom);
      map.maxZoom = 100;

      L.tileLayer(
        'https://api.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
        {
          attribution: `Map data &copy;
          <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,
          <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,
          Imagery © <a href="http://mapbox.com">Mapbox</a>`,
          maxZoom: 18,
          id: 'mapbox.satellite',
          accessToken: apiToken
        }
      ).addTo(map);

      const customLayer = L.geoJson(null, {
        style: myStyle
      });

      const gpxLayer = omnivore
        .gpx(
          this.gpxs.slice(0).find(run => run.id === id).gpxData,
          null,
          customLayer
        )
        .on('ready', function() {
          map.fitBounds(gpxLayer.getBounds());
        })
        .addTo(map);
    });

  }
}
