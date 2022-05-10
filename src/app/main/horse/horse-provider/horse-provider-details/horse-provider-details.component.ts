import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HLHorseModel } from 'app/model/horses';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { AppService } from 'app/service/app.service';
import { HLHorseManagerModel } from 'app/model/users';
@Component({
    selector   : 'horse-provider-details',
    templateUrl: './horse-provider-details.component.html',
    styleUrls  : ['./horse-provider-details.component.scss']
})
export class HorseProviderDetailsComponent implements OnInit, OnDestroy
{
    
    providerHorse: HLHorseModel;
    providerManager: HLHorseManagerModel;
    disFlag: boolean;
    user: any;
    userId: string;
    noteFlag: boolean;
    addInforFlag: boolean;
    addManagerNoteFlag: boolean;
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _fuseConfigService: FuseConfigService,
        private _horseProviderService: HorseProviderService,
        private _providerService: UserProviderServicesService,
        private _appService: AppService,
    )
    {
        this._unsubscribeAll = new Subject();
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void{
        this._horseProviderService.onSetCurrentProviderHorse
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {
                this.providerHorse = horses.horses;  
                if (horses && horses != false){
                    if (this.providerHorse.privateNote == '' || this.providerHorse.privateNote == null){this.noteFlag = false; } else {this.noteFlag = true; }
                    this.disFlag = true;               
                    if (!this.providerHorse.height && !this.providerHorse.color  && !this.providerHorse.sire && !this.providerHorse.dam && this.providerHorse.registrations.length == 0){
                        this.addInforFlag = true; } else{   
                        this.addInforFlag = false; }
                    if (this.providerHorse.description){
                        this.addManagerNoteFlag = true; }else{
                        this.addManagerNoteFlag = false; }
                }
                else{
                    this.disFlag = false;   
                }
            });
        this._horseProviderService.onNewNotes
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(notes => {
                if (this.providerHorse){
                    this.providerHorse.privateNote = notes;  
                    this.noteFlag = true;
                }
            });

        this._horseProviderService.onManagerFlag
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(manager => {
                this.disFlag = manager.flag;
                this.providerManager = manager.data;    
        });       
    }

    AddNote(): void{
        this._horseProviderService.onchangeNotes.next(this.providerHorse);
        this._fuseSidebarService.getSidebar('horse-provider-private-panel').toggleOpen();
    }
    
    CreateInvoice(): void{
        this._horseProviderService.onGetProviderHorse.next(this.providerHorse);
        this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
    }
}
