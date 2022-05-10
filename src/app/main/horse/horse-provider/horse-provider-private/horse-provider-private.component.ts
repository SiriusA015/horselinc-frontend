import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HLHorseModel } from 'app/model/horses';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { AppService } from 'app/service/app.service';
import { COLLECTION_HORSES } from 'app/model/constants';

@Component({
    selector   : 'horse-provider-private',
    templateUrl: './horse-provider-private.component.html',
    styleUrls  : ['./horse-provider-private.component.scss']
})
export class HorseProviderPrivateComponent implements OnInit, OnDestroy
{
    addPrivate: string;
    providerHorse: HLHorseModel;
    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     */
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _horseProviderService: HorseProviderService,
        private _providerService: UserProviderServicesService,
        private _appService: AppService,
        private db: AngularFirestore,
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
        
        this._horseProviderService.onchangeNotes
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {

                    this.providerHorse = horses;  
                    this.addPrivate = this.providerHorse.privateNote;  
                    
            });
    }

    CancelPrivate(): void{
        this._fuseSidebarService.getSidebar('horse-provider-private-panel').toggleOpen();
    }

    SavePrivate(): void{
        const docRef = this.db.collection(COLLECTION_HORSES).doc(this.providerHorse.uid);
        docRef.update({
            privateNote: this.addPrivate,
        }).then(() => {
            this._horseProviderService.onNewNotes.next(this.addPrivate);
        });
        this._fuseSidebarService.getSidebar('horse-provider-private-panel').toggleOpen();
    }
}
