import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { HLHorseModel } from 'app/model/horses';

@Component({
    selector     : 'horse-provider',
    templateUrl  : './horse-provider.component.html',
    styleUrls    : ['./horse-provider.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class HorseProviderComponent implements OnInit, OnDestroy
{
    
    // Private
    horses: HLHorseModel[];
    currentHorseFlag: boolean;
    disFlag: boolean;
    private _unsubscribeAll: Subject<any>;
    
    constructor(
        private _horseProviderService: HorseProviderService,
        private _fuseConfigService: FuseConfigService,

    )
    {
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
       
        this._horseProviderService.onProviderHorsesChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horses => {
    
            if (horses != false && horses != null){
                this.disFlag = true;
            }
            else{
                this.disFlag = false;
            }
        });

        this._horseProviderService.onCurrentHorseFlagChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentHorseFlag => {
            this.currentHorseFlag = currentHorseFlag;
        });
       
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    
    gotoList(): void{
        this._horseProviderService.setCurrentHorseFlag(false);
    }
  
}
