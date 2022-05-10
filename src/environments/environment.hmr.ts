// prod server

export const environment = {
    modeTitle : 'environment_hmr',
    production: false,
    staging   : false,
    hmr       : true,
    firebaseConfig: {
        apiKey: 'AIzaSyA8nRmheEAIKbEpqLBqxaQ-PbAQn7dXmyU',
        authDomain: 'horselinc-5b153.firebaseapp.com',
        databaseURL: 'https://horselinc-5b153.firebaseio.com',
        projectId: 'horselinc-5b153',
        storageBucket: 'horselinc-5b153.appspot.com',
        messagingSenderId: '306826103314',
        appId: '1:306826103314:web:ab5dd2db017949d0f866cb'
    },
    googleConfig :  {
        apiKey: 'AIzaSyDlIfxdHeoBsoZz0S9Vp-hj6Y_VnR5EDbY',
        libraries: ['places']
    },
    stripeConfig : {
        apiKey: 'pk_live_sFiDk5GlthNU4OF0rjCRNSSG'
    },
    apiUrl: 'https://us-central1-horselinc-5b153.cloudfunctions.net',
    invoicingURL: 'https://us-central1-horselinc-5b153.cloudfunctions.net/api/stripes/accounts/authorize?userId=',
    invoicingRedirectURL: '&redirectUrl=https://app.horselinc.com/'
};
