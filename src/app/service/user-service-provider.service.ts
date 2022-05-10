
import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { interval, Subject } from 'rxjs';

import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { HLUserModel, HLBaseUserModel } from 'app/model/users';

import { COLLECTION_USERS } from 'app/model/constants';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Injectable()
export class UserServiceProviderService{
    userId: string;
    allUsers: HLBaseUserModel[];
    onServiceProviderUserListChanged: BehaviorSubject<any>;
    
    baseUrl: string;
    httpOptions: any;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ManagerProvidersService}  _managerProvidersService
     * @param {ProviderServicesService}  _ProviderServicesService
     */
    constructor(
        private router: Router,
        private _httpClient: HttpClient,
        private db: AngularFirestore,           
        private _appService: AppService,
        private _providerServicesService: UserProviderServicesService,
        private _userAuthService: UserAuthService,
        private _progressBarService: FuseProgressBarService,
    ) {
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        
        // Set the defaults
        this.userId = '';
        this.allUsers = [];
        this.onServiceProviderUserListChanged = new BehaviorSubject({});

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                if (user.type === HLUserType.provider){
                    this.updatedUser(user);
                }
            }
        });
    }

    updatedUser(hlUser: HLUserModel): void {
        this.userId = hlUser.uid;
        this._providerServicesService.userId = hlUser.uid;
        this._providerServicesService.getProviderServices();

    }

    /**
     * Get all user list (users) // current get only service providers
     *
     * @returns {Promise<any>}
     */
    getAllUsers(): Promise<any>
    {
        if (this.allUsers.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;

                // get all user information for combo box
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().serviceProvider ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().serviceProvider.name,
                                avatarUrl: doc.data().serviceProvider.avatarUrl,
                                phone: doc.data().serviceProvider.phone,
                                location: doc.data().serviceProvider.location
                        };                         
                        this.allUsers.push(new HLBaseUserModel(user));
                    }
                    
                });               
                this.onServiceProviderUserListChanged.next(this.allUsers);
                resolve(this.allUsers);
            }, reject);
        });
    }

    async getExpressLoginUrl(accountId: string): Promise<any> {
        const datas = {
            data: {
                accountId: accountId, 
            }
        };
        
        return new Promise((resolve, reject) => {
            this._httpClient.post(this._appService.apiUrl + '/getExpressLoginUrl', JSON.stringify(datas), this._appService.httpOptions)
                .subscribe((response: any) => {
                    resolve(response);
                }, reject);
        });
        
    }
    
    /**
     * Payout Handlers
     *
     */
    async retrieveAccountInfo(accountId: string): Promise<any> {
        const datas = {
            data: {
                accountId: accountId, 
            }
        };
        
        return new Promise((resolve, reject) => {
            this._httpClient.post(this._appService.apiUrl + '/retrieveAccountInfo', JSON.stringify(datas), this._appService.httpOptions)
                .subscribe((response: any) => {
                    resolve(response);
                }, reject);
        });       
    }

    /**
     * Payout Handlers
     *
     */
    async instantPayout(accountId: string, amount: number): Promise<any> {
        const datas = {
            data: {
                accountId: accountId, 
                amount: amount
            }
        };
        
        // console.log('instantPayout:', datas);
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this._appService.apiUrl + '/instantPayout', JSON.stringify(datas), this._appService.httpOptions).toPromise()
                .then((response: any) => {
                    resolve(response.result);
                    this._progressBarService.endLoading2();

                })
                .catch( error => {
                    this._progressBarService.endLoading2();
                    // console.log('instantPayoutError:', error.error.error.message);
                    reject(error.error.error);
                });
        });
    }
}
