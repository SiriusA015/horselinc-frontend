import { HLBaseUserModel } from 'app/model/users';
import * as moment from 'moment';

export class HLPaymentModel {
    uid: string;
    invoiceId: string;
    payerId: string;
    // payer: HLBaseUserModel;     // no need to upload
    paymentApproverId?: string;
    // paymentApprover: HLBaseUserModel;    // no need to upload
    serviceProviderId: string;
    // serviceProvider: HLBaseUserModel;    // no need to upload
    amount: number;
    tip: number;
    isPaidOutsideApp: boolean;
    createdAt: string;

    constructor(uid: string, data: any) {
        this.uid = uid;
        this.invoiceId = data.invoiceId;
        this.payerId = data.payerId;
        // this.payer = data.payer;
        this.paymentApproverId = data.paymentApproverId;
        // this.paymentApprover = data.paymentApprover;
        this.serviceProviderId = data.serviceProviderId;
        // this.serviceProvider = data.serviceProvider;
        this.amount = data.amount || 0;
        this.tip = data.tip || 0;
        this.isPaidOutsideApp = data.isPaidOutsideApp || false;
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
    }
}

export interface HLTransfer {
    userId: string;
    amount: number;
    destination: string;
}