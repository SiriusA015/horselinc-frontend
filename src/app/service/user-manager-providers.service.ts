import { HttpClient, HttpHeaders} from '@angular/common/http';
import { MatSnackBar } from '@angular/material';
import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

import { HLBaseUserModel, HLHorseManagerProviderModel, HLServiceProviderModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { COLLECTION_HORSE_MANAGER_PROVIDERS } from 'app/model/constants';
import { NgSelectOption } from '@angular/forms';
import { AppService } from './app.service';

@Injectable()
export class UserManagerProvidersService {
    userId: any; // selected user Id    

    managerProviders: HLHorseManagerProviderModel[];
    onManagerProvidersChanged: BehaviorSubject<any>;    
    paymentApprovers: HLHorseManagerPaymentApproverModel[];
    onPaymentApproversChanged: BehaviorSubject<any>;    
    
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    
    constructor(                
        private _httpClient: HttpClient,
        private db: AngularFirestore,         
        private _appService: AppService,
        private _progressBarService: FuseProgressBarService,
    ) {
        // Set the defaults
        this.onManagerProvidersChanged = new BehaviorSubject([]);
        this.managerProviders = [];

        this.onPaymentApproversChanged = new BehaviorSubject([]);
        this.paymentApprovers = [];
    }


    /**
     * Get ManagerProvider data of selected horse
     * @returns {Promise<any>}
     */
    async getManagerProviders(): Promise<any> {
        this._progressBarService.beginLoading2();
        this.managerProviders = [];
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS, ref => ref.where('creatorId', '==', this.userId)).get();
                await queryRef.subscribe((snapshot) => {
                    this.managerProviders = [];
                    snapshot.forEach((doc) => {
                        const provider = {
                            ...doc.data()
                        };    
                        this.managerProviders.push(new HLHorseManagerProviderModel(doc.id, provider));
                    });    
                   
                    this.onManagerProvidersChanged.next(this.managerProviders);
                    resolve();                
                    this._progressBarService.endLoading2();    
                }, reject);                
            } else {  // controller by "new" URL;                
                // this.onManagerProvidersChanged.next(false);
                resolve(false);
                this._progressBarService.endLoading2();
            }
        });
    }
    async addManagerProvider(servieType: string, serviceProvider: HLServiceProviderModel): Promise<any> {
        const managerProvider = {
            serviceType: servieType,
            userId: serviceProvider.userId,
            creatorId: this.userId,
            name: serviceProvider.name,
            location: serviceProvider.location,
            avatarUrl: serviceProvider.avatarUrl,
            phone: serviceProvider.phone,
            createdAt: Date.now()
        };
        // console.log('managerProvider:', managerProvider);
        return new Promise((resolve, reject) => {
        const collectionRef = this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS);
        collectionRef
            .add(managerProvider)
            .then(docRef => {
                // console.log('Horse Manager Provider written with ID: ', docRef.id);
                // add uid to inserted Horse Manager Provider
                const ref = this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS).doc(docRef.id);
                ref.update({
                    uid: docRef.id
                }).then(() => {
                    this.getManagerProviders();
                    resolve();
                });
                
            })
            .catch( error => {
                reject();
            });
        });
    } 

    /**
     * Delete Horse Manager Provider
     *
     * @param Horse Manager Provider
     */
    deleteManagerProvider(managerProvider): Promise<any> {        
        return new Promise((resolve, reject) => {
            // delete Horse Manager Provider
            this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS)
            .doc(managerProvider.uid)
            .delete()
            .then(() => {
                this.getManagerProviders();
                resolve();
            }).catch(error => {
                reject();
            });
        });
    }
}
