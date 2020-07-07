import { Injectable } from '@angular/core';
import { HttpClient  } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetClientIpService {

  ip$ = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {}

  requestJsonp(url, params, callback = 'callback') {
    // options.params is an HttpParams object
    return this.http.jsonp(`${url}?${params}`, callback);
  }

}
