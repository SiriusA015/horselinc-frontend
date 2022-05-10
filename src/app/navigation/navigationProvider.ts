import { FuseNavigation } from '@fuse/types';
import { url } from 'inspector';

export const navigationProvider: FuseNavigation[] = [
    {
        id       : 'provider-horses',
        title    : 'Horses',
        translate: 'NAV.HORSES',
        type     : 'item',       
        iconsrc  : 'assets/icons/horselinc/ic-manager-black.svg',
        url      : 'provider/horses',           
    },
    {
        id       : 'provider-payment',
        title    : 'Payment',
        translate: 'NAV.PAYMENT',
        type     : 'item',       
        iconsrc  : 'assets/icons/horselinc/ic-payment-green.svg',   
        url      : 'provider/payments',          
    },
    {
        id       : 'provider-profile',
        title    : 'Profile',
        translate: 'NAV.PROFILE',
        type     : 'item',       
        iconsrc  : 'assets/icons/horselinc/ic-profile-green.svg',
        url      : 'provider/profile',          
    },
    {
        id       : 'schedule',
        title    : 'Schedule',
        translate: 'NAV.SCHEDULE',
        type     : 'item',
        iconsrc  : 'assets/icons/horselinc/ic-shedule-black.svg',
        url      : '/schedules',
    },
    {
        id       : 'notification',
        title    : 'Notification',
        translate: 'NAV.NOTIFICATION',
        type     : 'item',
        iconsrc  : 'assets/icons/horselinc/ic-notification-black.svg',
        url      : '/notifications',
    }
];
