import { appPath } from '../../../app-path.const';

const {
  officialActivity: { home: officialActivityHome, activityList },
  pageNotFound,
  pageNoPermission,
} = appPath;

export const advertiseRatio = parseFloat((840 / 230).toFixed(3));
export const pageNotFoundPath = `/${officialActivityHome}/${pageNotFound}`;
export const pageNoAccessright = `/${officialActivityHome}/${pageNoPermission}`;
export const officialHomePage = `/${officialActivityHome}/${activityList}`;
