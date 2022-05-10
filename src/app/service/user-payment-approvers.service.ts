import { MatSnackBar } from '@angular/material';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

import { HLUserModel, HLBaseUserModel, HLHorseManagerModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { COLLECTION_PAYMENT_APPROVERS } from 'app/model/constants';
import { resolve } from 'url';
import { AppService } from './app.service';

@Injectable()
export class UserPaymentApproversService {
    
    userId: any; // selected user Id    
    allUsers: HLBaseUserModel[];
    onPaymentApproversChanged: BehaviorSubject<any>;    
    onPaymentApproversChanged1: BehaviorSubject<any>;    

    onSelectedApproverChanged: BehaviorSubject<any>;
    actionOfApprover: string;
    currentApprover: HLHorseManagerPaymentApproverModel;

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
        this.onPaymentApproversChanged = new BehaviorSubject([]);
        this.onPaymentApproversChanged1 = new BehaviorSubject([]);
        
        // this.paymentApprovers = [];
        this.actionOfApprover = 'Add';
        this.onSelectedApproverChanged = new BehaviorSubject([]);
    }

    /**
     * Get PaymentApprover data of selected horse
     * @returns {Promise<any>}
     */
    async getPaymentApprovers(userId: string): Promise<any> {
        this._progressBarService.beginLoading2();
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_PAYMENT_APPROVERS, ref => ref.where('creatorId', '==', userId)).get();
                await queryRef.subscribe((snapshot) => {

                    let paymentApprovers: HLHorseManagerPaymentApproverModel[];
                    paymentApprovers = [];
                    snapshot.forEach((doc) => {
                        const approver = {
                            ...doc.data()
                        };                                 
                        paymentApprovers.push(new HLHorseManagerPaymentApproverModel(doc.id, approver));
                    });    
                    this.onPaymentApproversChanged.next(paymentApprovers);
                    resolve();                    
                    this._progressBarService.endLoading2();
                }, reject);                
            } else {  // controller by "new" URL;                
                this.onPaymentApproversChanged.next(false);
                resolve(false);
                this._progressBarService.endLoading2();
            }
        });
    }

    /**
     * add PaymentApprover
     *
     * @param amount
     * @param manager
     * @returns {Promise<any>}
     */
    
    async addPaymentApprover(approver: HLHorseManagerPaymentApproverModel): Promise<any> {

        this._progressBarService.beginLoading2();
        return new Promise(async (resolve, reject) => {
            // check duplicate
                // insert paymentApprover
                const collectionRef = this.db.collection(COLLECTION_PAYMENT_APPROVERS);
                collectionRef
                    .add(approver.toJSON())
                    .then(docRef => {
                        // add uid to inserted horse paymentApprover
                        const ref = this.db.collection(COLLECTION_PAYMENT_APPROVERS).doc(docRef.id);
                        ref.update({
                            uid: docRef.id
                        }).then(() => {
                            this.getPaymentApprovers(approver.creatorId);
                            resolve();
                            this._progressBarService.endLoading2();
                        });
                        
                    })
                    .catch( error => {
                        console.error('Error adding paymentApprover: ', error);
                        reject();
                        this._progressBarService.endLoading2();
                    });
        });        
    } 

    /**
     * Update PaymentApprover
     *
     * @param paymentApproverForm
     * @returns {Promise<any>}
     */
    updatePaymentApprover(paymentApprover): Promise<any> {
        const approver = {
            uid: paymentApprover.uid,
            amount: paymentApprover.amount || null,
            userId: paymentApprover.userId,
            creatorId: paymentApprover.creatorId,
            name: paymentApprover.name  || '',
            location: paymentApprover.location  || '',
            avatarUrl: paymentApprover.avatarUrl || '',
            phone: paymentApprover.phone  || '',
            createdAt: paymentApprover.createdAt
        };

        return new Promise((resolve, reject) => {
        
            // update Payment Approver
            const collectionRef = this.db.collection(COLLECTION_PAYMENT_APPROVERS).doc(paymentApprover.uid);
            collectionRef
                .update(approver)
                .then(() => {
                    this.getPaymentApprovers(paymentApprover.creatorId);
                    resolve();
                })
                .catch( error => {
                    console.error('Error updating horse paymentApprover: ', error);
                    reject();
                });
            
        });
    }

    /**
     * Delete Payment Approver
     *
     * @param Payment Approver
     */
    deletePaymentApprover(paymentApprover): Promise<any> {        

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            // delete Payment Approver
            this.db.collection(COLLECTION_PAYMENT_APPROVERS)
            .doc(paymentApprover.uid)
            .delete()
            .then(() => {
                this.getPaymentApprovers(paymentApprover.creatorId);
                resolve();
                this._progressBarService.endLoading2();
            }).catch(error => {
                console.error('Error removing PaymentApprover: ', error);
                reject();
                this._progressBarService.endLoading2();
            });
        });
    }

    setCurrentApprover(actionType: string, currentApprover?: HLHorseManagerPaymentApproverModel): void{
        this.actionOfApprover = actionType;
        this.currentApprover = currentApprover;
        if (actionType === 'Add'){
            this.currentApprover = new HLHorseManagerPaymentApproverModel('', {});
        }
        this.onSelectedApproverChanged.next(this.currentApprover);
    }


    //for horse owner
    async getPaymentApprovers1(userId: string): Promise<any> {
        this._progressBarService.beginLoading2();
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_PAYMENT_APPROVERS, ref => ref.where('creatorId', '==', userId)).get();
                await queryRef.subscribe((snapshot) => {

                    let paymentApprovers: HLHorseManagerPaymentApproverModel[];
                    paymentApprovers = [];
                    snapshot.forEach((doc) => {
                        const approver = {
                            ...doc.data()
                        };                                 
                        paymentApprovers.push(new HLHorseManagerPaymentApproverModel(doc.id, approver));
                    });    
                    this.onPaymentApproversChanged1.next(paymentApprovers);
                    resolve();                    
                    this._progressBarService.endLoading2();
                }, reject);                
            } else {  // controller by "new" URL;                
                this.onPaymentApproversChanged1.next(false);
                resolve(false);
                this._progressBarService.endLoading2();
            }
        });
    }
    /**
     * add PaymentApprover
     *
     * @param amount
     * @param manager
     * @returns {Promise<any>}
     */
    
    async addPaymentApprover1(approver: HLHorseManagerPaymentApproverModel): Promise<any> {
        // console.log('addPaymentApprover1:', approver);
        this._progressBarService.beginLoading2();
        return new Promise(async (resolve, reject) => {
            // check duplicate
                // insert paymentApprover
                const collectionRef = this.db.collection(COLLECTION_PAYMENT_APPROVERS);
                collectionRef
                    .add(approver.toJSON())
                    .then(docRef => {
                        // add uid to inserted horse paymentApprover
                        const ref = this.db.collection(COLLECTION_PAYMENT_APPROVERS).doc(docRef.id);
                        ref.update({
                            uid: docRef.id
                        }).then(() => {
                            this.getPaymentApprovers1(approver.creatorId);
                            resolve();
                            this._progressBarService.endLoading2();
                        });
                        
                    })
                    .catch( error => {
                        console.error('Error adding paymentApprover: ', error);
                        reject();
                        this._progressBarService.endLoading2();
                    });
        });        
    }

    /**
     * Update PaymentApprover
     *
     * @param paymentApproverForm
     * @returns {Promise<any>}
     */
    updatePaymentApprover1(paymentApprover): Promise<any> {
        const approver = {
            uid: paymentApprover.uid,
            amount: paymentApprover.amount || null,
            userId: paymentApprover.userId,
            creatorId: paymentApprover.creatorId,
            name: paymentApprover.name  || '',
            location: paymentApprover.location  || '',
            avatarUrl: paymentApprover.avatarUrl || '',
            phone: paymentApprover.phone  || '',
            createdAt: paymentApprover.createdAt
        };

        return new Promise((resolve, reject) => {
        
            // update Payment Approver
            const collectionRef = this.db.collection(COLLECTION_PAYMENT_APPROVERS).doc(paymentApprover.uid);
            collectionRef
                .update(approver)
                .then(() => {
                    this.getPaymentApprovers1(paymentApprover.creatorId);
                    resolve();
                })
                .catch( error => {
                    console.error('Error updating horse paymentApprover: ', error);
                    reject();
                });
            
        });
    }

    /**
     * Delete Payment Approver
     *
     * @param Payment Approver
     */
    deletePaymentApprover1(paymentApprover): Promise<any> {        

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            // delete Payment Approver
            this.db.collection(COLLECTION_PAYMENT_APPROVERS)
            .doc(paymentApprover.uid)
            .delete()
            .then(() => {
                // console.log('PaymentApprover successfully deleted!');                
                this.getPaymentApprovers1(paymentApprover.creatorId);
                resolve();
                this._progressBarService.endLoading2();
            }).catch(error => {
                console.error('Error removing PaymentApprover: ', error);
                reject();
                this._progressBarService.endLoading2();
            });
        });
    }
}
