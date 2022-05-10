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
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { UserService } from 'app/main/user/user.service';

import { UserPhotoEditComponent, UserPhotoInput, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { HLUserModel, HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';
import { DH_CHECK_P_NOT_SAFE_PRIME } from 'constants';

@Component({
  selector: 'user-register-manager',
  templateUrl: './register-manager.component.html',
  styleUrls: ['./register-manager.component.scss'],
  animations   : fuseAnimations,
})
export class UserRegisterManagerComponent implements OnInit, OnDestroy {
    user: HLUserModel;

    avatarUrl: string;
    avatarUploadFlag: boolean;
    avatarUploadPercentOb: Observable<number>;
    avatarUploadedUrlOb: Observable<string>;
    photoOutput: UserPhotoOutput;

    location: string;

    initForm: boolean;
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
        public _userService: UserService,
        private _formBuilder: FormBuilder,
        private _matDialog: MatDialog,      
        private _mapsAPILoader: MapsAPILoader, private _ngZone: NgZone,
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _afStorage: AngularFireStorage,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _router: Router,
    )
    {
        this.user = new HLUserModel('', {});
        this.initForm = false;
        this.message = '';

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: true
                },
                toolbar  : {
                    hidden: true
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
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
        this.user.type = HLUserType.manager;
        this.createProfileForm();

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);

                if (this.user.horseManager.userId === '' && this.user.serviceProvider.userId){
                    this.user.horseManager.name = this.user.serviceProvider.name;
                    this.user.horseManager.location = this.user.serviceProvider.location;
                    this.user.horseManager.phone = this.user.serviceProvider.phone;
                    this.user.horseManager.avatarUrl = this.user.serviceProvider.avatarUrl;
                }
                if (!this.initForm){
                    this.createProfileForm();
                    this.initForm = true;
                }
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
            // uid                 : [this.user.uid],
            // email               : [this.user.email],
            name                : [this.user.horseManager.name, Validators.required],
            barnName            : [this.user.horseManager.barnName, Validators.required],
            phone               : [this.user.horseManager.phone, Validators.required],
            // location            : [this.user.horseManager.location],
            // platform            : [this.user.platform],
            // status              : [this.user.status],
            // token               : [this.user.token],
            // type                : [this.user.type],
            // createdAt           : [this.user.createdAt]
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
                this.user.horseManager.avatarUrl = this.avatarUrl;
                this.saveUserToDB();
            });
            })
        )
        .subscribe();
    }

    saveUserToDB(): void{
        const uid = this.user.uid;
        const data = this.profileForm.getRawValue();

        this.user.createdAt = Date.now();
        this.user.type = HLUserType.manager;

        this.user.horseManager.createdAt = this.user.createdAt;
        this.user.horseManager.userId = this.user.uid;
//        this.user.horseManager.avatarUrl = this.avatarUrl;
        this.user.horseManager.name = data.name;
        this.user.horseManager.barnName = data.barnName;
        this.user.horseManager.phone = data.phone;
        this.user.horseManager.location = this.location;
        this.user.horseManager.percentage = 100;

        this._userAuthService.updateUser(this.user)
            .then((user) => {
        });
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
        window.event.returnValue = true;
        return true;
    }
    checkForm(): boolean{
        const data = this.profileForm.getRawValue();

        if (data.name === ''){
            this.message = 'The name field is blanked.';
            return false;
        }
        else if (data.barnName === ''){
            this.message = 'The farm name field is blanked.';
            return false;
        }
        else if (data.phone === ''){
            this.message = 'The phone field is blanked.';
            return false;
        }
        else if (this.location === ''){
            this.message = 'Your address field is blanked.';
            return false;
        }
        return true;
    }
    saveUser(): void{

        if ( !this.checkForm() ){
            this._appService.showSnackBar(this.message, 'FAIL');
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

        this._appService.navigateToFirstPage();
    }

    openPaymentInfo(): void
    {
        const uid = this.user.uid;
        const data = this.profileForm.getRawValue();

        this.user.createdAt = Date.now();
        this.user.type = HLUserType.manager;

        this.user.horseManager.createdAt = this.user.createdAt;
        this.user.horseManager.userId = this.user.uid;
        this.user.horseManager.name = data.name;
        this.user.horseManager.barnName = data.barnName;
        this.user.horseManager.phone = data.phone;
        this.user.horseManager.location = this.location;
        this.user.horseManager.percentage = 100;

        this._userAuthService.updateUser(this.user)
            .then((user) => {
                this._userService.paymentInfoShow = true;
                this._fuseSidebarService.getSidebar('user-payment-info').toggleOpen();        
        });
    }

}
