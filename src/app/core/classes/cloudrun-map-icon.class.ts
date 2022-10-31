import { MarkerOption } from '../models/compo';

const google: any = (window as any).google || { maps: { OverlayView: null } };
const leaflet = globalThis.L;

/**
 * 自定義google map mark
 * @refrence https://developers.google.com/maps/documentation/javascript/examples/overlay-popup
 */
export class RacerMarkInGoogleMap extends google.maps.OverlayView {
  private _position: [number, number]; // 該mark gpx位置
  private _option: MarkerOption;
  private _divElement: HTMLDivElement;
  private _offset = 15;
  private _imgElement: HTMLImageElement;

  constructor(position: any, option: MarkerOption) {
    super();
    this.initialize(position, option);
  }

  /**
   * 初始化自定義mark
   * @param position {any}-標記位置
   * @param option {MarkerOption}-標記設定
   */
  initialize(position: any, option: MarkerOption) {
    this._position = position;
    this._option = option;
    this.createCustomIcon();
  }

  /**
   * 建立leaflet自定義icon
   */
  createCustomIcon(focus = false) {
    const { name, color, imgUrl } = this._option;
    this._divElement = document.createElement('div');
    this._divElement.className = 'custom__mark';
    this._imgElement = document.createElement('img');
    const iconSize = this.getIconSize(focus);
    this._imgElement.src = imgUrl;
    this._imgElement.title = name;
    this._imgElement.style.border = `3px solid ${color}`;
    this._imgElement.style.borderRadius = '50%';
    this._imgElement.style.height = `${iconSize}px`;
    this._imgElement.style.width = `${iconSize}px`;
    this._imgElement.onerror = () => {
      this._imgElement.src = '/assets/images/user2.png';
    };
    this._divElement.appendChild(this._imgElement);

    // Optionally stop clicks, etc., from bubbling up to the map.
    RacerMarkInGoogleMap.preventMapHitsAndGesturesFrom(this._divElement);
  }

  /**
   * Called when the CustomIcon is removed from the map.
   */
  onRemove() {
    if (this._divElement.parentElement) {
      this._divElement.parentElement.removeChild(this._divElement);
    }
  }

  /**
   * Called when the CustomIcon is added to the map.
   */
  onAdd() {
    this.getPanes().floatPane.appendChild(this._divElement);
  }

  /**
   * 移動mark至指定位置
   * @param next {google.maps.LatLng}-欲移動之座標
   * @author kidin-1100329
   *
   */
  move(next: any) {
    this._position = next;
    this.draw();
  }

  /**
   * 調整icon大小
   * @param focus {boolean}-是否聚焦
   */
  adjustIconSize(focus = false) {
    const size = this.getIconSize(focus);
    this._imgElement.style.height = `${size}px`;
    this._imgElement.style.width = `${size}px`;
    this._offset = size / 2;
    this.draw();
  }

  /**
   * 取得icon大小
   * @param focus {boolean}-是否聚焦
   */
  getIconSize(focus = false) {
    return focus ? 50 : 30;
  }

  /**
   * Called each frame when the CustomIcon needs to draw itself.
   */
  draw() {
    if (this.getProjection()) {
      const divPosition = this.getProjection().fromLatLngToDivPixel(this._position);

      // Hide the CustomIcon when it is far out of view.
      const display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? 'block' : 'none';
      if (display === 'block') {
        this._divElement.style.left = `${divPosition.x - this._offset}px`;
        this._divElement.style.top = `${divPosition.y - this._offset}px`;
      }

      if (this._divElement.style.display !== display) {
        this._divElement.style.display = display;
      }
    }
  }
}

/**
 * 自定義leaflet map mark
 * @refrence https://leafletjs.com/reference.html#icon
 */
export class RacerMarkInLeafletMap {
  private _position: [number, number]; // 該mark gpx位置
  private _option: MarkerOption;
  private _mapMarker: any;

  constructor(position: any, option: MarkerOption) {
    this.initialize(position, option);
  }

  /**
   * 取得標記物件
   */
  get mapMarker() {
    return this._mapMarker;
  }

  /**
   * 初始化自定義mark
   * @param position {any}-標記位置
   * @param option {MarkerOption}-標記設定
   */
  initialize(position: any, option: MarkerOption) {
    this._position = position;
    this._option = option;
    const mapIcon = this.createCustomIcon();
    this._mapMarker = leaflet.marker(this._position, { icon: mapIcon });
  }

  /**
   * 建立leaflet自定義icon
   */
  createCustomIcon(focus = false) {
    const { name, color, imgUrl } = this._option;
    const divElement = document.createElement('div');
    const imgElement = document.createElement('img');
    const iconSize = this.getIconSize(focus);
    imgElement.src = imgUrl;
    imgElement.title = name;
    imgElement.style.border = `3px solid ${color}`;
    imgElement.style.borderRadius = '50%';
    imgElement.style.height = `${iconSize}px`;
    imgElement.style.width = `${iconSize}px`;
    imgElement.onerror = () => {
      imgElement.src = '/assets/images/user2.png';
    };
    divElement.appendChild(imgElement);
    return leaflet.divIcon({
      html: divElement.innerHTML,
      iconSize,
      className: 'custom__user__mark',
    });
  }

  /**
   * 繪製移動
   * @param position {[number, number]}-[緯度, 經度]
   */
  move(position: [number, number]): void {
    this._position = position;
    this._mapMarker.setLatLng(position);
  }

  /**
   * 移除標記
   */
  remove() {
    this._mapMarker.remove();
  }

  /**
   * 調整icon大小
   */
  adjustIconSize(focus: boolean) {
    const mapIcon = this.createCustomIcon(focus);
    this._mapMarker.setIcon(mapIcon);
  }

  /**
   * 取得icon大小
   * @param focus {boolean}-是否聚焦
   */
  getIconSize(focus = false) {
    return focus ? 50 : 30;
  }
}
