type MyArrayType = Array<{
  map_id: number;
  map_name: string;
}>;

export interface RankForms {
  datas: MyArrayType;
  startDate: string;
  endDate: string;
  startDay: string;
  finalDay: string;
  userName: string;
  phone: string;
  mapId: number;
  groupId: string;
  meta: {
    pageSize: string;
    pageCount: number;
    pageNumber: number;
  };
}
