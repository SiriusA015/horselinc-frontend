import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { AppService } from 'app/service/app.service';
@Component({
  selector: 'horse-request-edit',
  templateUrl: './horse-request-edit.component.html',
  styleUrls: ['./horse-request-edit.component.scss']
})

export class HorseRequestEditComponent implements OnInit, OnDestroy
{
    flag: boolean;      
    private _unsubscribeAll: Subject<any>;

  constructor(
      private _horseManagerService: HorseManagerService,
      private _appService: AppService,   
      public dialogRef: MatDialogRef<HorseRequestEditComponent>,
      @Inject(MAT_DIALOG_DATA) 
      public statue: string
    )
    {    
        this._unsubscribeAll = new Subject();   
    }

    ngOnInit(): void
    {
        if ( this.statue == 'pending' || this.statue == 'declined') {
            this.flag = true;
        }
        else
        {
            this.flag = false;
        }
   }
   ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    checkedProviderService(event: any): void{
            // console.log(event);
    }
    
    onEdit(): void {
        this.dialogRef.close('edit');
    }

    onDelete(): void {
        this.dialogRef.close('delete');
    }
    onClose(): void{
        this.dialogRef.close();
    }
    
    


}
