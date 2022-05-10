// dev server

export const environment = {
    modeTitle : 'environment',
    production: false,
    staging   : true,
    hmr       : false,
    firebaseConfig : {
        apiKey: 'AIzaSyCTsF9zQFVOokM-DgkDBLQ6dOUkrT97gtA',
        authDomain: 'horselinc-dev.firebaseapp.com',
        databaseURL: 'https://horselinc-dev.firebaseio.com',
        projectId: 'horselinc-dev',
        storageBucket: 'horselinc-dev.appspot.com',
        messagingSenderId: '23680078262',
        appId: '1:23680078262:web:f81a8ac5342e0357'
      },
    googleConfig :  {
        apiKey: 'AIzaSyDlIfxdHeoBsoZz0S9Vp-hj6Y_VnR5EDbY',
        libraries: ['places']
    },
    stripeConfig : {
        apiKey: 'pk_test_SCjKq9ThYF4VfqNSDwwGtE2X'
    },
    apiUrl: 'https://us-central1-horselinc-dev.cloudfunctions.net',
    invoicingURL: 'https://us-central1-horselinc-dev.cloudfunctions.net/api/stripes/accounts/authorize?userId=',
    invoicingRedirectURL: '&redirectUrl=https://staging.app.horselinc.com/'
};

