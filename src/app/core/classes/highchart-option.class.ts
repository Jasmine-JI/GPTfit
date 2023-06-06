import {
  HighchartSetting,
  ChartType,
  DataSetting,
  HighchartSettingTitle,
  HighchartSettingAxis,
  HighchartSettingTooltip,
  HighchartPlotOptions,
  HighchartSettingLegend,
  SeriesOption,
} from '../models/compo';

export class HighchartOption {
  private _option: HighchartSetting = {
    chart: {
      height: 200,
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    // 是否在圖表顯示"Highchart"字樣
    credits: {
      enabled: false,
    },
    xAxis: {},
    yAxis: {},
    plotOptions: {},
    tooltip: {
      valueDecimals: 1,
    },
    series: [],
  };

  /**
   * 現在被區隔的區塊索引（用於圓餅圖）
   */
  private _currentSlicedIndex: number | null = null;

  constructor(type?: ChartType, height?: number) {
    if (type) this.initOption(type);
    if (height) this._option.chart.height = height;
  }

  /**
   * 取得圖表設定
   */
  get option() {
    return this._option;
  }

  /**
   * 設定可放大的方向軸
   * @param type
   */
  set zoomType(type: 'x' | 'y' | 'xy') {
    this._option.chart.zoomType = type;
  }

  /**
   * 變更標題相關設定
   * @param setting {HighchartSettingTitle}-標題設定
   */
  set title(setting: HighchartSettingTitle) {
    this._option.title = { ...this._option.title, ...setting };
  }

  /**
   * 變更圖例相關設定
   * @param setting {HighchartSettingLegend}-圖例設定
   */
  set legend(setting: HighchartSettingLegend) {
    this._option.legend = setting;
  }

  /**
   * 變更圖表繪製相關設定
   * @param setting {HighchartPlotOptions}-圖表繪製設定
   */
  set plotOptions(setting: HighchartPlotOptions) {
    this._option.plotOptions = { ...this._option.plotOptions, ...setting };
  }

  /**
   * 變更提示框相關設定
   * @param setting {HighchartSettingTooltip}-提示框設定
   */
  set tooltip(setting: HighchartSettingTooltip) {
    this._option.tooltip = { ...this._option.tooltip, ...setting };
  }

  /**
   * 變更x軸相關設定
   * @param setting {HighchartSettingAxis}-x軸設定
   */
  set xAxis(setting: HighchartSettingAxis) {
    this._option.xAxis = setting;
  }

  /**
   * 變更y軸相關設定
   * @param setting {HighchartSettingAxis | Array<HighchartSettingAxis>}-y軸設定
   */
  set yAxis(setting: HighchartSettingAxis | Array<HighchartSettingAxis>) {
    this._option.yAxis = setting;
  }

  /**
   * 變更數據列相關設定
   * @param setting {Array<SeriesOption>}-數據列設定
   */
  set series(setting: Array<SeriesOption>) {
    this._option.series = setting;
  }

  /**
   * 將設定初始化
   * @param type {ChartType}-圖表類型
   */
  initOption(type: ChartType) {
    this._option.chart.type = type;
    switch (type) {
      case 'line':
        break;
      case 'spline':
        break;
      case 'column':
        break;
      case 'pie':
        this.legend = { enabled: true, valueDecimals: 1 };
        break;
      case 'area':
        break;
      case 'treemap':
        break;
    }
  }

  /**
   * 取消圓餅圖區塊區隔
   */
  cancelSliced() {
    const { _option, _currentSlicedIndex } = this;
    if (_currentSlicedIndex !== null && _currentSlicedIndex > -1) {
      const assignData = _option.series[0].data[_currentSlicedIndex] as DataSetting;
      assignData.sliced = false;
      assignData.borderColor = 'rgba(255, 255, 255, 0)';
    }
  }

  /**
   * 將指定區塊區隔出來
   * @param index {number}-指定的索引
   */
  assignSliced(index: number) {
    const { _option } = this;
    this.cancelSliced();
    if (index > -1) {
      (_option.series[0].data[index] as DataSetting).sliced = true;
      (_option.series[0].data[index] as DataSetting).borderColor = 'rgba(255, 0, 0, 0.7)';
      this._currentSlicedIndex = index;
    }
  }
}
