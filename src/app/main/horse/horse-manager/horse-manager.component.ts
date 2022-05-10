import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';

import { HorseManager } from 'app/main/horse/horse-manager/horse-manager.model';
import { HorseManagerService } from 'app/service/horse-manager.service';

import { HLHorseModel } from 'app/model/horses';
import { FuseConfigService } from '@fuse/services/config.service';

@Component({
    selector     : 'horse-manager',
    templateUrl  : './horse-manager.component.html',
    styleUrls    : ['./horse-manager.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HorseManagerComponent implements OnInit, OnDestroy
{
    searchInput: FormControl;
    horses: HLHorseModel;
    currentHorseManager: HorseManager;
    hasSelectedHorseManagers: boolean;
    isIndeterminate: boolean;
    currentHorseFlag: boolean;
    disFlag: boolean;

    private _unsubscribeAll: Subject<any>;
    /**
     * Constructor
     *
     * @param {HorseManagerService} _horseManagerService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     */
    constructor(
        private _horseManagerService: HorseManagerService,
        private _fuseSidebarService: FuseSidebarService,
        private _fuseTranslationLoaderService: FuseTranslationLoaderService,
        private _fuseConfigService: FuseConfigService,
    )      
    {
        this.searchInput = new FormControl('');
        this.currentHorseFlag = false;
        this._unsubscribeAll = new Subject();

        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: false
                },
                toolbar  : {
                    hidden: false
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

    ngOnInit(): void
    {
        this._horseManagerService.onCurrentHorseChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentHorseManager => {
                if ( currentHorseManager )
                {
                    this.currentHorseManager = currentHorseManager;
                }
        });

        this._horseManagerService.onHorsesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {
                this.horses = horses; 
                if (horses.length > 0){
                    this.disFlag = true;
                }
                else{
                    this.disFlag = false;
                }
        });
    
        this._horseManagerService.onCurrentHorseFlagChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentHorseFlag => {
                this.currentHorseFlag = currentHorseFlag;
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

    gotoList(): void
    {
        this._horseManagerService.onCurrentHorseFlagChanged.next(false);
    }
    
}
