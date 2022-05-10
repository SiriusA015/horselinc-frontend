import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { Subject } from 'rxjs';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { takeUntil } from 'rxjs/operators';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { fuseAnimations } from '@fuse/animations';
import { ScheduleService } from '../../schedule.service';

@Component({
  selector: 'hoprovider-service',
  templateUrl: './provider-service.component.html',
  styleUrls: ['./provider-service.component.scss']
})

export class ProviderServiceComponent implements OnInit, OnDestroy
{
    checkboxes: {};
    private _unsubscribeAll: Subject<any>;
    constructor(
        private _horseManagerService: HorseManagerService,
        public dialogRef: MatDialogRef<ProviderServiceComponent>,
        @Inject(MAT_DIALOG_DATA)
        public providerServices: HLServiceProviderServiceModel[]
    ){       
        this._unsubscribeAll = new Subject();   
    }
    ngOnInit(): void{
        this.checkboxes = {};
        this.providerServices.map(providerService => {
            this.checkboxes[providerService.uid] = false;
        });
    }
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
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
