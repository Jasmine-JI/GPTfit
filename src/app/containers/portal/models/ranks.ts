type RankArrayType = Array<{
  rank: number;
  offical_time: string;
  user_id: number;
  map_id: number;
  gender: number;
  month: string;
  login_acc: string;
  map_name: string;
  race_category: string;
  race_total_distance: number;
  e_mail: string;
  phone: number;
}>;

export interface Ranks {
  datas: RankArrayType;
  meta: {
    pageSize: string;
    pageCount: number;
    pageNumber: number;
  };
}

type EventArrayType = Array<{
  offical_time: string;
  user_id: number;
  map_id: number;
  gender: number;
  login_acc: string;
  map_name: string;
  e_mail: string;
  phone: number;
}>;

export interface EventRanks {
  datas: EventArrayType;
  meta: {
    pageSize: number;
    pageCount: number;
    pageNumber: number;
  };
}
