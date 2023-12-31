export interface Events {
  [index: number]: {
    event_id: number;
    event_name: string;
    is_real_time: number;
    is_show_portal: number;
    session_id: number;
    session_name: string;
    time_stamp_start: number;
    start_date: string;
    time_stamp_end: number;
    end_date: string;
    launch_time_stamp: number;
    lanuch_date: string;
    launch_user_name: string;
    description: string;
    event_time_name: string;
    event_time_start: number;
    event_time_end: number;
    is_specific_map: number;
    specific_map: string;
  };
}
