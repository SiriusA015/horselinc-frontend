import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HLServiceProviderServiceModel } from 'app/model/users';

@Component({
  selector: 'services-modal',
  templateUrl: './services-modal.component.html',
  styleUrls: ['./services-modal.component.scss']
})

export class ServicesModalComponent implements OnInit {

  checkboxes:any = {};

  constructor(
      public _matDialogRef: MatDialogRef<ServicesModalComponent>,
      @Inject(MAT_DIALOG_DATA) public providerServices: HLServiceProviderServiceModel[]
  ) {
    
  }

  ngOnInit() {
      this.checkboxes = {};
      this.providerServices.map(providerService => {
          this.checkboxes[providerService.uid] = false;
      });
  }

  onClose(): void {
    this._matDialogRef.close();
  }
  onDone(): void {
      this._matDialogRef.close(this.checkboxes);
  }

}
