export enum HLUserOnlineStatus {
    online = 'online',
    offline = 'offline',
    away = 'away'
}

export enum HLUserType {
    provider = 'Service Provider',
    manager = 'Horse Manager'
}

export enum HLPlatformType {
    iOS = 'iOS',
    Android = 'Android',
    Web = 'Web'
}

export enum HLStripeCardBrand {
    visa = 'Visa',
    americanExpress = 'American Express',
    masterCard = 'MasterCard',
    discover = 'Discover',
    jcb = 'JCB',
    dinersClub = 'Diners Club',
    unknown = 'Unknown'
}

export enum HLStripeAccountBusinessType {
    individual = 'individual',
    company = 'company'
}

export enum HLStripeExternalAccountType {
    card = 'card',
    bank = 'bank_account'
}

export enum HLHorseGenderType {
    mare = 'Mare',
    gelding = 'Gelding',
    stallion = 'Stallion'
}

// export enum HLHorseServiceType {
//     trainer = 'Trainer',
//     farrier = 'Farrier',
//     vet = 'Vet',
//     hauling = 'Hauling',
//     braider = 'Braider',
//     clipping = 'Clipping',
//     therapy = 'Therapy',
//     other = 'Other'
// }

export enum HLHorseUserSearchType {
    owner = 'owner',
    trainer = 'trainer'
}

export enum HLServiceRequestStatus {
    pending = 'pending',
    accepted = 'accepted',
    declined = 'declined',
    completed = 'completed',
    deleted = 'deleted',
    invoiced = 'invoiced',
    paid = 'paid'
}

export enum HLInvoiceStatus {
    submitted = 'submitted',
    paid = 'paid',
    fullPaid = 'fullPaid'
}

export enum HLInvoiceMethodType {
    NONE, EMAIL, SMS
}

export enum HLPlatformType {
    IOS = 'iOS',
    ANDROID = 'Android',
    WEB = 'Web'
}
