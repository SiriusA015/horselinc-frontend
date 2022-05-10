import { MatSnackBar } from '@angular/material';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

import { HLServiceProviderServiceModel } from 'app/model/users';
import { COLLECTION_SERVICE_PROVIDER_SERVICES } from 'app/model/constants';
import { AppService } from './app.service';

@Injectable()
export class UserProviderServicesService {
    userId: any; // selected user Id    
    serviceModel: HLServiceProviderServiceModel ;
    onProviderServicesChanged: BehaviorSubject<any>;    
    providerServices: HLServiceProviderServiceModel[];
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(                
        private db: AngularFirestore,
        private _appService: AppService,
        private _progressBarService: FuseProgressBarService,
    ) {
        // Set the defaults
        this.onProviderServicesChanged = new BehaviorSubject([]);
        this.providerServices = [];
        this.serviceModel = new HLServiceProviderServiceModel('', {});
    }

    /**
     * Get ProviderService data of selected horse
     * @returns {Promise<any>}
     */
    async getProviderServices(): Promise<any> {        

        this._progressBarService.beginLoading2();
      
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, ref => ref.where('userId', '==', this.userId)).get();
                await queryRef.subscribe((snapshot) => {

                    this.providerServices = [];

                    snapshot.forEach((doc) => {
                        const service = {
                            ...doc.data()
                        };                                 
                        this.providerServices.push(new HLServiceProviderServiceModel(doc.id, service));
                    });    
                    this.onProviderServicesChanged.next(this.providerServices);
                    resolve(this.providerServices);                    
                    this._progressBarService.endLoading2();

                }, reject);                
            } else {  // controller by "new" URL;                
                this.onProviderServicesChanged.next(false);
                resolve(false);
                this._progressBarService.endLoading2();

            }
        });
    }
    
    /**
     * Update ProviderService
     *
     * @param providerServiceForm
     * @returns {Promise<any>}
     */
    updateProviderService(providerService): Promise<any> {
        
        this.serviceModel.uid = providerService.uid;
        this.serviceModel.userId = this.userId;
        this.serviceModel.service = providerService.service;
        this.serviceModel.rate = providerService.rate;
        this.serviceModel.quantity = 1;
        
        return new Promise((resolve, reject) => {
        
            // update Service Provider Service
            const collectionRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES).doc(providerService.uid);
            collectionRef
                .set(this.serviceModel.toJSON(), {merge: true})
                .then(() => {
                    this.getProviderServices();
                    resolve();
                })
                .catch( error => {
                    console.error('Error updating horse service: ', error);
                    reject();
                });
            
        });
    }

    /**
     * Create Provider Service
     *
     * @param providerServiceForm
     * @returns {Promise<any>}
     */
    async createProviderService(providerService): Promise<any> {
        
        return new Promise(async (resolve, reject) => {
            // check duplicate
            const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, 
                ref => ref.where('userId', '==', this.userId).where('service', '==', providerService.service)).get();
            await queryRef.subscribe((snapshot) => {
                if (snapshot.size) { // if duplicated
                    // Show the error message
                    this._appService.showSnackBar('Service is already exists. please input another Service.', 'OK');
                    resolve();
                } else {

                    this.serviceModel.uid = providerService.uid;
                    this.serviceModel.userId = this.userId;
                    this.serviceModel.service = providerService.service;
                    this.serviceModel.rate = providerService.rate;
                    this.serviceModel.quantity = 1;

                    // insert providerService
                    const collectionRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES);
                    collectionRef
                        .add(this.serviceModel.toJSON())
                        .then(docRef => {
                            // add uid to inserted horse providerService
                            const ref = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES).doc(docRef.id);
                            ref.update({
                                uid: docRef.id
                            }).then(() => {
                                this.getProviderServices();
                                resolve();
                            });
                           
                        })
                        .catch( error => {
                            console.error('Error adding service: ', error);
                            reject();
                        });
                }
            });        
            
        });

    }


    /**
     * Delete Service Provider Service
     *
     * @param Service Provider Service
     */
    deleteProviderService(providerService): Promise<any> {        
        return new Promise((resolve, reject) => {
            // delete Service Provider Service
            this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES)
            .doc(providerService.uid)
            .delete()
            .then(() => {
                this.getProviderServices();
                resolve();
            }).catch(error => {
                reject();
            });
        });
    }
}
