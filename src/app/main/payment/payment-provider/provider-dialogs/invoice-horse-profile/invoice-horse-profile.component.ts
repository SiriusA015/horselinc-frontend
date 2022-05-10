import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup} from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { UserHorseManagerService  } from 'app/service/user-horse-manager.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { UserPhotoEditComponent, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserModel} from 'app/model/users';
import { AngularFirestore } from '@angular/fire/firestore';
import { fuseAnimations } from '@fuse/animations';
import { AppService } from 'app/service/app.service';

interface Registration {
    name: string;
    number: number; 
}

@Component({
    selector     : 'invoice-horse-profile',
    templateUrl  : './invoice-horse-profile.component.html',
    styleUrls    : ['./invoice-horse-profile.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
})
export class InvoiceHorseProfileComponent implements OnInit, OnDestroy
{   
    
    horseForm: FormGroup;
    isLogging: boolean;
    tempUid: string;
    user: HLUserModel;
    private _unsubscribeAll: Subject<any>;

    sms: string;
    email: string;
    uploadedUrlOb: Observable<string>;
    uploadedAvatarUrl: any = '';
    uploadPercentOb: Observable<number>;
    uploadAvatarFlag: boolean;
    photoOutput: UserPhotoOutput;

    horseYears: number[];
    ownerErrFlag: boolean;
    ownerTotal: number;
    
    selected: string;

    public leaserFilterCtrl: FormControl = new FormControl();
    public trainerFilterCtrl: FormControl = new FormControl();
    public creatorFilterCtrl: FormControl = new FormControl();
    /**
     * Constructor
     *
     * 
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     */
    constructor(

        private db: AngularFirestore,
        private _horseManagerService: HorseManagerService,
        private _horseProviderService: HorseProviderService,
        private _fuseSidebarService: FuseSidebarService,
        private _formBuilder: FormBuilder,
        private _matSnackBar: MatSnackBar, 
        private _matDialog: MatDialog,
        private _afStorage: AngularFireStorage,
        private _userAuthService: UserAuthService,
        private _appService: AppService, 
        private _userHorseManagerService: UserHorseManagerService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();

        const horseYear: number = new Date().getFullYear();
        this.horseYears = [];
        for (let listyear = horseYear - 10 ; listyear < horseYear + 10; listyear++){
            this.horseYears.push(listyear);  
        }

    }   

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.user = this._userAuthService.hlUser;
        this.selected = 'SMS';
        this.onInit();
    }
    
    onInit(): void {
        this.user = this._userAuthService.hlUser;
        this.selected = 'SMS';
        this.sms = '';
        this.email = '';
        this.horseForm = this.createHorseForm();
        this.uploadAvatarFlag = false;
        this.uploadedAvatarUrl =  'assets/icons/horselinc/ic-camera-alt.svg';
        this.horseForm = this.createHorseForm();
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    toggleSidebar(name): void
    {
         this._fuseSidebarService.getSidebar(name).toggleOpen();
    }
    changeSms(event): void{
        this.sms = event;
    }
    changeEmail(event): void{
        this.email = event;
    }

    profileCancel(): void
    {
        this.onInit();
        this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').close();
        this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').open();
    }
  
    createHorseForm(): FormGroup
    {
        return this._formBuilder.group({
            uid                 : [''],
            avatarUrl           : [''],
            barnName            : ['', Validators.required],
            displayName         : [''],
            gender              : [''],
            birthYear           : [''],
            sire                : [],
            dam                 : [],
            color               : [],
            height              : [],
            description         : [],
            privateNote         : [],
            isDeleted           : [],
            leaserId            : [],
            trainerId           : [],
            creatorId           : [],
            createdAt           : [],
            registrations       : [],
            ownerIds            : [],
            owners              : [],
            trainer             : [],
            leaser              : [],
            invoiceMethod       : [],
        });
    }

    onValidaton(): boolean{
        if (this.sms != '' || this.email != ''){
            return false;
        } else {
            return true;
        }
        
    }

    addHorse(): void
    {
        if (this.email && this.email != ''){
            this.sms = null;
        } 
        else{
            this.email = null;
        } 
        this.isLogging = true;
        const data = this.horseForm.getRawValue();

        this._horseManagerService.createHorse(data)
            .then((horse) => {
                if (this.uploadAvatarFlag){
                    this.tempUid = horse.uid;
                    this.uploadAvatar(this.photoOutput.croppedImageFile).then(() => {
                        data.avatarUrl = this.uploadedAvatarUrl;
                        data.uid = horse.uid;
                        this._horseManagerService.updateHorse(data).then( updatehorse => {
                            this.isLogging = false;
                            this._horseProviderService.onInvoiceCreateHorse.next({horse: updatehorse, sms: this.sms, email: this.email, name: '' });
                            this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').close();
                            this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').close();
                            this._fuseSidebarService.getSidebar('payment-provider-create-panel').open();
                            this.onInit();
                        });
                    });
                }
                else
                {
                    this._horseProviderService.onInvoiceCreateHorse.next({horse: horse, sms: this.sms, email: this.email, name: ''});
                    this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').close();
                    this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').close();
                    this._fuseSidebarService.getSidebar('payment-provider-create-panel').open();
                    this.isLogging = false;
                    this.onInit();
                }    
        });
    }

    changedAvatarFile(event: any): void{
        const dialogRef = this._matDialog.open(UserPhotoEditComponent, {
            disableClose: true,
            panelClass: 'user-photo-edit',
            data: {event: event
            } 
        });
        dialogRef.afterClosed().subscribe((photoOutput: UserPhotoOutput) => {
            if (photoOutput) {
                this.photoOutput = photoOutput;
                this.uploadAvatarFlag = true;
                this.uploadedAvatarUrl = photoOutput.croppedImage64;
            }
        });
    }
    async uploadAvatar(avatarFile): Promise<any> {
        return new Promise((resolve, reject) => {
        const avatarPath = 'horses/' + this.user.uid + '/' + this.tempUid;
        const storageRef = this._afStorage.ref(avatarPath);      
        const task = this._afStorage.upload(avatarPath, avatarFile);
        this.uploadPercentOb = task.percentageChanges();
        task.snapshotChanges().pipe(
            finalize(() => {
                this.uploadedUrlOb = storageRef.getDownloadURL();
                this.uploadedUrlOb.subscribe(url => {
                    this.uploadedAvatarUrl = url;
                    resolve();
                });
            })
        )
        .subscribe();

        });
    }
}
