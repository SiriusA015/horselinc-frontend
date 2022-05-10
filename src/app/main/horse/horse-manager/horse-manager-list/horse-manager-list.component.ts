
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { MatDialog } from '@angular/material';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HLHorseManagerModel } from 'app/model/users';
import { HLHorseModel, HLHorseFilterModel } from 'app/model/horses';
import { HLUserModel} from 'app/model/users';
import { takeUntil, debounceTime, distinctUntilChanged  } from 'rxjs/operators';
import { HorseFilterComponent } from './horse-filter/horse-filter.component';
import { FuseConfigService } from '@fuse/services/config.service';
import { UserAuthService } from 'app/service/user-auth.service';
@Component({
    selector     : 'horse-manager-list',
    templateUrl  : './horse-manager-list.component.html',
    styleUrls    : ['./horse-manager-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class HorseManagerListComponent implements OnInit, OnDestroy
{
    user: HLUserModel;
    horses: HLHorseModel[] = [];
    disHorses: HLHorseModel[];
    currentHorse: HLHorseModel;
    selectOwner: HLHorseManagerModel;
    selectTrainer: HLHorseManagerModel;
    filterData: HLHorseFilterModel;
    searchHorse: HLHorseModel[] = [];
   
    sortBy: string[] = ['None', 'BarnName(ascending)', 'BarnName(descending)', 'CreationDate(ascending)', 'CreationDate(descending)'];
    sort: string;
    userQuestion: string = '';
    query: string;

    toggle: boolean;
    ownerFlag: boolean = false;
    trainerFlag: boolean = false;
    checked: boolean;
    disFlag: boolean;
    isLogging: boolean = false;
    findErr: boolean = false;
    isLoggingFilter: boolean = false;
    scrollFlag: boolean = true;
    filterFlag: boolean;
    clearFlag: boolean = false;
    isLogging1: boolean;
    isLogging2: boolean = true;
    lodingHorseLoadmoreFlag: boolean;

    userQuestionUpdate = new Subject<string>();
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _horseManagerService: HorseManagerService,
        private _location: Location,
        private _fuseSidebarService: FuseSidebarService,
        private _dialog: MatDialog, 
        private _fuseConfigService: FuseConfigService,
        private _userAuthService: UserAuthService,
    )
    {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void
    {
        this.toggle = true;
        this.lodingHorseLoadmoreFlag = false;
        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user){ this.isLogging2 = false; }
        });
        
        this._horseManagerService.onHorsesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {
                
                this.isLogging1 = false;
                this.lodingHorseLoadmoreFlag = false;
                this.horses = horses;  
                this.currentHorse = this._horseManagerService.selectHorse;
                this.clearFlag = false;
                this.selectOwner = new HLHorseManagerModel({});
                this.selectTrainer = new HLHorseManagerModel({});
                this.filterFlag = this._horseManagerService.filterFlag;
                this.disHorses = [];
              
                if (this._horseManagerService.checked){
                    this.horses.map(horse => { 
                        this._horseManagerService.getCurrentScheduleFlag(horse.uid)
                            .then(flag => {                            
                                 if (flag){this.disHorses.push(horse); }
                            });
                    });
                }
                else
                {
                    this.horses.map(horse => {
                        this.disHorses.push(horse);
                    });
                }

                if (this.horses.length > 0){
                    this.disFlag = true;
                }
                else{
                    this.disFlag = false;
                }                  
            });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                this.isLogging = true;
                this.findErr = false; 
                this.searchCurrent(value);
            });  
    }

    openDialog(): void {
            const dialogRef = this._dialog.open(HorseFilterComponent, {
                disableClose: true,
                data: { 'statue': this.query , 'horses': this.horses}
            });
            
            dialogRef.afterClosed().subscribe(result => {
                if (result != ''){
                    if (this.query == 'owner'){this.selectOwner = result; }
                    if (this.query == 'trainer'){this.selectTrainer = result; }
                }      
            });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    onScrollDown(): void {
        if (this._horseManagerService.stopHorseLoadmore || this.lodingHorseLoadmoreFlag){ return; }

        let lastHorseId: string = this.horses[this.horses.length - 1].uid;
        this.isLogging1 = true;
        this.lodingHorseLoadmoreFlag = true;
        this._horseManagerService.getHorsesForManager(lastHorseId);   
    }
      
    searchCurrent(query): void{
        let tempHorses: HLHorseModel[] = [];
        this.horses.map(horse => {
            if ( horse.barnName.toLowerCase().search(query.toLowerCase()) >= 0 || horse.trainer.name.toLowerCase().search(query.toLowerCase()) >= 0 || horse.displayName.toLowerCase().search(query.toLowerCase()) >= 0 ) {
                tempHorses.push(horse);
            }
        });
        this.disHorses = tempHorses;
        if (this.disHorses && this.disHorses.length > 0){
            this._horseManagerService.setCurrentHorseSchedule(this.disHorses[0].uid);
            this.isLogging = false; 
            this.findErr = false;
        }
        else{
            this.isLogging = false; 
            this.findErr = true;
        }
    }
    
    readHorse(horseId): void
    {
        this._horseManagerService.setCurrentHorseSchedule(horseId);
        this.setCurrentHorse(horseId);
        this._horseManagerService.onCurrentHorseFlagChanged.next('true');  
    }

    setCurrentHorse(uid: any): void
    {     
        this.currentHorse = this.horses.find(horse => {
            return horse.uid === uid;
        });
        this._horseManagerService.selectHorse = this.currentHorse;
        this._horseManagerService.onCurrentHorseChanged.next(this.currentHorse);
    }

    newHorseProfile(): void
    {
        this._horseManagerService.onEditHorseProfile.next(new HLHorseModel('', {}));
        this._fuseSidebarService.getSidebar('horse-manager-profile-panel').toggleOpen();
    }

    horseFilter(): void{
        this.toggle = !this.toggle;
        if (this._horseManagerService.sortType == ''){this.sort = 'None'; }
        this.selectTrainer = this._horseManagerService.trainer;
        this.selectOwner = this._horseManagerService.owner;
        this.checked = this._horseManagerService.checked;
        this.sort = this._horseManagerService.sortType;
    }

    filterClear(): void {
        this.ownerFlag = false;
        this.checked = false;
        this.trainerFlag = false;
        this.sort = '';
        this.selectOwner = new HLHorseManagerModel({});
        this.selectTrainer = new HLHorseManagerModel({});
        this.clearFlag = true;
    }
   
    filterApply(): void{
        this.toggle = true;
        this._horseManagerService.selectHorse = new HLHorseModel('', {});
        this.filterData = new HLHorseFilterModel('',{});
        this.filterData.trainer = new HLHorseManagerModel({});
        this.filterData.owner = new HLHorseManagerModel({});
        this.filterData.trainer = new HLHorseManagerModel(this.selectTrainer); 
        this.filterData.owner = new HLHorseManagerModel(this.selectOwner);
        this.filterData.sortType = this.sort;
        this.filterData.checked = this.checked;
        this.filterData.query = this.query;

        if (this.clearFlag == true){ this.filterFlag = false; this.clearFlag = false; }else{this.filterFlag = true; this.clearFlag = false; }
        if (this.selectTrainer.userId =='' && this.selectOwner.userId == '' && this.checked == false && this.sort == '' ) { this.filterFlag = false; }
   
        this._horseManagerService.filterFlag = this.filterFlag;
        this._horseManagerService.saveFilterDataToLocal(this.filterData);
        this._horseManagerService.getHorsesForManager('');
       
    }   

    ownerSelect(): void{
        this.query = 'owner';
        this.openDialog();
    }

    trainerSelect(): void{
        this.query = 'trainer';
        this.openDialog();
    }
    
}
