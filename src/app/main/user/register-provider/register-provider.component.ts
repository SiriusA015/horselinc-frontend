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
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

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

@Component({
  selector: 'user-register-provider',
  templateUrl: './register-provider.component.html',
  styleUrls: ['./register-provider.component.scss'],
  animations   : fuseAnimations,
})
export class UserRegisterProviderComponent implements OnInit, OnDestroy {
    user: HLUserModel;

    avatarUrl: string;
    avatarUploadFlag: boolean;
    avatarUploadPercentOb: Observable<number>;
    avatarUploadedUrlOb: Observable<string>;
    photoOutput: UserPhotoOutput;

    name: string;
    phone: string;
    location: string;

    invoicingFlag: boolean;
    invoicingLabel: string;
    invoicingURL: string;

    providerServices: any;
    providerServiceData: FilesDataSource | null;
    providerServiceDataColumns = ['service-rate', 'edit-button', 'delete-button'];    
    providerServiceDataEnable = false;

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
    )
    {
        this.user = new HLUserModel('', {});
        this.invoicingLabel = '';
        this.invoicingURL = '';
        this.invoicingFlag = false;

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
        this.user.type = HLUserType.provider;
        this.createProfileForm();
    
        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);

                if (this.user.serviceProvider.userId === '' && this.user.horseManager.userId){
                    this.user.serviceProvider.name = this.user.horseManager.name;
                    this.user.serviceProvider.location = this.user.horseManager.location;
                    this.user.serviceProvider.phone = this.user.horseManager.phone;
                    this.user.serviceProvider.avatarUrl = this.user.horseManager.avatarUrl;
                }

                this.invoicingFlag = false;
                this.invoicingLabel = 'Enable Invoicing';
                this.invoicingURL = this._appService.invoicingURL + this.user.uid + this._appService.invoicingRedirectURLForRegister;
                
                if (this.user.serviceProvider.account){
                    if (this.user.serviceProvider.account.externalAccounts){
                        this.invoicingFlag = true;
                        this.invoicingLabel = this.user.serviceProvider.account.externalAccounts[0].bankName + ' ' + this.user.serviceProvider.account.externalAccounts[0].last4;
                        this._serviceProviderService.getExpressLoginUrl(this.user.serviceProvider.account.id).then(
                            (response) => {
                                this.invoicingURL = response.result.url;
                            });
                    }
                }
                this.createProfileForm();
            }
        });    

        this.providerServiceDataEnable = false;
        // Subscribe to update providerServices on changes
        this.providerServices = [];
        this._providerServicesService.userId = this.user.uid;
        this._providerServicesService.getProviderServices();
        this.providerServiceData = new FilesDataSource(this._providerServicesService);
        this._providerServicesService.onProviderServicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(providerServices => {                
                this.providerServices = providerServices;
                this.providerServiceDataEnable = providerServices.length > 0;
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
            name                : [this.user.serviceProvider.name, Validators.required],
            phone               : [this.user.serviceProvider.phone, Validators.required],
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
    onGoInvoicing(): void{
        if (this.invoicingFlag){
            window.open(this.invoicingURL, 'Stripe', 'dialog=yes,width=1000,height=800');
        }
        else{
            window.location.href = this.invoicingURL;
        }
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

    /**
     * Edit ProviderService
     *
     * @param providerService
     */
    editProviderService(providerService): void
    {
        const dialogRef = this._matDialog.open(UserServiceEditComponent, {
            panelClass: 'user-service-edit',
            disableClose: true,
            data      : {
                providerService: providerService,
                action : 'edit'
            }
        });
        dialogRef.afterClosed()
            .subscribe(response => {                
                if ( !response )
                {
                    return;
                }
                const actionType: string = response[0];
                const formData: FormGroup = response[1];
                switch ( actionType )
                {
                    /**
                     * Save
                     */
                    case 'save':                                
                        this._providerServicesService.updateProviderService(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteProviderService(providerService);

                        break;
                }
            });
    }
    /**
     * Delete ProviderService
     */
    deleteProviderService(providerService): void
    {
        const event = {
            title: 'HorseLinc',
            msg: 'Are you sure you want to delete?',
            btn1Name: 'No',
            btn2Name: 'Yes'
        }
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action == event.btn2Name) {
                this._providerServicesService.deleteProviderService(providerService);
            }
            else
            {
            }
        });
    }

    /**
     * New ProviderService
     */
    newProviderService(): void
    {
        const dialogRef = this._matDialog.open(UserServiceEditComponent, {
            panelClass: 'user-service-edit',
            data      : {
                action: 'new'
            }
        });

        dialogRef.afterClosed()
            .subscribe((form: FormGroup) => {
                if ( !form )
                {
                    return;
                }                
                this._providerServicesService.createProviderService(form.getRawValue());
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
                this.user.serviceProvider.avatarUrl = this.avatarUrl;
                this.saveUserToDB();
            });
            })
        )
        .subscribe();
    }

    saveUserToDB(): void{
        const uid = this.user.uid;
        const data = this.profileForm.getRawValue();

        this.user.type = HLUserType.provider;

        this.user.horseManager.percentage = 100;

        this.user.serviceProvider.createdAt = this.user.createdAt;
        this.user.serviceProvider.userId = this.user.uid;
        this.user.serviceProvider.name = data.name;
        this.user.serviceProvider.phone = data.phone;
        this.user.serviceProvider.location = this.location;

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
            this.message = 'The name field is blanked';
            return false;
        }
        else if (data.phone === ''){
            this.message = 'The phone field is blanked';
            return false;
        }
        else if (this.location === ''){
            this.message = 'Your address field is blanked';
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
            this.avatarUrl = this.user.serviceProvider.avatarUrl;
            this.saveUserToDB();
        }

        this._appService.showSnackBar('Service Provider saved successfully', 'OK');
        this._appService.navigateToFirstPage();
    }
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {UserProviderServicesService} _providerServicesService
     */
    constructor(
        private _providerServicesService: UserProviderServicesService
    )
    {
        super();
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        return this._providerServicesService.onProviderServicesChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
