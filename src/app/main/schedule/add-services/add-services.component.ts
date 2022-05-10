import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { ServicesModalComponent } from './services-modal/services-modal.component'
import { ScheduleService } from '../schedule.service';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { AppService } from 'app/service/app.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
  selector: 'add-services',
  templateUrl: './add-services.component.html',
  styleUrls: ['./add-services.component.scss']
})
export class AddServicesComponent implements OnInit, OnDestroy {

  providerServices: HLServiceProviderServiceModel[];
  request: HLServiceRequestModel;
  providerServiceDataLoading = true;
  userId: string;
  serviceTrue: HLServiceProviderServiceModel[] = [];
  serviceFalse: HLServiceProviderServiceModel[] = [];
  seletableServices: HLServiceProviderServiceModel[] = [];
  private _unsubscribeAll: Subject<any>;

  constructor(
    private db: AngularFirestore,
    private _matDialog: MatDialog, 
    private _scheduleService: ScheduleService,
    private _fuseSidebarService: FuseSidebarService,
    private _appService: AppService
  ) { 
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this._scheduleService.onRequestChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(request => {
          if (request != false){
            this.serviceTrue = [];
            this.serviceFalse = [];
            this.request = request;
            request.services.map((item) => {
                this.serviceTrue.push(new HLServiceProviderServiceModel(item.uid, item));
            });
            this.getServiceProviderService();
          }
      });
  }

  getServiceProviderService(): void{
      this.providerServices = [];
      this.userId = this._appService.getCurUser().uid;
      this._scheduleService.getServiceProviderService(this.userId)
      .then((res) => {
          if (res.length > 0){
              res.forEach((itme) => {
                  this.providerServices.push(itme);
              });
              this.providerServices.map((item) => {
                  if (!this.serviceTrue.find((x) => x.uid == item.uid)) {
                      this.serviceFalse.push(item);
                  }
              });
          }
      });
 }

  openServiceListModal(): void {
        if (!this.serviceFalse || this.serviceFalse.length<1) {
            this._appService.showSnackBar('You have selected all services', 'OK');
            return;
        }

        const dialogRef = this._matDialog.open(ServicesModalComponent, {
            disableClose: true,
            panelClass: 'services-modal',
            data: this.serviceFalse
        });
      
        dialogRef.afterClosed().subscribe(result => {
          if (!result) {return; }
          this.serviceFalse = [];
          this.serviceTrue = [];
          this.providerServices.map(providerService => {
              if (result[providerService.uid] == false){
                this.serviceFalse.push(providerService);
              }
              else{
                providerService.quantity = 1;
                this.serviceTrue.push(providerService);
              }
          });
        });
  }

  deleteService(service: HLServiceProviderServiceModel): void {
      this.serviceFalse.push(service);
      const idx = this.serviceTrue.indexOf(service);
      this.serviceTrue.splice(idx, 1);
  }

  onSave(): void {
    if (this.serviceTrue.length < 1){
        this._appService.showSnackBar('No Services!', 'OK');
        return;
    }
    let updatedServices: any[];
    updatedServices = [];
    let updatedService: any;
    this.serviceTrue.forEach(item => {
        updatedService = {
            quantity: item.quantity,
            rate: item.rate,
            service: item.service,
            uid: item.uid,
            userId: item.userId
        };
        updatedServices.push(updatedService);
    });

    this._scheduleService.udpateRequestBy(this.request.uid, {services: updatedServices})
    .then(() => {
        this.request.services = this.serviceTrue;
        this._fuseSidebarService.getSidebar('schedule-addServices-panel').toggleOpen();
    });
  }

  onCancel(): void {
      this._fuseSidebarService.getSidebar('schedule-addServices-panel').toggleOpen();
  }

  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }
}
