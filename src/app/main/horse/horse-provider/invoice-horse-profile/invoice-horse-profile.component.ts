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
    UploadAvatarFlag: boolean;
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

        let horseYear: number = new Date().getFullYear();
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
    onInit(): void{
        this.sms = '';
        this.email = '';
        this.horseForm = this.createHorseForm();
        this.UploadAvatarFlag = false;
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

    ProfileCancel(): void
    {  
        this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').close();
        this.onInit();     
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
        const data = this.horseForm.getRawValue();
        if (data.barnName.trim() === ''){
            // this._appService.showSnackBar('The Horse Barn Name field is blanked.', 'OK');  
            return false;
        }
        if (this.sms =='' && this.email==''){
            // this._appService.showSnackBar('Please set invoice method.', 'OK');  
            return false;
        }
        return true;
    }

//             Firedatabase CURD 

    addHorse(): void
    {
        if ( !this.onValidaton()){
            return;
        }
        this.isLogging = true;
        const data = this.horseForm.getRawValue();

        this._horseManagerService.createHorse(data)
            .then((horse) => {
                if (this.UploadAvatarFlag){
                    this.tempUid = horse.uid;
                    this.uploadAvatar(this.photoOutput.croppedImageFile).then(() => {
                        data.avatarUrl = this.uploadedAvatarUrl;
                        data.uid = horse.uid;
                        this._horseManagerService.updateHorse(data).then( updatehorse => {
                                this.isLogging = false;
                                this._horseProviderService.onInvoiceCreateHorse.next({"horse": updatehorse, "sms": this.sms, "email": this.email });
                                this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').close();   
                                //this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();   
                                this.onInit();

                        }); 
                    });
                }
                else
                {   
                    this._horseProviderService.onInvoiceCreateHorse.next({'horse': horse, 'sms': this.sms, 'email': this.email });
                    this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').close();   
                    //this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();   
                    this.onInit();
                    this.isLogging = false;
                }    
                            
        });   
    

    }
//  Photo insert Function 

    changedAvatarFile(event: any): void{
        const dialogRef = this._matDialog.open(UserPhotoEditComponent, {
            panelClass: 'user-photo-edit',
            data: {event: event
            } 
        });
        dialogRef.afterClosed().subscribe((photoOutput: UserPhotoOutput) => {
            if (photoOutput) {
                this.photoOutput = photoOutput;
                this.UploadAvatarFlag = true;
                this.uploadedAvatarUrl = photoOutput.croppedImage64;
            }
        });
    }
    async uploadAvatar(avatarFile): Promise<any> {
        return new Promise((resolve, reject) => {
        const avatarPath = 'horses/' + this.user.uid + '/' + this.tempUid;
        const storageRef = this._afStorage.ref(avatarPath);      
        const task = this._afStorage.upload(avatarPath, avatarFile);
        // observe percentage changes
        this.uploadPercentOb = task.percentageChanges();
        // get notified when the download URL is available
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
