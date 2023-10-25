import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, catchError } from 'rxjs';
import { throwRxError } from '../../../core/utils';
import { channelListResponse } from '../models/channels-api.model';
import {
  fixReqListParameters,
  orderListParameters,
  orderListResponse,
  productListParameters,
  registerListParameters,
  updateOrderInfoBody,
} from '../models/order-api.model';

@Injectable({
  providedIn: 'root',
})
export class EquipmentManagementService {
  orderParameters$ = new ReplaySubject(1);
  productParameters$ = new ReplaySubject(1);
  fixReqParameters$ = new ReplaySubject(1);
  channelList$ = new BehaviorSubject<any>(null);
  orderDetail$ = new BehaviorSubject<orderListResponse>(null);
  prodDetail$ = new BehaviorSubject<any>(null);
  fixReqDetail$ = new BehaviorSubject<any>(null);
  targetProdInfo$ = new BehaviorSubject<any>(null);
  partsList$ = new BehaviorSubject<any>(null);
  constructor(private http: HttpClient) {}

  /**
   * get api /ems/order/getList-查詢訂貨單
   * @param body {orderListResponse}
   */
  getOrderListApi(body: orderListParameters): Observable<orderListResponse> {
    let orderParams = new HttpParams();

    if (body.item_count !== null && body.item_count !== undefined) {
      orderParams = orderParams.set('item_count', body.item_count);
    }

    if (body.order_no !== null && body.order_no !== undefined) {
      orderParams = orderParams.set('order_no', body.order_no);
    }
    // console.log(orderParams);

    return this.http.get<orderListResponse>('/ems/order/getList', { params: orderParams }).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * post api /ems/order/updateOrderInfo 修改銷貨單
   * @param body
   * @returns
   */
  updateOrderInfoApi(body: updateOrderInfoBody) {
    return this.http.post<any>('/ems/order/updateOrderInfo', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   *  post api /ems/order/addNewOrder 新增銷貨單
   * @param body
   * @returns
   */
  addOrderInfoApi(body: updateOrderInfoBody) {
    return this.http.post<any>('/ems/order/addNewOrder', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   *  delete api /ems/order?order_no=? 刪除銷貨單
   * @param body
   * @returns
   */
  deleteOrderApi(order_no: any) {
    let deleteOrderParams = new HttpParams();
    if (order_no !== null && order_no !== undefined) {
      deleteOrderParams = deleteOrderParams.set('order_no', order_no);
      // console.log('deleteOrderParams:', deleteOrderParams);
    }
    return this.http.delete<any>('/ems/order', { params: deleteOrderParams }).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * post api 新增銷貨單產品
   * @param body
   * @returns
   */
  addOrderProdApi(body: any) {
    return this.http.post<any>('/ems/order/addNewProductInfo', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * post api 修改銷貨單產品
   * @param body
   * @returns
   */
  updateOrderProdApi(body: any) {
    return this.http.post<any>('/ems/order/updateProductInfo', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * 儲存API回傳之銷貨單詳細頁資料/銷貨單列表
   * @param orderDetail
   */
  setOrderDetail(orderDetail: orderListResponse) {
    this.orderDetail$.next(orderDetail);
  }

  /**
   * 取得已儲存之銷貨單詳細頁資料/銷貨單列表
   * @param orderDetail
   */
  getOrderDetail() {
    return this.orderDetail$;
  }

  /**
   * 儲存API回傳之叫修單詳細頁資料
   * @param fixReqDetail
   */
  setFixReqDetail(fixReqDetail: any) {
    this.fixReqDetail$.next(fixReqDetail);
  }

  /**
   * 新增銷售通路
   * post api /ems/salesChannel/addChannel
   * @returns
   */
  addSalesChannelsApi(name: string) {
    return this.http.post<any>(`/ems/salesChannel/addChannel?name=${name}`, name).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * 刪除銷售通路
   * post api /ems/salesChannel
   * @returns
   */
  deleteSalesChannelsApi(channel_id: any) {
    return this.http.delete<any>(`/ems/salesChannel?channel_id=${channel_id}`).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }
  /**
   * 修改銷售通路
   * post api /ems/salesChannel/updateChannelName
   * @returns
   */
  updateSalesChannelsApi(channel_id: any, name: string) {
    if (channel_id && name) {
      const updateSalesChannelParams = new HttpParams()
        .set('channel_id', channel_id)
        .set('name', name);
      // console.log('updateSalesChannelParams:', updateSalesChannelParams);
      return this.http
        .post<any>(`/ems/salesChannel/updateChannelName`, null, {
          params: updateSalesChannelParams,
        })
        .pipe(
          catchError((err) => {
            return throwRxError(err);
          })
        );
    }
  }

  /**
   * get api 查詢銷售通路列表
   * @returns
   */
  getSalesChannelsApi() {
    return this.http.get<channelListResponse>('/ems/salesChannel/getList').pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * 儲存銷售通路列表
   */
  setSalesChannels(channelList: any) {
    this.channelList$.next(channelList);
  }

  /**
   * 取得銷售通路列表
   * @returns
   */
  getSalesChannels() {
    return this.channelList$;
  }

  /**
   * 儲存 getOrderList 所需 Parameters
   * @param orderParameters
   */
  setOrderParameters(orderParameters: orderListParameters) {
    this.orderParameters$.next(orderParameters);
  }

  /**
   * 儲存 getProductList 所需 Parameters
   * @param orderParameters
   */
  setEquipParameters(productParameters: productListParameters) {
    this.productParameters$.next(productParameters);
  }

  /**
   * 儲存 getFixReqList 所需 Parameters
   * @param fixReqParameters
   */
  setFixReqParameters(fixReqParameters: fixReqListParameters) {
    this.fixReqParameters$.next(fixReqParameters);
  }

  /**
   * get api /ems/product/getList-查詢產品設備
   */
  getProdDetailApi(body: productListParameters): Observable<any> {
    let productParams = new HttpParams();

    if (body.serial_no !== null && body.serial_no !== undefined) {
      productParams = productParams.set('serial_no', body.serial_no);
    }

    if (body.start_date !== null && body.start_date !== undefined) {
      productParams = productParams.set('start_date', body.start_date);
    }
    if (body.end_date !== null && body.end_date !== undefined) {
      productParams = productParams.set('end_date', body.end_date);
    }
    // console.log(productParams);

    return this.http.get<any>('/ems/product/getList', { params: productParams }).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * 儲存API回傳之產品設備詳細頁資料/產品設備列表
   * @param prodDetail
   */
  setProdDetail(prodDetail: any) {
    this.prodDetail$.next(prodDetail);
  }

  /**
   * 儲存銷貨單連結之設備詳細頁資料
   * @param prodDetail
   */
  setTargetProdInfo(targetProdInfo: any) {
    this.targetProdInfo$.next(targetProdInfo);
  }

  uploadImageApi(url: any, dataType: string) {
    return this.http.post<any>(`/ems/uploadImage?datatype=${dataType}`, url).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   *  get api /ems/register/getList-查詢註冊待審核商品
   */
  getRegisterListApi(body: registerListParameters) {
    let registerParams = new HttpParams();

    if (body.item_count !== null && body.item_count !== undefined) {
      registerParams = registerParams.set('item_count', body.item_count);
    }

    if (body.equipment_sn !== null && body.equipment_sn !== undefined) {
      registerParams = registerParams.set('equipment_sn', body.equipment_sn);
    }
    // console.log(registerParams);

    return this.http.get<any>('/ems/register/getList', { params: registerParams }).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * get api /ems/repair_form/getList-查詢叫修單列表/詳細
   */
  getFixReqListApi(body: fixReqListParameters) {
    let registerParams = new HttpParams();

    if (body.item_count !== null && body.item_count !== undefined) {
      registerParams = registerParams.set('item_count', body.item_count);
    }

    if (body.repair_id !== null && body.repair_id !== undefined) {
      registerParams = registerParams.set('repair_id', body.repair_id);
    }
    // console.log(registerParams);

    return this.http.get<any>('/ems/repair_form/getList', { params: registerParams }).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * 取得已儲存之叫修單詳細頁資料
   * @returns
   */
  getFixReqDetail() {
    return this.fixReqDetail$;
  }

  /**
   *  post api /ems/repair_form/addRepairForm 新增叫修單
   * @param body
   * @returns
   */
  addFixReqfoApi(body: any) {
    return this.http.post<any>('/ems/repair_form/addRepairForm', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * post api /ems/repair_form/updateRepairForm 修改叫修單
   * @param body
   * @returns
   */
  updateFixReqApi(body: any) {
    return this.http.post<any>('/ems/repair_form/updateRepairForm', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   *  post api /ems/repair_form/addRepairInfo 新增維修單
   * @param body
   * @returns
   */
  addRepairInfodApi(body: any) {
    return this.http.post<any>('/ems/repair_form/addRepairInfo', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * post api /ems/repair_form/updateRepairInfo 修改維修單
   * @param body
   * @returns
   */
  updateRepairInfoApi(body: any) {
    return this.http.post<any>('/ems/repair_form/updateRepairInfo', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * get api /ems/parts/getList 取得零件列表
   * @param body
   * @returns
   */
  getpartListstApi() {
    return this.http.get<any>('/ems/parts/getList').pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   *  儲存已取得之零件列表
   * @param body
   * @returns
   */
  setpartListst(partsList: any) {
    this.partsList$.next(partsList);
  }

  /**
   *  取得已儲存之零件列表
   * @param body
   * @returns
   */
  getSavedpartListst() {
    return this.partsList$;
  }

  /**
   * post api /ems/parts/addNewParts 新增料件
   * @param body
   * @returns
   */
  addNewPartsApi(body: any) {
    return this.http.post<any>('/ems/parts/addNewParts', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }

  /**
   * post api /ems/parts/updatePartsList 修改料件列表
   * @param body
   * @returns
   */
  updatePartsListApi(body: any) {
    return this.http.post<any>('/ems/parts/updatePartsList', body).pipe(
      catchError((err) => {
        return throwRxError(err);
      })
    );
  }
}
