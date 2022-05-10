import * as moment from 'moment';

export class HLPhoneContactModel {

    id: string;
    name: string;
    photoUri: string;
    emails: string[];
    phoneNumbers: string[];

    constructor(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.photoUri = data.photoUri;
        this.emails = data.emails;
        this.phoneNumbers = data.phoneNumbers;
    }
}
