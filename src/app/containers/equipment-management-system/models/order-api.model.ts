/**
 * get api order/getList-查詢銷貨單 Response
 */
export interface orderListResponse {
  order: Array<{
    order_no: string;
    user_name: string;
    phone: string;
    address: string;
    sales_channel: string;
    memo: string | null;
    create_name: string;
    create_time: string; //date-time
    modify_name: string | null;
    modify_time: string | null;
    attach_file: string | null;
  }> | null;
  product: Array<{
    order_no: string;
    product_type: string;
    serial_no: string;
    install_date: string; //date
    install_type: string;
    status: string;
    return_exchange?: string | null;
    warranty_start: string; //date
    warranty_end: string; //date
    attach_file?: string | null;
    memo?: string | null;
    create_name: string;
    create_time: string | null;
    modify_name?: string | null;
    modify_time?: string | null;
    register_id?: number | null;
    register_time?: string | null;
    index_id: number;
  }> | null;
  repair: Array<{
    repair_id: number;
    user_name: string;
    e_mail?: string | null;
    phone: string;
    address: string;
    serial_no?: string | null;
    description?: string | null;
    create_name: string;
    create_time: string; //date-time;
    order_no?: string | null;
    status?: string;
  }> | null;
  error: boolean;
  description: string | null;
}

/**
 * get api order/getList-查詢銷貨單 Parameters
 */
export interface orderListParameters {
  order_no?: string;
  item_count?: number;
}

/**
 * get api /register/getList-查詢註冊待審核商品 Parameters
 */
export interface registerListParameters {
  equipment_sn?: number;
  item_count?: number;
}
/**
 * get api /repair_form/getList-查詢叫修單列表/詳細 Parameters
 */
export interface fixReqListParameters {
  repair_id?: number;
  item_count?: number;
}

/**
 * get api /product/getList-查詢產品 Parameters
 */
export interface productListParameters {
  serial_no?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * order/updateOrderInfo 更新銷貨單基本資料
 */
export interface updateOrderInfoBody {
  order_no: string;
  user_name: string;
  phone: string;
  address: string;
  sales_channel: string;
  memo?: string;
  modify_name?: string;
  create_name?: string;
  attach_file?: string;
}
