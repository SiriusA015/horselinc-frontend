import { Component, HostBinding, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HLHorseModel } from 'app/model/horses';

@Component({
    selector     : 'horse-manager-list-item',
    templateUrl  : './horse-manager-list-item.component.html',
    styleUrls    : ['./horse-manager-list-item.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HorseManagerListItemComponent implements OnInit, OnDestroy
{
    @Input() horse: HLHorseModel;
  

    @HostBinding('class.selected')
    selected: boolean;


    // Private
    private _unsubscribeAll: Subject<any>;

   
    constructor(
        private _horseManagerService: HorseManagerService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

   
    ngOnInit(): void
    {


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

  

  
}
