import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AlaAppAnalysysService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   * api 4001-運動或生活檔案及時統計分析
   * @param body {any}
   * @author kidin-1100302
   */
  getFileAnalysis(body: any) {
    return this.http.post<any>('api/v2/traffic/getTrackingStatisticsData', body);
	}
	
	/**
   * api 4002-運動、生活、圖床檔案預先統計分析
   * @param body {any}
   * @author kidin-1100302
   */
  getPreAnalysis(body: any) {
    return this.http.post<any>('api/v2/traffic/getTrackingCalculateData', body);
	}

	/**
   * api 4003-查找指定對象或群組的圖床使用量
   * @param body {any}
   * @author kidin-1100302
   */
  getImgAnalysis(body: any) {
    return this.http.post<any>('api/v2/traffic/getGalleryStatisticsData', body);
	}

}
