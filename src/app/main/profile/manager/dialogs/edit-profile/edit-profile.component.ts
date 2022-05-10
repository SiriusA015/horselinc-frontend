import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import {AgmCoreModule, MapsAPILoader } from '@agm/core';
import { } from 'googlemaps';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { fuseAnimations } from '@fuse/animations';

import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { UserPhotoEditComponent, UserPhotoInput, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
  selector: 'profile-manager-editprofile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  animations   : fuseAnimations,
})

export class ProfileManagerEditProfileComponent implements OnInit, OnDestroy {
    user: HLUserModel;

    avatarUrl: string;
    avatarUploadFlag: boolean;
    avatarUploadPercentOb: Observable<number>;
    avatarUploadedUrlOb: Observable<string>;
    photoOutput: UserPhotoOutput;
    location: string;
    message: string;

    profileForm: FormGroup;
    
    @ViewChild('search', {static: false})
    public searchElementRef: ElementRef;
    public searchControl: FormControl;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FormBuilder} _formBuilder
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _matDialog: MatDialog,  
        private _mapsAPILoader: MapsAPILoader, private _ngZone: NgZone,
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _afStorage: AngularFireStorage,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _profileManagerService: ProfileManagerService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        
        this.user = this._userAuthService.hlUser;
        this.user.type = HLUserType.manager;
        this.createProfileForm();

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);
                this.createProfileForm();
            }
            this.message = '';
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void{
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create horse form
     *
     * @returns {FormGroup}
     */
    createProfileForm(): void
    {
        this.profileForm = this._formBuilder.group({
            uid                 : [this.user.uid],
            email               : [this.user.email],
            name                : [this.user.horseManager.name],
            barnName            : [this.user.horseManager.barnName],
            intlPhone           : [this.user.horseManager.phone],
            phone               : [this.user.horseManager.phone],
            location            : [this.user.horseManager.location],
            platform            : [this.user.platform],
            status              : [this.user.status],
            token               : [this.user.token],
            type                : [this.user.type],
            createdAt           : [this.user.createdAt]
        });

        this.avatarUploadFlag = false; 
        this.avatarUrl = this.user.horseManager.avatarUrl ? this.user.horseManager.avatarUrl : 'assets/icons/horselinc/ic-camera-alt.svg';
        this.location = this.user.horseManager.location;

        // build location editor
        this.searchControl = new FormControl();
        this._mapsAPILoader.load().then(() => {
            const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
            types: [],
            // componentRestrictions: { 'country' : 'IN' }
            });
            autocomplete.addListener('place_changed', () => {
                this._ngZone.run(() => {
                    const place: google.maps.places.PlaceResult = autocomplete.getPlace();
                    if (place.geometry === undefined || place.geometry === null){
                        return;
                    }
                    this.location = place.formatted_address;
                });
            });
        });
    }

    changedAvatarFile(event: any): void{
        const dialogRef = this._matDialog.open(UserPhotoEditComponent, {
            panelClass: 'user-photo-edit',
            disableClose: true,
            data: {event: event
            } 
        });

        dialogRef.afterClosed().subscribe((photoOutput: UserPhotoOutput) => {
            if (photoOutput) {
                this.photoOutput = photoOutput;
                this.avatarUploadFlag = true;
                this.avatarUrl = photoOutput.croppedImage64;
            }
        });
    }

   // Firebase avatar upload to storage
   uploadAvatarAndSaveUserToDB(avatarFile): void {
        const avatarPath = 'users/' + this.user.uid + '/manager.jpg';
        const storageRef = this._afStorage.ref(avatarPath);      

        const task = this._afStorage.upload(avatarPath, avatarFile);
        // observe percentage changes
        this.avatarUploadPercentOb = task.percentageChanges();
        // get notified when the download URL is available
        task.snapshotChanges().pipe(
            finalize(() => {
            this.avatarUploadedUrlOb = storageRef.getDownloadURL();
            this.avatarUploadedUrlOb.subscribe(url => {
                this.avatarUrl = url;
                this.saveUserToDB();
            });
            })
        )
        .subscribe();
    }
    isE164Format(phone): boolean {
        const regex = /^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/;
        return (regex.test(phone));
    }
    psearch(evt): boolean{
        const charCode = (evt.which) ? evt.which : evt.keyCode;

        if ( charCode != 40 && charCode != 41 && charCode != 43 && charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        window.event.returnValue = true;
        return true;
    }
    checkForm(): boolean{
        let bRet = true;
        const data = this.profileForm.getRawValue();

        if (data.name === ''){
            this.message = 'Name is required';
            bRet = false;
        }
        else if (data.barnName === ''){
            this.message = 'Barn Name is required';
            bRet = false;
        }
        else if (data.phone === ''){
            this.message = 'Phone Number is required';
            bRet = false;
        }
        else if (this.location === ''){
            this.message = 'Location is required';
            bRet = false;
        }
        if (!bRet){
            this._appService.showSnackBar(this.message, 'FAIL');
        }
        return bRet;
    }
    saveUserToDB(): void{
        const data = this.profileForm.getRawValue();

        this.user.horseManager.createdAt = this.user.createdAt;
        this.user.horseManager.userId = this.user.uid;
        this.user.horseManager.avatarUrl = this.avatarUrl;
        this.user.horseManager.name = data.name,
        this.user.horseManager.barnName = data.barnName;
        this.user.horseManager.phone = data.phone;
        this.user.horseManager.location = this.location;

        this._userAuthService.updateUser(this.user)
            .then((user) => {
        });
    }
    saveUser(): void{
        if ( !this.checkForm() ){
            return;
        }
        
        if (this.avatarUploadFlag){
            this.uploadAvatarAndSaveUserToDB(this.photoOutput.croppedImageFile);
        }
        else
        {
            this.avatarUrl = this.user.horseManager.avatarUrl;
            this.saveUserToDB();
        }

        // Show the success message
        this._appService.showSnackBar('Horse Manager saved successfully', 'OK');

        this.closePanel();
    }
    closePanel(): void{
        this._fuseSidebarService.getSidebar('profile-manager-editprofile').close();
    }
    openUpdateEmailPanel(): void{
        this._profileManagerService.onChangeEmail();
        this.closePanel();
        this._fuseSidebarService.getSidebar('profile-manager-updateemail').open();
    }
    openUpdatePasswordPanel(): void{
        this._profileManagerService.onChangePassword();
        this.closePanel();
        this._fuseSidebarService.getSidebar('profile-manager-updatepassword').open();
    }
}
