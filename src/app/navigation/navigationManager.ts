import { FuseNavigation } from '@fuse/types';
import { url } from 'inspector';

export const navigationManager: FuseNavigation[] = [
    {
        id       : 'manager-horses',
        title    : 'Horses',
        translate: 'NAV.HORSES',
        type     : 'item',       
        iconsrc  : 'assets/icons/horselinc/ic-manager-black.svg',
        url      : 'manager/horses',           
    },
    {
        id       : 'manager-payment',
        title    : 'Payment',
        translate: 'NAV.PAYMENT',
        type     : 'item',       
        iconsrc  : 'assets/icons/horselinc/ic-payment-green.svg',   
        url      : 'manager/payments',          
    },
    {
        id       : 'manager-profile',
        title    : 'Profile',
        translate: 'NAV.PROFILE',
        type     : 'item',       
        iconsrc  : 'assets/icons/horselinc/ic-profile-green.svg',
        url      : 'manager/profile',          
    },
    // {
    //     id       : 'schedule',
    //     title    : 'Schedule',
    //     translate: 'NAV.SCHEDULE',
    //     type     : 'item',
    //     iconsrc  : 'assets/icons/horselinc/ic-shedule-black.svg',
    //     url      : '/schedule',
    // },
    {
        id       : 'notification',
        title    : 'Notification',
        translate: 'NAV.NOTIFICATION',
        type     : 'item',
        iconsrc  : 'assets/icons/horselinc/ic-notification-black.svg',
        url      : '/notifications',
    }
];
