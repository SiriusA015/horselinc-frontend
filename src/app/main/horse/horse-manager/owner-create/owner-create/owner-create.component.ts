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
import { HLUserType, HLPlatformType, HLUserOnlineStatus } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';

// import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
  selector: 'horse-owner-create',
  templateUrl: './owner-create.component.html',
  styleUrls: ['./owner-create.component.scss'],
  animations   : fuseAnimations,
})

export class HorseOwnerCreateComponent implements OnInit, OnDestroy {
    horseOwner: HLUserModel;

    avatarUrl: string;
    avatarUploadFlag: boolean;
    avatarUploadPercentOb: Observable<number>;
    avatarUploadedUrlOb: Observable<string>;
    photoOutput: UserPhotoOutput;
    location: string;
    enterPassword: string;
    confirmPassword: string;

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
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.horseOwner = new HLUserModel('', {});
        
    }

    ngOnInit(): void {
        
        this.horseOwner = this._horseManagerService.editingHorseOwner;
        this.createProfileForm();

        this._horseManagerService.onHorseOwnerCreate
        .subscribe(horseOwner => {
            if (horseOwner.horseManager){
                this.horseOwner = horseOwner;
                this.createProfileForm();
            }
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
            // uid                 : [this.horseOwner.uid],
            email               : [this.horseOwner.email],
            // email               : [this.horseOwner.email],
            // email               : [this.horseOwner.email],
            name                : [this.horseOwner.horseManager.name],
            barnName            : [this.horseOwner.horseManager.barnName],
            phone               : [this.horseOwner.horseManager.phone],
            location            : [this.horseOwner.horseManager.location],
            platform            : [this.horseOwner.platform],
            status              : [this.horseOwner.status],
            token               : [this.horseOwner.token],
            type                : [this.horseOwner.type],
            createdAt           : [this.horseOwner.createdAt]
        });
        this.enterPassword = '';
        this.confirmPassword = '';

        this.avatarUploadFlag = false; 
        this.avatarUrl = this.horseOwner.horseManager.avatarUrl ? this.horseOwner.horseManager.avatarUrl : 'assets/icons/horselinc/ic-camera-alt.svg';
        this.location = this.horseOwner.horseManager.location;

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
                    // this.profileForm.setValue({location: this.location});
                    // this.searchControl.reset();
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
        const avatarPath = 'users/' + this.horseOwner.uid + '/manager.jpg';
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
    checkForm(): boolean{
        let bRet: boolean = true;
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
        else if (data.email === ''){
            this.message = 'Email is required';
            bRet = false;
        }
        else if (this.location === ''){
            this.message = 'Location is required';
            bRet = false;
        }
        else if (this.enterPassword === '' || this.enterPassword !== this.confirmPassword){
            this.message = 'Password is required';
            bRet = false;
        }
        if (!bRet){
            this._appService.showSnackBar(this.message, 'FAIL');
        }
        return bRet;
    }
    saveUserToDB(): void{
        const data = this.profileForm.getRawValue();

        this.horseOwner.email = data.email;
        this.horseOwner.type = HLUserType.manager;
        this.horseOwner.createdAt = Date.now();
        this.horseOwner.platform = HLPlatformType.Web,
        this.horseOwner.status = HLUserOnlineStatus.online;

        this.horseOwner.horseManager.percentage = 100;
        this.horseOwner.horseManager.createdAt = this.horseOwner.createdAt;
        this.horseOwner.horseManager.userId = this.horseOwner.uid;
        this.horseOwner.horseManager.avatarUrl = this.avatarUrl;
        this.horseOwner.horseManager.name = data.name,
        this.horseOwner.horseManager.barnName = data.barnName;
        this.horseOwner.horseManager.phone = data.phone;
        this.horseOwner.horseManager.location = this.location;

        this._userAuthService.createUser(this.horseOwner)
            .then((user) => {
        });
    }
    saveUser(): void{
        if ( !this.checkForm() ){
            return;
        }
        const data = this.profileForm.getRawValue();

        this._userAuthService.registerUser(data.email, this.enterPassword)
        .then((response: any) =>{
            this.horseOwner.uid = response.uid;
            if (this.avatarUploadFlag){
                this.uploadAvatarAndSaveUserToDB(this.photoOutput.croppedImageFile);
            }
            else
            {
                this.avatarUrl = this.horseOwner.horseManager.avatarUrl;
                this.saveUserToDB();
            }
            // Show the success message
            this._appService.showSnackBar('Horse Manager saved successfully', 'OK');
            this._horseManagerService.editingHorseOwner = this.horseOwner;
            this._horseManagerService.requestHorseOwnerCreated();
            this.closePanel();
            this._fuseSidebarService.getSidebar('horse-owner-paymentinfo').open();    
        }).catch((error) => {
            // Show the success message
            this._appService.showSnackBar(error.message, 'FAIL');
        });
    }
    closePanel(): void{
        this._fuseSidebarService.getSidebar('horse-owner-create').close();
    }
    openUpdateEmailPanel(): void{
        // this._profileManagerService.onChangeEmail();
        // this.closePanel();
        // this._fuseSidebarService.getSidebar('profile-manager-updateemail').open();
    }
    openUpdatePasswordPanel(): void{
        // this._profileManagerService.onChangePassword();
        // this.closePanel();
        // this._fuseSidebarService.getSidebar('profile-manager-updatepassword').open();
    }
}
