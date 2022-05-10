import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { Subject } from 'rxjs';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { takeUntil } from 'rxjs/operators';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { fuseAnimations } from '@fuse/animations';
import { HLHorseModel} from 'app/model/horses';
import { HLHorseManagerModel } from 'app/model/users';
@Component({
  selector: 'horse-filter',
  templateUrl: './horse-filter.component.html',
  styleUrls: ['./horse-filter.component.scss']
})

export class HorseFilterComponent implements OnInit, OnDestroy
{
          
    horses: HLHorseModel[] = [];
    tempOwner: HLHorseManagerModel[] = [];
    tempTrainer: HLHorseManagerModel[] = [];
    selectOwner: any;
    title: string;
    statue: string;
    isLogging: boolean;
    private _unsubscribeAll: Subject<any>;

  constructor(
      private _horseManagerService: HorseManagerService,
      public dialogRef: MatDialogRef<HorseFilterComponent>,
      @Inject(MAT_DIALOG_DATA) 
      public data: any    
    )
    {     
        this._unsubscribeAll = new Subject();   
    }

    ngOnInit(): void
    {

        this.statue = this.data.statue;
        //this.horses = this.data.horses;
        if (this.statue == 'owner'){ this.onSearchOwner(); this.title = 'Select Owner'; }
        if (this.statue == 'trainer'){ this.onSearchTrainer(); this.title = 'Select Trainer'; }
     
   }
    onSearchTrainer(): void{
        this.isLogging = true;
        this.tempOwner = [];
        this._horseManagerService.getFilterHorseForManager('trainer').then(trainers => {
            this.tempOwner = trainers;
            this.isLogging = false;
        });
        // console.log('this is this tempowner', this.tempOwner);
    }
    onSearchOwner(): void{
        this.isLogging = true;
        this.tempOwner = [];
        this._horseManagerService.getFilterHorseForManager('owner').then(owners => {
            this.tempOwner = owners;
            this.isLogging = false;
        });
        
        // console.log('this is this tempowner', this.tempOwner);
    }
   ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
       
    }
    onCloseClick(): void {

        this.dialogRef.close('');
    }
   
    
    onDoneClick(): void {
        let owner: HLHorseManagerModel;
        if ( this.selectOwner == 'none' ){
             owner = new HLHorseManagerModel({}); }
        else{
            owner = new HLHorseManagerModel(this.selectOwner);
        }
        this.dialogRef.close(owner);   
    }
}
