// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  tokenMethod: 'bearer',
  serverUrl: 'http://localhost:3000/shop-api',
  googleClientId: '753467495465-36tbh1dijrp7s2u7tpmsdagf1m074sch.apps.googleusercontent.com',
  facebookClientId: '1031407420958158',
  razorpayId: 'rzp_test_jUxxFtyYqKiDmd',
  googleRedirectUri: 'https://localhost:4200/login',
  facebookRedirectUri: 'https://localhost:4200/login'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
