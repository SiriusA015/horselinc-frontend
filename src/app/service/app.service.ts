import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';
import { auth } from 'firebase/app';
import * as firebase from 'firebase/app';

import { Injectable } from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/shareReplay';
import { BehaviorSubject, Observable } from 'rxjs';

import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

import { stringToKeyValue } from '@angular/flex-layout/extended/typings/style/style-transforms';

import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Router } from '@angular/router';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

import { COLLECTION_SETTINGS, COLLECTION_USERS, COLLECTION_SERVICE_SHOWS } from 'app/model/constants';
import { HLUserType, HLUserOnlineStatus, HLPlatformType } from 'app/model/enumerations';
import { HLSettingsModel } from 'app/model/settings';
import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLServiceShowModel } from 'app/model/service-requests';

import { UserAuthService } from 'app/service/user-auth.service';

import { MatSnackBar, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn:  'root'
})
export class AppService {
    public apiUrl = 'https://us-central1-horselinc-dev.cloudfunctions.net';
    public httpOptions = {headers: new HttpHeaders({'Content-Type': 'application/json'}) };
    public invoicingURL = 'https://us-central1-horselinc-dev.cloudfunctions.net/api/stripes/accounts/authorize?userId=';
    public invoicingRedirectURLForProfile = '&redirectUrl=https://horselinc-dev.firebaseapp.com/provider/profile';
    public invoicingRedirectURLForRegister = '&redirectUrl=https://horselinc-dev.firebaseapp.com/user/register/provider';
    public stripeFee = 5;

    public settings: HLSettingsModel;
    public onHLSettingChanged: BehaviorSubject<any>;

    public curUser: HLUserModel;   // Current User Information
    
    horseManagers: HLHorseManagerModel[] = [];
    serviceShows: HLServiceShowModel[] = [];

    // Private
    private _unsubscribeAll: Subject<any>;
    constructor(
        private _matSnackBar: MatSnackBar, 
        private _fuseNavigationService: FuseNavigationService,
        private _router: Router,
        private _db: AngularFirestore,
    ) {
        // Set the default
        this.curUser = new HLUserModel('', {});
        this.apiUrl = environment.apiUrl;
        this.invoicingURL = environment.invoicingURL;
        this.invoicingRedirectURLForProfile = environment.invoicingRedirectURL + '/provider/profile';
        this.invoicingRedirectURLForRegister = environment.invoicingRedirectURL + '/register/provider';

        this.onHLSettingChanged = new BehaviorSubject(false);
        this.loadSettingsFromDB();
    }

    getAmountWithApplicationFee(amount: number): number {
        return amount * ((100 + this.stripeFee) / 100);
    }
    
    getApiUri(): string{
        return this.apiUrl;
    }
    getHttpOptions(): any{
        return this.httpOptions;
    }
    initNavigationBar(): void{
        const naviKey = this.getUserShortType();
        this._fuseNavigationService.setCurrentNavigation(naviKey);
    }
    navigateToFirstPage(): void {
        this.initNavigationBar();
        const firstPageURL = this.getUserShortType() + '/' + 'horses/';
        this._router.navigate([firstPageURL]);  // must be change
    }
    getAppPrivacyURL(): string{
        return this.settings.urls.privacy;
    }
    getAppTermsURL(): string{
        return this.settings.urls.terms;
    }

    contactHorseLinc(): string{
        const dstEmail = 'info@horselinc.com';
        const subject = 'Contact Us';
        const emailTo = 'mailto:' + dstEmail + '?Subject=' + subject;
        // window.open(emailTo, 'Contact HorseLinc', 'dialog=yes,width=1000,height=800');
        return emailTo;
    }
    inviteHorseLinc(): string{
        let userName = '';
        if (this.curUser.type == HLUserType.manager){
            if (this.curUser.horseManager){
                userName = this.curUser.horseManager.name;
            }
        }
        else{
            if (this.curUser.serviceProvider){
                userName = this.curUser.serviceProvider.name;
            }
        }
        const dst = '';
        const subject = "?subject=You/'re Invited To HorseLinc&";
        const body = "body=" + userName + " wants you join HorseLinc! You can download the app at https://horselinc.app.link/7o0qGXyvi2";
        const emailTo = 'mailto:' + dst + subject + body;

        return emailTo;
    }
    spEmailLinc(email: string): string{
        const dstEmail = email;
        const emailTo = 'mailto:' + dstEmail;
        
        return emailTo;
    }
    setCurUser(user: HLUserModel): void{
        this.curUser = user;
    }
    getCurUser(): HLUserModel{
        return this.curUser;
    }
    getUserUid(): string{
        return this.curUser.uid;
    }
    getUserType(): HLUserType{
        return this.curUser.type;
    }
    getUserShortType(): string{
        let userType = '';

        if ( this.getUserType() === HLUserType.manager ){
            userType = 'manager';
        }
        if ( this.getUserType() === HLUserType.provider ){
            userType = 'provider';
        }
        return userType;
    }
    onChangedCurUser(curUser: HLUserModel): void{
        this.curUser = curUser;
    }

    async loadSettingsFromDB(): Promise<any> {
        return new Promise((resolve, reject) => {
            const docRef = this._db.collection(COLLECTION_SETTINGS).doc('data').get();
            docRef.subscribe((doc) => {
                let settings: any;

                settings = {
                    ...doc.data()
                };                
                this.settings = new HLSettingsModel(settings); 
                this.onHLSettingChanged.next(settings);
                // console.log('loadSettings:', settings, this.settings);
                resolve(settings);
            }, reject);
        });
    }
    
    getHorseManagerList(): HLHorseManagerModel[] {
        if (this.horseManagers.length < 1) {
            this.getHorseManagerListFrom()
            .then(managers => {
                this.horseManagers = managers;
            });
        }
        return this.horseManagers;
    }

    getHorseManagerListFrom(): Promise<any>
    {
        if (this.horseManagers.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this._db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().horseManager ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().horseManager.name,
                                avatarUrl: doc.data().horseManager.avatarUrl,
                                phone: doc.data().horseManager.phone,
                                location: doc.data().horseManager.location,
                                barnName: doc.data().horseManager.barnName,
                                percentage: doc.data().horseManager.percentage,
                                createdAt: doc.data().createdAt,
                        };                         
                        this.horseManagers.push(new HLHorseManagerModel(user));
                    }
                });            
                resolve(this.horseManagers);
            }, reject);
        });
    }

    getServiceShowList(): HLServiceShowModel[]
    {
        if (this.serviceShows.length < 1) {
            this.getServiceShowListFrom()
            .then(shows => {
                this.serviceShows = shows;
            });
        }
        return this.serviceShows;
    }

    getServiceShowListFrom(): Promise<any>
    {
        if (this.serviceShows.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this._db.collection(COLLECTION_SERVICE_SHOWS).get();
            collectionRef.subscribe((snapshots) => {
                const serviceShowList = snapshots;
                // get service show information                
                serviceShowList.forEach(doc => {
                    let serviceShow: any;
                    if ( doc.data() && doc.data().name !== '' ) {
                        serviceShow = {
                                uid: doc.data().uid,
                                name: doc.data().name,                                
                                createdAt: doc.data().createdAt,
                        };
                        this.serviceShows.push(new HLServiceShowModel(serviceShow.uid, serviceShow));
                    }
                });               
                resolve(this.serviceShows);
            }, reject);
        });
    }
    showSnackBar(message: string, type: string): void{
        let duration = 3000;

        if (message.length > 30){
            duration = 5000;
        }
        this._matSnackBar.open(message, type, {
            verticalPosition: 'bottom',
            duration        : duration,
            panelClass: ['snackBar']
        });
    }
}
