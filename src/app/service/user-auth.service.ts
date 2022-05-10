import { OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/shareReplay';
import { BehaviorSubject, Observable } from 'rxjs';
import * as moment from 'moment';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';

import { Router } from '@angular/router';
import { HttpClient, HttpHeaders  } from '@angular/common/http';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

import { stringToKeyValue } from '@angular/flex-layout/extended/typings/style/style-transforms';

import { COLLECTION_USERS } from 'app/model/constants';
import { HLUserModel } from 'app/model/users';
import { HLUserType, HLUserOnlineStatus, HLPlatformType } from 'app/model/enumerations';

import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';
import { AppService } from 'app/service/app.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Injectable({
    providedIn:  'root'
})
export class UserAuthService{
    public authUser: User;
    public hlUser: HLUserModel;
    public redirectUrl: string;
    
    onHLUserChanged: BehaviorSubject<any>;

    constructor(
        private _afAuth: AngularFireAuth, 
        private _db: AngularFirestore,
        private _router: Router,
        private _httpClient: HttpClient,
        private _appService: AppService,
        private _progressBarService: FuseProgressBarService,
    ) {
        // Set the default
        this.hlUser = new HLUserModel('', {});
        this.onHLUserChanged = new BehaviorSubject(false);

        this._afAuth.authState.subscribe(user => {
            if (user){
              this.authUser = user;
              localStorage.setItem('authUser', JSON.stringify(this.authUser));
            } else {
              localStorage.setItem('authUser', null);
            }
        });

        // load local storage
        this.loadHLUserFromLocal();
    }
    async login(email: string, password: string): Promise<any> {
        return new Promise<any> ((resolve, reject) => {
        this._afAuth.auth.signInWithEmailAndPassword(email, password).then(authUser => {
            this.getUser(authUser.user.uid).then(hlUser => {
                if (hlUser !== false){
                    this.updatedUser(hlUser); 
                    resolve(hlUser);
                }
                else{
                    resolve(false);
                }
            });
            }, reject);
        });
    }
   
    async logout(): Promise<any> {
        this._appService.curUser.type = null;
        this.hlUser.type = null;
        localStorage.removeItem('user');
    }

    async forgotPassword(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._afAuth.auth.sendPasswordResetEmail(email).then(() => {
                resolve();
            }, reject);
        });
    }

    async changePassword(oldPassword, newPassword: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // this._afAuth.auth.reauthenticate
            const credentials = firebase.auth.EmailAuthProvider.credential(
                this.hlUser.email, oldPassword);

            this._afAuth.auth.currentUser.reauthenticateWithCredential(credentials).then( () => {
                this._afAuth.auth.currentUser.updatePassword(newPassword).then(() => {
                    resolve();
                },
                error => {
                    reject(error);
                });
            
            }, error => {
                reject(error);
            });
        });
    }
    async changeEmail(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._afAuth.auth.currentUser.updateEmail(email).then(() => {
                resolve();
            }, reject);
        });
    }

    async registerUser(email: string, password: string): Promise<any> {
        const datas = {
            data: {
                email: email,
                password: password,      
            }
        };
        // console.log('registerUser:', datas);
        this._progressBarService.beginLoading2();
        
        return new Promise((resolve, reject) => {
            this._httpClient.post(this._appService.apiUrl + '/createHorseOwner', JSON.stringify(datas), this._appService.httpOptions).toPromise()
                .then((response: any) => {
                    resolve(response.result);
                    this._progressBarService.endLoading2();

                })
                .catch( error => {
                    this._progressBarService.endLoading2();
                    reject(error.error.error);
                });
        });
    }
    async createUser(hlUser: HLUserModel): Promise<any> {

        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
            const hlManagerData = hlUser.horseManager.toJSON();
            const horseManager = {            
                uid: hlUser.uid,
                email: hlUser.email,
                horseManager: {
                    userId: hlUser.uid,
                    name: hlUser.horseManager.name,
                    avatarUrl: hlUser.horseManager.avatarUrl,
                    phone: hlUser.horseManager.phone,
                    barnName: hlUser.horseManager.barnName,
                    location: hlUser.horseManager.location,
                    percentage: hlUser.horseManager.percentage,
                    createdAt: Date.now()
                },
                serviceProvider: null,
                platform: HLPlatformType.Web,
                status: HLUserOnlineStatus.online,
                type: HLUserType.manager,
                creatorId: this.hlUser.uid,
                createdAt: Date.now()
            };
    
            const collectionRef = this._db.collection(COLLECTION_USERS).doc(horseManager.uid);
            collectionRef
                .set(horseManager, { merge: true }) // hlUser.toJSON())
                .then(() => {
                    resolve();
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    reject();
                    this._progressBarService.endLoading2();
                });
        });
    }

    async register(email: string, password: string): Promise<any> {
        this._progressBarService.beginLoading2();

        return new Promise<any> ((resolve, reject) => {
            this._afAuth.auth.createUserWithEmailAndPassword(email, password).then((newUserCredential: firebase.auth.UserCredential) => {
                const hlUser = {            
                    uid: newUserCredential.user.uid,
                    email: newUserCredential.user.email,
                    horseManager: null,
                    serviceProvider: null,
                    platform: HLPlatformType.Web,
                    status: HLUserOnlineStatus.online,
                     token: newUserCredential.user.refreshToken,            
                    createdAt: Date.now()
                };
                this.hlUser = new HLUserModel(newUserCredential.user.uid, hlUser); 
                const collectionRef = this._db.collection(COLLECTION_USERS).doc(this.hlUser.uid);
                collectionRef
                .set(hlUser, { merge: true }) // hlUser.toJSON())
                .then(() => {
                    this.hlUser = new HLUserModel(hlUser.uid, hlUser);
                    resolve(this.hlUser);
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    reject(error);
                    this._progressBarService.endLoading2();
                });
            }, reject);
        });        
    }
    async switchUserRole(roleType: HLUserType): Promise<any> {
        this.hlUser.type = roleType;

        const data = {
            type: roleType,
        };
        const hlUser = new HLUserModel(this.hlUser.uid, this.hlUser);

        return new Promise((resolve, reject) => {
            const collectionRef = this._db.collection(COLLECTION_USERS).doc(hlUser.uid);

            collectionRef
                .set(data, { merge: true }) // hlUser.toJSON())
                .then(docRef => {
                    this.updatedUser(hlUser);
                    resolve();
                })
                .catch( error => {
                    reject(error);
                });
        });
    }
    async updateUser(hlUser: HLUserModel): Promise<any> {
        return new Promise((resolve, reject) => {
            const collectionRef = this._db.collection(COLLECTION_USERS).doc(hlUser.uid);
            if (hlUser.type == HLUserType.manager){
                const hlManagerData = hlUser.horseManager.toJSON();
                // console.log('hlManagerData:', hlManagerData);
                const horseManager = {horseManager: hlManagerData};
                collectionRef
                    .set(horseManager, { merge: true }) // user) //  
                    .then(docRef => {
                        this.updatedUser(hlUser);
                        resolve();
                    })
                    .catch( error => {
                        reject();
                    });
                }
                else{
                    const hlProviderData = hlUser.serviceProvider.toJSON();
                    const serviceProvider = {serviceProvider: hlProviderData};
                    collectionRef
                        .update(serviceProvider) // user) //  
                        .then(docRef => {
                            this.updatedUser(hlUser);
                            resolve();
                        })
                        .catch( error => {
                            reject();
                        });    
                }
        });
    }

    async getUser(userId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (userId != null && userId !== '') {
                const docRef = this._db.collection(COLLECTION_USERS).doc(userId).get();
                docRef.subscribe((doc) => {
                    let user: any;

                    user = {
                        ...doc.data()
                    };                
                    if (!user.uid){
                        resolve(false);
                    }
                    this.hlUser = new HLUserModel(user.uid, user);
                    resolve(user);
                }, reject);
            }
            else{
                // this.hlUser = new HLUserModel('', {});
                resolve(false);
            }
        });
    }

    loadUser(): void{
        this._progressBarService.beginLoading2();
        this.getUser(this.hlUser.uid)
        .then(hlUser => {    
            if (hlUser !== false){
                this.updatedUser(hlUser); 
                this._progressBarService.endLoading2();
            }
        });
    }
    updatedUser(hlUser: HLUserModel): void{
        this.hlUser = hlUser;
        this._appService.curUser = this.hlUser;
        this._appService.initNavigationBar();
        this.onHLUserChanged.next(this.hlUser);
        this.saveHLUserToLocal();
        // console.log('updatedUser:', )
    }
    saveHLUserToLocal(): void{
        localStorage.setItem('hlUser', JSON.stringify(this.hlUser));
    }
    loadHLUserFromLocal(): void{
        const  authUser =  JSON.parse(localStorage.getItem('authUser'));
        const  hlUser =  JSON.parse(localStorage.getItem('hlUser'));
        if (authUser  !==  null)
        {
            this.hlUser.uid = authUser.uid;
            this._appService.curUser.uid = authUser.uid;
            if (hlUser){
                this.hlUser.type = hlUser.type;
                this._appService.curUser.type = hlUser.type;
            }

            this.loadUser();    
        }
    }
    isAuthenticated(): boolean {
        const  user  =  JSON.parse(localStorage.getItem('authUser'));
        return  user  !==  null;
    }

     getCurrentUserForInfo(name: string, phone: string): Promise<any> {
        // console.log('this is async', name, phone);
        let serviceFlag: boolean;
        serviceFlag = false;
        return new Promise(async (resolve, reject) => {
            if (name != null && name != '' && phone != null) {
                // console.log('this is true!!!!!!!!!!!', name.toLowerCase(), phone);
                const  queryRef = await this._db.collection(COLLECTION_USERS).get();
                await queryRef.subscribe((snapshot) => {
                    snapshot.forEach((doc) => {
                        const user = new HLUserModel(doc.data().uid, doc.data());
                        const tempPhone = user.serviceProvider.phone.slice( user.serviceProvider.phone.length - 4);
                        // console.log('this is true', user.serviceProvider.name.toLowerCase(),name.toLowerCase(), phone);
                        if (user.serviceProvider.name.toLowerCase() == name.toLowerCase() && tempPhone == phone){
                            // console.log('this is true', user.serviceProvider.name.toLowerCase(),name.toLowerCase(), phone);
                            serviceFlag = true;
                            resolve(user);
                            return;
                        } 
                    });
                    // if (serviceFlag === false){window.location.href = 'welcome'; }
                });

            }
            else{
                window.location.href = 'welcome';
            }
        });
    }


}
