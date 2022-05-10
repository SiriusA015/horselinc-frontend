import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import {AgmCoreModule, MapsAPILoader } from '@agm/core';
import { } from 'googlemaps';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { UserPhotoEditComponent, UserPhotoInput, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { UserServiceEditComponent } from 'app/main/@shared/sevice-edit/service-edit.component';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { ProfileProviderService } from 'app/main/profile/provider/provider.service';

@Component({
  selector: 'profile-provider-editprofile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  animations   : fuseAnimations,
})
export class ProfileProviderEditProfileComponent implements OnInit, OnDestroy {

    user: HLUserModel;

    avatarUrl: string;
    avatarUploadFlag: boolean;
    avatarUploadPercentOb: Observable<number>;
    avatarUploadedUrlOb: Observable<string>;
    photoOutput: UserPhotoOutput;
    location: string;

    profileForm: FormGroup;
    message: string;

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
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _mapsAPILoader: MapsAPILoader, private _ngZone: NgZone,
        private _router: Router,
        private _afStorage: AngularFireStorage,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _serviceProviderService: UserServiceProviderService,
        private _providerServicesService: UserProviderServicesService,
        private _profileProviderService: ProfileProviderService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.user = this._userAuthService.hlUser;
        this.user.type = HLUserType.provider;
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
            name                : [this.user.serviceProvider.name],
            phone               : [this.user.serviceProvider.phone],
            location            : [this.user.serviceProvider.location],
            platform            : [this.user.platform],
            status              : [this.user.status],
            token               : [this.user.token],
            type                : [this.user.type],
            createdAt           : [this.user.createdAt]
        });

        this.avatarUploadFlag = false; 
        this.avatarUrl = this.user.serviceProvider.avatarUrl ? this.user.serviceProvider.avatarUrl : 'assets/icons/horselinc/ic-camera-alt.svg';
        this.location = this.user.serviceProvider.location;

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
        const avatarPath = 'users/' + this.user.uid + '/provider.jpg';
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
        const regex = /^\+(?:[0-9] ?){6,14}[0-9]$/;

        return (regex.test(phone));
    }
    psearch(evt): boolean{
        const charCode = (evt.which) ? evt.which : evt.keyCode;
        
        if ( charCode != 40 && charCode != 41 && charCode != 43 && charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        const _value = this.profileForm.value.phone;    

        if (this.isE164Format(_value)) {
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

        this.user.serviceProvider.createdAt = this.user.createdAt;
        this.user.serviceProvider.userId = this.user.uid;
        this.user.serviceProvider.avatarUrl = this.avatarUrl;
        this.user.serviceProvider.name = data.name,
        this.user.serviceProvider.phone = data.phone;
        this.user.serviceProvider.location = this.location;

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
            this.avatarUrl = this.user.serviceProvider.avatarUrl;
            this.saveUserToDB();
        }


        // Show the success message
        this._appService.showSnackBar('Service Provider saved successfully', 'OK');

        this.closePanel();
    }
    openUpdateEmailPanel(): void{
        this._profileProviderService.onChangeEmail();
        this.closePanel();
        this._fuseSidebarService.getSidebar('profile-provider-updateemail').open();
    }
    openUpdatePasswordPanel(): void{
        this._profileProviderService.onChangePassword();
        this.closePanel();
        this._fuseSidebarService.getSidebar('profile-provider-updatepassword').open();
    }
    closePanel(): void
    {
        this._fuseSidebarService.getSidebar('profile-provider-editprofile').close();
    }
}