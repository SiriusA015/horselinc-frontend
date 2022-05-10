import {HLHorseManagerModel, HLListenerUserModel, HLServiceProviderModel, HLServiceProviderServiceModel} from './users';
import {HLServiceRequestStatus} from './enumerations';
import {HLHorseModel} from './horses';
import * as moment from 'moment';
import { HLInvoiceShareInfo } from './invoices';

export class HLServiceRequestModel {
    uid: string;
    horseId: string;
    horseBarnName: string;
    horseDisplayName: string;
    horse?: HLHorseModel;   // no need to upload
    showId?: string;
    show?: HLServiceShowModel;
    competitionClass?: string;
    serviceProviderId: string;
    serviceProvider?: HLServiceProviderModel;   // no need to upload
    assignerId?: string;
    assigner?: HLServiceProviderModel;  // no need to upload
    services: HLServiceProviderServiceModel[];
    payer?: HLHorseManagerModel;    // no need to upload
    instruction?: string;
    providerNote?: string;
    status: HLServiceRequestStatus;

    // custom invoice
    // invoiceId: string;  // no need to upload
    isCustomRequest?: boolean;
    // dismissed ids
    dismissedBy?: string[];

    listenerUsers?: HLListenerUserModel[];

    creatorId: string;
    creator?: HLHorseManagerModel;  // no need to upload

    shareInfo: HLInvoiceShareInfo;

    requestDate: string;
    createdAt: string;
    updatedAt: string;

    constructor(uid: string, data?: any) {
        data = data || {};
        this.uid = uid || '';
        this.horseId = data.horseId;
        this.horse = data.horse;
        this.horseBarnName = data.horseBarnName || '';
        this.horseDisplayName = data.horseDisplayName || '';
        this.showId = data.showId;
        this.show = data.show;
        this.competitionClass = data.competitionClass || '';
        this.serviceProviderId = data.serviceProviderId;
        this.serviceProvider = data.serviceProvider;
        // this.serviceProvider = data.serviceProvider;
        this.assignerId = data.assignerId;
        this.assigner = data.assigner;
        this.services = data.services ? data.services.map((value: any) => new HLServiceProviderServiceModel(value.uid, value)) : [];

        this.payer = data.payer;

        this.instruction = data.instruction || '';
        this.providerNote = data.providerNote || '';
        this.status = data.status || HLServiceRequestStatus.pending;

        this.isCustomRequest = data.isCustomRequest || false;
        this.dismissedBy = data.dismissedBy;

        // this.invoiceId = data.invoiceId;
        
        this.listenerUsers = data.listenerUsers;

        this.creatorId = data.creatorId;
        this.creator = data.creator;

        this.shareInfo = data.shareInfo || null;

        if (data.requestDate) {
            this.requestDate = moment(new Date(data.requestDate)).format('MM/DD/YYYY');
        } else {
            this.requestDate =  moment(new Date()).format('MM/DD/YYYY');
        }
        
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt =  moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
        if (data.updatedAt) {
            this.updatedAt = moment(new Date(data.updatedAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.updatedAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
    }

    toJSON(): {} {
        const dicObject = Object.assign({}, this, {
            horse: this.horse ? this.horse.toJSON() : undefined,
            show: this.show ? this.show.toJSON() : undefined,
            assigner: this.assigner ? this.assigner.toJSON(false) : undefined,
            serviceProvider: this.serviceProvider ? this.serviceProvider.toJSON() : undefined,
            // serviceProvider: this.serviceProvider ? this.serviceProvider.toJSON(false) : undefined,
            // assigner: this.assigner ? this.assigner.toJSON(false) : undefined,
            services: this.services.map(value => value.toJSON()),
            payer: this.payer ? this.payer.toJSON(false) : undefined,
            creator: this.creator ? this.creator.toJSON(false) : undefined,
            requestDate: moment(this.requestDate).get('second'),
            createdAt: moment(this.createdAt).get('second'),
            updatedAt: moment(this.updatedAt).get('second')
        });
        return JSON.parse(JSON.stringify(dicObject));
    }

    totalAmount(): number {
        let totalAmount = 0;
        this.services.forEach(service => {
            totalAmount += service.rate * (service.quantity || 1);
        });
        return totalAmount;
    }
}

export class HLServiceShowModel {
    uid: string;
    name: string;
    createdAt: string;

    constructor(uid: string, data: any) {
        this.uid = uid;
        this.name = data.name;
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
    }

    toJSON(): {} {
        const dicObject = Object.assign({}, this, {
            createdAt: moment(new Date(this.createdAt))
        });
        return JSON.parse(JSON.stringify(dicObject));
    }
}
