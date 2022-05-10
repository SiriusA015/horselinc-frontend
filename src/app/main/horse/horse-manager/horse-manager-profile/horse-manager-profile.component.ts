import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup} from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { UserHorseManagerService  } from 'app/service/user-horse-manager.service';
import { HLHorseModel, HLHorseOwnerModel } from 'app/model/horses';
import { HLHorseManagerModel } from 'app/model/users';
import { MatSnackBar, MatDialog } from '@angular/material';
import { UserPhotoEditComponent, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserModel} from 'app/model/users';
import { AngularFirestore } from '@angular/fire/firestore';
import { fuseAnimations } from '@fuse/animations';
import { AppService } from 'app/service/app.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

interface Registration {
    name: string;
    number: number; 
}
@Component({
    selector     : 'horse-manager-profile',
    templateUrl  : './horse-manager-profile.component.html',
    styleUrls    : ['./horse-manager-profile.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
})
export class HorseManagerProfileComponent implements OnInit, OnDestroy
{   
    horse: HLHorseModel;
    trainer: HLHorseManagerModel;
    leaser: HLHorseManagerModel;
    userTrainer: HLHorseManagerModel;
    currentOwner: HLHorseOwnerModel[];
    oldOwners: HLHorseOwnerModel[];
    user: HLUserModel;
    hasSelectedHorseProfileComponent: boolean;
    isIndeterminate: boolean;
    ownerFlag: boolean;
    registrationFlag: boolean;
    searchInput: FormControl;
    horseForm: FormGroup;
    stateMessage: string;
    pageType: string;
    isLogging: boolean;
    isLogging1: boolean;
    tempUid: string;
    currentTrainerAvatar: string;
    currentTrainerName: string;
    currentTrainerIcon: string;
    registrations: Registration[];
    currentLeasedAvatar: string;
    currentLeasedName: string;
    currentLeasedIcon: string;
    uploadedUrlOb: Observable<string>;
    uploadedAvatarUrl: any = '';
    uploadPercentOb: Observable<number>;
    UploadAvatarFlag: boolean;
    photoOutput: UserPhotoOutput;
    horseYears: number[];
    ownerErrFlag: boolean;
    ownerTotal: number;

    private _unsubscribeAll: Subject<any>;
    public leaserFilterCtrl: FormControl = new FormControl();
    public trainerFilterCtrl: FormControl = new FormControl();
    public creatorFilterCtrl: FormControl = new FormControl();
  
    constructor(

        private db: AngularFirestore,
        private _horseManagerService: HorseManagerService,
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
        this.horse = new HLHorseModel('', {});
        this._unsubscribeAll = new Subject();
        this.currentTrainerAvatar = 'assets/icons/horselinc/ic-profile.svg';
        this.currentTrainerName = 'Search by name';
        this.currentTrainerIcon = 'assets/icons/horselinc/search.svg';
        this.currentLeasedName = 'Search by name';
        this.currentLeasedAvatar = 'assets/icons/horselinc/ic-profile.svg';
        this.currentLeasedIcon = 'assets/icons/horselinc/search.svg';
        let horseYear: number = new Date().getFullYear();
        this.horseYears = [];
        for (let listyear = horseYear - 10 ; listyear < horseYear + 10; listyear++){
            this.horseYears.push(listyear);  
        }
    }   

    ngOnInit(): void
    {
        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            this.user = user;
            if (user){
                if (user.horseManager){
                    this.userTrainer = user.horseManager;
                    this.trainer =  user.horseManager;
                }
            }
        });

        this._horseManagerService.onEditHorseProfile
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentHorse => {

            if ( currentHorse.uid != '' && currentHorse != false && currentHorse != '')
                {  
                    this.oldOwners = [];
                    this.currentOwner = [];
                    this.horse = currentHorse;
                    this.UploadAvatarFlag = false;
                    this.pageType = 'edit';     
                    this.leaser = null;
                    
                    if (this.horse.trainer){
                        this.trainer = this.horse.trainer;
                    }

                    if (this.horse.leaser){
                        this.leaser = this.horse.leaser;
                        if (this.horse.leaser.avatarUrl){ 
                            this.currentLeasedAvatar = this.horse.leaser.avatarUrl; 
                        }
                        else{ 
                            this.currentLeasedAvatar = 'assets/icons/horselinc/ic-profile.svg';    
                        }
                        if ( this.horse.leaser.name ) { this.currentLeasedName = this.horse.leaser.name; }
                    }
                    else
                    {
                        this.currentLeasedName = 'Search by name';
                        this.currentLeasedAvatar = 'assets/icons/horselinc/ic-profile.svg';
                    }
                    if ( this.horse.ownerIds)
                    {     
                        this.currentOwner = this.horse.owners;
                        this.horse.owners.map(owner => {
                            this.oldOwners.push(owner);
                        });
                        this.ownerFlag = true;
                        this.totalOwnerPercentage();
                    }

                    if (this.horse.registrations && this.horse.registrations.length > 0){
                        this.registrations = [];
                        this.horse.registrations.map(registration => {
                        this.registrations.push( registration );
                        });
                        this.registrationFlag = true;
                    }
                    else
                    {
                        this.registrationFlag = false;
                    }
                 
                }
                else
                {
                    this.pageType = 'new';                    
                    this.horse = new HLHorseModel('', {});

                    this.trainer =  this.userTrainer;
                    this.leaser = null;
                    this.ownerTotal = 0;
                    this.currentOwner = [];
                    this.registrations = [];
                    this.oldOwners = [];
                    this.currentLeasedName = 'Search by name';
                    this.currentLeasedAvatar = 'assets/icons/horselinc/ic-profile.svg';
                    this.registrationFlag = false;
                    this.ownerErrFlag = false;
                    this.ownerFlag = true;
                    this.UploadAvatarFlag = false;  
                }
            this.uploadedAvatarUrl = this.horse.avatarUrl ? this.horse.avatarUrl : 'assets/icons/horselinc/ic-camera-alt.svg';
            this.horseForm = this.createHorseForm();
        });

        this._horseManagerService.onCurrentSearchTrainer
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentTrainer => {

            if ( currentTrainer)
            {
                this.trainer = currentTrainer;

                if ( this.trainer.avatarUrl ) 
                    { this.currentTrainerAvatar = this.trainer.avatarUrl; }
                else 
                    { this.currentTrainerAvatar = 'assets/icons/horselinc/ic-profile.svg'; }

                if (this.trainer.name) { this.currentTrainerName = this.trainer.name; }
            }
            else
            {                 
                this.trainer = new HLHorseManagerModel(null);
                this.currentTrainerAvatar = 'assets/icons/horselinc/ic-profile.svg';
                this.currentTrainerName = 'Search by name';
            }
        });

        this._horseManagerService.onCurrentSearchLeaser
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentLeaser => {
            if (currentLeaser)
            {
                this.leaser = currentLeaser;
            
                if ( this.leaser.avatarUrl) 
                    { this.currentLeasedAvatar = this.leaser.avatarUrl; }
                else 
                    { this.currentLeasedAvatar = 'assets/icons/horselinc/ic-profile.svg'; }
                if (this.leaser.name) { this.currentLeasedName = this.leaser.name; }
            }
            else
            {                 
                this.leaser = new HLHorseManagerModel(null);
                this.currentLeasedName = 'Search by name';
                this.currentLeasedAvatar = 'assets/icons/horselinc/ic-profile.svg';
            }
            
        });
        
        this._horseManagerService.onCurrentSearchOwner
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentOwner => {
            this.currentOwner.push (currentOwner);
            this.ownerFlag = true;
            this.totalOwnerPercentage(); 
        });
        
        this._userHorseManagerService.onHorseOwnerCreated
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horseOwner => {
             if (horseOwner.uid){ 
                
               this.currentOwner.push(horseOwner.horseManager);
              
               this.totalOwnerPercentage();
               
            }
        });    
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    toggleSidebar(name): void
    {
         this._fuseSidebarService.getSidebar(name).toggleOpen();
    }
    
    ProfileCancel(): void
    {
        this._fuseSidebarService.getSidebar('horse-manager-profile-panel').toggleOpen();
    }
    searchTrainer(): void{

        let searchItem = 'trainer';
        this._horseManagerService.onSearchSelectItem.next(searchItem);
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
    }

    searchLeaser(): void{

        let searchItem = 'leaser';
        this._horseManagerService.onSearchSelectItem.next(searchItem);
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
    }

    searchOwner(): void{

        let searchItem = 'owner';
        this._horseManagerService.onSearchSelectItem.next(searchItem);
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
    }

    changeOwnerPercentage(percentage, userId): void{
        this.currentOwner.map(owner => {
            if (owner.userId === userId){
                owner.percentage = percentage;
            }
        });

        this.totalOwnerPercentage();
    }

    cancelOwner(userId): void{

        let index: number;
        let delOwner: HLHorseOwnerModel;

        delOwner = this.currentOwner.find(owner => {
           
           return owner.userId === userId;
           
        });
        index = this.currentOwner.indexOf(delOwner);
        this.currentOwner.splice(index, 1);
        if (this.currentOwner.length <= 0)
        {
            this.ownerFlag = true;
        }

        this.totalOwnerPercentage();
    }

    totalOwnerPercentage(): void{

        this.ownerTotal = 0;
        if (this.currentOwner.length > 0){
            this.currentOwner.map(owner => {
               this.ownerTotal = this.ownerTotal + Number(owner.percentage);
            //    console.log('this is ownerTotal', this.ownerTotal, owner.percentage);
            });
        }
        else
        {
            this.ownerTotal = 0;
        }
        if (this.currentOwner.length === 0 || this.ownerTotal === 100){ this.ownerErrFlag = false; } else { this.ownerErrFlag = true; }

    }

    registrationAdd(event): void{

        let query: Registration = {name: '', number: 0};

        query.name = event.target.value;
        this.registrations.push(query);
        this.registrationFlag = true;
    }

    registrationDel(name): void{

        
        let index: number;
        let delRegistration: Registration;
     
        delRegistration = this.registrations.find(registration => {
           
           return registration.name === name;
           
        });
      
        index = this.registrations.indexOf(delRegistration);
        this.registrations.splice(index, 1);
        if  ( this.registrations.length ) {
            this.registrationFlag = false;
        }

    }
  
    createHorseForm(): FormGroup
    {
        return this._formBuilder.group({
            uid                 : [this.horse.uid],
            avatarUrl           : [this.horse.avatarUrl],
            barnName            : [this.horse.barnName, Validators.required],
            displayName         : [this.horse.displayName, Validators.required],
            gender              : [this.horse.gender, Validators.required],
            birthYear           : [this.horse.birthYear == 0 ? '' : String(this.horse.birthYear), Validators.required],
            sire                : [this.horse.sire],
            dam                 : [this.horse.dam],
            color               : [this.horse.color],
            height              : [this.horse.height],
            description         : [this.horse.description],
            privateNote         : [this.horse.privateNote],
            isDeleted           : [this.horse.isDeleted.toString()],
            leaserId            : [this.horse.leaserId],
            trainerId           : [this.horse.trainerId],
            creatorId           : [this.horse.creatorId],
            createdAt           : [this.horse.createdAt],
            registrations       : [this.horse.registrations],
            ownerIds            : [this.horse.ownerIds],
            owners              : [this.horse.owners],
            trainer             : [this.horse.trainer],
            leaser              : [this.horse.leaser],
        });
    }

    onValidaton(): boolean{
        const data = this.horseForm.getRawValue();
        if (data.displayName.trim() === ''){
            this._appService.showSnackBar('The Horse Show Name field is blanked.', 'OK');  
            return false;     
        }
        if (data.barnName.trim() === ''){
            this._appService.showSnackBar('The Horse Barn Name field is blanked.', 'OK');  
            return false;
        }
        if (data.gender.trim() === ''){
            this._appService.showSnackBar('The Horse Gender field is blanked.', 'OK');  
            return false;
        }
        if (data.birthYear.trim() === ''){
            this._appService.showSnackBar('The Horse Birth Year field is blanked.', 'OK'); 
            return false;
        }
        this.totalOwnerPercentage();
        if (this.currentOwner.length > 0 && this.ownerTotal !== 100){
            this._appService.showSnackBar('Percentages of ownership must total 100%.', 'OK');  
            return false;
        }
        return true;
    }
    
    addHorse(): void
    {   
        if ( !this.onValidaton()){
            return;
        }
        this.isLogging = true;
        const data = this.horseForm.getRawValue();

        if (this.leaser){ data.leaserId = this.leaser.userId; data.leaser = this.leaser; }else{ data.leaserId = ''; }
        if (this.trainer.userId){ data.trainerId = this.trainer.userId; data.trainer = this.trainer; }else{data.trainerId = ''; }
        data.ownerIds = [];
        if (this.currentOwner.length > 0){
            this.currentOwner.map( owner => {
                data.ownerIds.push(owner.userId);
            });
            data.owners = this.currentOwner;
        }
        if (this.registrations ){
            data.registrations = [];
            this.registrations.map( registration => {
                data.registrations.push(registration);
            });
        }
        else
        {
            data.registrations = '';
        }
        data.creatorId = this.user.uid; 
        data.birthYear = Number(data.birthYear);

        if  ( this.pageType === 'new' ) { 
            data.avatarUrl = '';
            this._horseManagerService.createHorse(data)
                .then((horse) => {
                    if (this.UploadAvatarFlag){
                        this.tempUid = horse.uid;
                        this.uploadAvatar(this.photoOutput.croppedImageFile).then(() => {
                            data.avatarUrl = this.uploadedAvatarUrl;
                            data.uid = horse.uid;
                            this._horseManagerService.updateHorse(data).then( updatehorse => {
                                let num: number;
                                num = 0;
                                if (data.owners.length > 0){
                                    data.owners.map(owner => {
                                        owner.horseId = updatehorse.uid;
                                    });
                                    data.owners.map(owner => {
                                        this._horseManagerService.createOwner(owner)
                                            .then((temp) => {

                                                if (num === data.owners.length){
                                                    num = 0;
                                                    this._appService.showSnackBar('Horse data added successfully', 'OK');
                                                    this.isLogging = false;
                                                    this._fuseSidebarService.getSidebar('horse-manager-profile-panel').close();   
                                                    this._horseManagerService.selectHorse = new HLHorseModel('', {});   
                                                    this._horseManagerService.getHorsesForManager('');
                                                    this._horseManagerService.onCurrentHorseFlagChanged.next(false);
                                                    return;
                                                }
                                        }); 
                                        num++;    
                                    });           
                                  
                                }
                                else{    
                                    this._appService.showSnackBar('Horse data added successfully', 'OK');
                                    this._fuseSidebarService.getSidebar('horse-manager-profile-panel').close();   
                                    this.isLogging = false;
                                    this._horseManagerService.selectHorse = new HLHorseModel('', {});   
                                    this._horseManagerService.getHorsesForManager('');
                                    this._horseManagerService.onCurrentHorseFlagChanged.next(false);
                                }
                            }); 

                        });
                    }
                    else
                    {   
                        let num: number;
                        num = 0;
                        if (data.owners.length > 0){
                            data.owners.map(owner => {
                                owner.horseId = horse.uid;
                            });
                            data.owners.map(owner => {
                                this._horseManagerService.createOwner(owner)
                                    .then((temp) => {

                                        if (num === data.owners.length){
                                            num = 0;
                                            this._appService.showSnackBar('Horse data added successfully', 'OK');
                                            this._fuseSidebarService.getSidebar('horse-manager-profile-panel').close();   
                                            this.isLogging = false;
                                            this._horseManagerService.getHorsesForManager('');
                                            this._horseManagerService.onCurrentHorseFlagChanged.next(false);
                                            return;
                                        }
                                }); 
                                num++;    
                            });           
                        }
                        else{
                            
                            this._appService.showSnackBar('Horse data added successfully', 'OK');
                            this._fuseSidebarService.getSidebar('horse-manager-profile-panel').close();   
                            this.isLogging = false;
                            this._horseManagerService.getHorsesForManager('');
                            this._horseManagerService.onCurrentHorseFlagChanged.next(false);
                        }     
                    }
                });
            }
        if  (this.pageType === 'edit' ) { 

            this.onOwnersEdit(data);
            this.tempUid = this.horse.uid;

            if (this.UploadAvatarFlag){
                this.uploadAvatar(this.photoOutput.croppedImageFile).then(() => {
                data.avatarUrl = this.uploadedAvatarUrl; 
                this._horseManagerService.updateHorse(data)
                    .then((horse) => {

                        this.onHorseUpdateReflesh(horse, data);
                    });
                });
            }
            else
            {   
                data.avatarUrl = this.horse.avatarUrl;
                this._horseManagerService.updateHorse(data)
                .then((horse) => {
                    
                    this.onHorseUpdateReflesh(horse, data);
                    
            });
            }  
        }
    }

    onOwnersEdit(data: any): void{
        let temp: boolean; 
        temp = false;
        if (data.owners.length > 0){

            if (this.oldOwners.length > 0){
        
                this.oldOwners.map(newOwner => {
                    data.owners.map(ageOwner => {
                        if (ageOwner.uid === newOwner.uid) {temp = true; }
                    });
                    if (temp){this._horseManagerService.updateOwner(newOwner); }
                    if (!temp){this._horseManagerService.deleteOwner(newOwner); }
                    temp = false;
                });
                data.owners.map(newOwner => {
                    this.oldOwners.map(oldOwner => {
                        if (oldOwner.uid === newOwner.uid) {temp = true; }
                    });
                    
                    newOwner.horseId = this.horse.uid;
                    if (!temp){this._horseManagerService.createOwner(newOwner).then(() => {     
                        }); 
                    }   
                    temp = false;
                });
            }
            else
            {
                data.owners.map(owner => {
                    owner.horseId = this.horse.uid;
                });
                data.owners.map(owner => {
                    this._horseManagerService.createOwner(owner).then(() => {
                    });  
                });      
              }
        }
        else
        {
            if (this.oldOwners.length > 0){
                this.oldOwners.map(owner => {
                    this._horseManagerService.deleteOwner(owner);  
                });
             }       
        }
    }

    onHorseUpdateReflesh(horse, data: any): void{
        let newHorse = new HLHorseModel(horse.uid, data);
        let horseListLength = this._horseManagerService.horses.length;
        for (let i = 0; i < horseListLength; i++ ){
            if (this._horseManagerService.horses[i].uid === newHorse.uid){
                this._horseManagerService.horses[i] = newHorse;
            }
        }
        this._appService.showSnackBar('Horse data saved successfully', 'OK');  
        this._horseManagerService.selectHorse = newHorse;
        this._horseManagerService.onCurrentHorseChanged.next(this._horseManagerService.selectHorse);
        this._horseManagerService.onHorsesChanged.next(this._horseManagerService.horses);
        this._horseManagerService.onCurrentHorseFlagChanged.next(true);
        this.isLogging = false;
        this._fuseSidebarService.getSidebar('horse-manager-profile-panel').close();   
    }

    onSendReminder(): void {
        const event = {
            title: 'HorseLinc',
            msg: 'Are you sure you want to delete horse?',
            btn1Name: 'No',
            btn2Name: 'Yes'
        }
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action === event.btn2Name) {
                this.delHorse();
            }
            else
            {
            }
        });
    }

    delHorse(): void{
        this.isLogging1 = true;
        this._horseManagerService.deleteHorse(this.horse)
                  .then(() => {
                    this._horseManagerService.selectHorse = new HLHorseModel('', {});      
                    this._horseManagerService.onCurrentHorseFlagChanged.next(false);               
                    this._appService.showSnackBar('Horse data deleted successfully', 'OK');   
                    this._horseManagerService.getHorsesForManager('');  
                    this._fuseSidebarService.getSidebar('horse-manager-profile-panel').close();   
                    this.isLogging1 = false;         
        });
    }

// Photo insert Function 
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

    newOwner(): void{
        this._userHorseManagerService.requestHorseOwnerCreate();
        this._fuseSidebarService.getSidebar('horse-owner-create').open();
    }
}
