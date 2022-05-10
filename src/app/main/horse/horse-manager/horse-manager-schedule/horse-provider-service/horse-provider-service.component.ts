import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { HLServiceProviderServiceModel } from 'app/model/users';

@Component({
  selector: 'horse-provider-service',
  templateUrl: './horse-provider-service.component.html',
  styleUrls: ['./horse-provider-service.component.scss']
})

export class HorseProviderServiceComponent implements OnInit, OnDestroy
{ 
    private _unsubscribeAll: Subject<any>;
    checkboxes: {};

    constructor(
        public dialogRef: MatDialogRef<HorseProviderServiceComponent>,
        @Inject(MAT_DIALOG_DATA) 
        public providerServices: HLServiceProviderServiceModel[]
    )
    {    
        this._unsubscribeAll = new Subject();   
    }

    ngOnInit(): void
    {
        this.checkboxes = {};
        this.providerServices.map(providerService => {
            this.checkboxes[providerService.uid] = false;
        });
   }
   ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    checkedProviderService(event: any): void{
            // console.log(event);
    }

    onCloseClick(): void {
        this.providerServices.map(providerService => {
            this.checkboxes[providerService.uid] = false;
        });

        this.dialogRef.close(this.checkboxes);
    }

    onDoneClick(): void {
        this.dialogRef.close(this.checkboxes);
    }
}
