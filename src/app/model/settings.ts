
import {
    HLPlatformType,
    HLStripeAccountBusinessType,
    HLStripeCardBrand,
    HLStripeExternalAccountType,
    HLUserOnlineStatus,
    HLUserType
} from './enumerations';

/**
 *  Url Model
 */
export class HLUrlsModel {
    terms: string;
    privacy: string;
    constructor(data ?: any) {
        this.terms = data.terms;
        this.privacy = data.privacy;
    }
}


/**
 *  Contact Model
 */
export class HLContactModel {
    contact: string;
    constructor(data ?: any) {
        this.contact = data.contact;
    }
}
export class HLHorseServiceTypeModel{
    key: string;
    value: string;

    constructor(data ?: any) {
        this.key = data.key;
        this.value = data.value;
    }
}
export class HLSettingsModel {

    urls: HLUrlsModel;
    phones: HLContactModel;
    emails: HLContactModel;
    applicationFee: number;
    serviceTypes: HLHorseServiceTypeModel[];

    constructor(data ?: any) {
        data = data || {};
        this.urls = new HLUrlsModel(data.urls);
        this.phones = new HLContactModel(data.phones);
        this.emails = new HLContactModel(data.emails);
        this.applicationFee = data['application-fee'];
        this.serviceTypes = data['service-types'].map((data: any) => new HLHorseServiceTypeModel(data));
    }
}
