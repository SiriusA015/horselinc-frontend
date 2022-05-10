import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { Subject } from 'rxjs';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { takeUntil } from 'rxjs/operators';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'horse-service-dialog',
  templateUrl: './horse-service-dialog.component.html',
  styleUrls: ['./horse-service-dialog.component.scss']
})

export class HorseServiceDialogComponent implements OnInit, OnDestroy
{   
    private _unsubscribeAll: Subject<any>;
    checkboxes: {};

  constructor(
      private _horseManagerService: HorseManagerService,
      public dialogRef: MatDialogRef<HorseServiceDialogComponent>,
      @Inject(MAT_DIALOG_DATA) 
      public providerServices: HLServiceProviderServiceModel[]   
    )
    {    
        this._unsubscribeAll = new Subject();   
    }

    ngOnInit(): void
    {

        this.checkboxes = {};
        if (this.providerServices && this.providerServices.length > 0){

            this.providerServices.map(providerService => {
                this.checkboxes[providerService.uid] = false;
            });
        }
    }
    ngOnDestroy(): void{
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
