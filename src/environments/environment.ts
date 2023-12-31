// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const isDevelop = false;
const nodejsApiDomain = isDevelop ? 'http://192.168.1.235:3001' : 'https://app.alatech.com.tw:3000';

export const environment = {
  production: false,
  MAPBOX_API_KEY:
    'pk.eyJ1IjoiYnVkZGFsZWUiLCJhIjoiY2o5aDVmbjdzMGo4bDJ3cGd4bmhzYWsydiJ9.lxzLHzTITbvPGDBDnbIKcw',
  url: {
    API_SERVER: `${nodejsApiDomain}/nodejs/api/`,
  },
};
