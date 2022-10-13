/**
 * 用來取得 google 或 leaflet 地圖路線在視圖中的相對位置
 */
export class MapReservedSpace {
  private _boundaryTop: number | null = null;
  private _boundaryBottom: number | null = null;
  private _boundaryLeft: number | null = null;
  private _boundaryRight: number | null = null;
  private _bottomReservedPercentage = 0.2;

  /**
   * 儲存路線最高與最低的緯度
   */
  set boundaryLat(lat: number) {
    const { _boundaryTop, _boundaryBottom } = this;
    if (!_boundaryTop || _boundaryTop < lat) this._boundaryTop = lat;
    if (!_boundaryBottom || _boundaryBottom > lat) this._boundaryBottom = lat;
  }

  /**
   * 儲存路線最西與最東的經度
   */
  set boundaryLng(lng: number) {
    const { _boundaryLeft, _boundaryRight } = this;
    if (!_boundaryLeft || _boundaryLeft > lng) this._boundaryLeft = lng;
    if (!_boundaryRight || _boundaryRight < lng) this._boundaryRight = lng;
  }

  /**
   * 設定地圖下方保留區塊的比例
   */
  set bottomReservedPercentage(percentage: number) {
    this._bottomReservedPercentage = percentage;
  }

  /**
   * 取得視角中心點
   */
  get mapCenter() {
    const {
      _boundaryTop,
      _boundaryBottom,
      _boundaryLeft,
      _boundaryRight,
      _bottomReservedPercentage,
    } = this;
    const horizonCenter = ((_boundaryLeft as number) + (_boundaryRight as number)) / 2;
    // 將整體路線在顯示中向上偏移，以留給圖表
    const space =
      ((_boundaryTop as number) - (_boundaryBottom as number)) * _bottomReservedPercentage;
    const verticalCenter = (_boundaryBottom as number) - space;
    return { horizonCenter, verticalCenter };
  }
}
