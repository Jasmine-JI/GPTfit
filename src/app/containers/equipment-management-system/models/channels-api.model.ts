/**
 * get api salesChanne/getList-取得銷售通路列表
 */
export interface channelListResponse {
  data: {
    channel_id: number[];
    name: string[];
  };
  error: boolean;
  description?: string | null;
}
