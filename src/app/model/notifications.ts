import {HLBaseUserModel} from './users';
import * as moment from 'moment';

export class HLNotificationModel {
    uid: string;
    creator: HLBaseUserModel;
    message: string;
    receiverId: string;
    // recipient: HLBaseUserModel;   // no need to upload
    isRead: boolean;
    
    updatedAt: string;
    createdAt: string;
    
    constructor(uid: string, data?: any) {
        data = data || {};
        this.uid = uid || '';
        this.creator = new HLBaseUserModel(data.creator) || new HLBaseUserModel();
        // this.recipient = data.recipient ? new HLBaseUserModel(data.recipient) : new HLBaseUserModel();
        this.message = data.message || '';
        this.receiverId = data.receiverId || '';
        this.isRead = data.isRead || false;
        if (data.updatedAt) {
            this.updatedAt = moment(new Date(data.updatedAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.updatedAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
    }
}


