import {HLHorseGenderType} from './enumerations';
import {HLHorseManagerModel} from './users';
import * as moment from 'moment';

export class HLHorseOwnerModel extends HLHorseManagerModel {
    uid: string;
    horseId: string;

    constructor(uid: string, data: any) {
        super(data);
        this.uid = uid;
        this.horseId = data.horseId;
    }

    toJSON(): {} {
        const dicObject = Object.assign({}, this, {
            createdAt: moment(this.createdAt).get('second')
        });
        return JSON.parse(JSON.stringify(dicObject));
    }
}

export class HLHorseRegistrationModel {
    index: number;
    name: string;
    number: number;
    constructor(index?: number, name?: string, number?: number) {
        this.index = index || 0;
        this.name = name || '';
        this.number = number || null;
    }
}

export class HLHorseModel {
    uid: string;
    avatarUrl?: string;
    barnName: string;
    displayName: string;
    gender: HLHorseGenderType;
    birthYear?: number;
    trainerId: string;
    trainer?: HLHorseManagerModel;   // no need to upload
    creatorId: string;
    creator?: HLHorseManagerModel;   // no need to upload
    leaserId?: string;
    leaser?: HLHorseManagerModel;    // no need to upload
    owners?: HLHorseOwnerModel[];    // no need to upload
    ownerIds?: string[];
    description?: string;
    privateNote?: string;
    color?: string;
    sire?: string;
    dam?: string;
    height?: number;
    registrations?: HLHorseRegistrationModel[];
    isDeleted: boolean;
    createdAt: String;

    constructor(uid: string, data: any) {
        this.uid = uid || '';
        this.avatarUrl = data.avatarUrl || '';
        this.barnName = data.barnName || '';
        this.displayName = data.displayName || '';
        this.gender = data.gender || '';
        this.birthYear = data.birthYear || 0;
        this.trainerId = data.trainerId;
        this.trainer = data.trainer;
        this.creatorId = data.creatorId;
        this.creator = data.creator;
        this.leaserId = data.leaserId;
        this.leaser = data.leaser;
        this.owners = data.owners || [];
        this.ownerIds = data.ownerIds || [];
        this.description = data.description || '';
        this.privateNote = data.privateNote || '';
        this.color = data.color || '';
        this.sire = data.sire || '';
        this.dam = data.dam || '';
        this.height = data.height || 0;
        this.registrations = data.registrations || [];
        this.isDeleted = data.isDeleted || false;
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
    }

    toJSON(): {} {
        const dicObject = Object.assign({}, this, {
            trainer: this.trainer ? this.trainer.toJSON(false) : undefined,
            creator: this.creator ? this.creator.toJSON(false) : undefined,
            leaser: this.leaser ? this.leaser.toJSON(false) : undefined,
            owners: this.owners ? this.owners.map(value => value.toJSON()) : undefined,
            createdAt: this.createdAt
        });
        return JSON.parse(JSON.stringify(dicObject));
    }
   
    
}

export class HLProviderHorseModel{
        manager?: HLHorseManagerModel; 
        horses: HLHorseModel[];
}
export class HLHorseFilterModel {
    sortType?: string;  
    query?: string;
    checked?: boolean;
    trainer?: HLHorseManagerModel;
    owner?: HLHorseManagerModel;

    constructor(uid: string, data: any) {
        this.sortType = data.sortType || '';
        this.query = data.query || '';
        this.checked = data.checked || false;
        this.trainer = data.trainer;
        this.owner = data.owner;
    }

    toJSON(): {} {
        const dicObject = Object.assign({}, this, {
            trainer: this.trainer ? this.trainer.toJSON(false) : undefined,
            owner: this.owner ? this.owner.toJSON(false) : undefined,
        });
        return JSON.parse(JSON.stringify(dicObject));
    }
}
