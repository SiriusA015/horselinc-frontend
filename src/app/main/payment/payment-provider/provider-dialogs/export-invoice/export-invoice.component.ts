import { Component, OnInit } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel} from 'app/model/users';
import { HLInvoiceStatus} from 'app/model/enumerations';
import { PaymentProviderService } from '../../payment-provider.service';;
import { HLHorseModel } from 'app/model/horses';
import { MatDialog } from '@angular/material';
import { AppService } from 'app/service/app.service';

@Component({
  selector: 'payment-provider-export-invoice',
  templateUrl: './export-invoice.component.html',
  styleUrls: ['./export-invoice.component.scss']
})
export class PaymentProviderExportInvoiceComponent implements OnInit {
   
    serviceProviders: HLServiceProviderModel[];
    currentProvider: HLServiceProviderModel;
    horses: HLHorseModel[];
    serviceType: string;
    startDate: any;
    endDate: any;

    // Private
    private _unsubscribeAll: Subject<any>;

  constructor(
    private _fuseSidebarService: FuseSidebarService,
    private _paymentProviderService: PaymentProviderService,
    // private _matSnackBar: MatSnackBar,
    private _matDialog: MatDialog,
    private _appService: AppService
  ) {
    this.serviceProviders = [];
    this.horses = [];
    this.serviceType = '0';
    this._unsubscribeAll = new Subject();
  }
  
  ngOnInit(): void {
      this._paymentProviderService.onSearchServiceProvider
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(provider => {
          if (provider && provider != false) {
             this.currentProvider = provider;
             this.serviceProviders.push(provider);
          }
      });

      this._paymentProviderService.onSearchHorse
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(horse => {
          if (horse && horse != false) {
              this.horses.push(horse);
          }
      });

      this._paymentProviderService.onExportPaymentHistoryInit
     .pipe(takeUntil(this._unsubscribeAll))
     .subscribe(flag => {
        if (flag) {
            this.onInit();
        }
     });
  }

  onInit(): void{
    this.serviceProviders = [];
    this.currentProvider = null;
    this.horses = [];
    this.serviceType = '0';
    this.startDate = null;
    this.endDate = null;
  }

  exportInvoicePayment(): void{

    let status: any;
    let horseIds: any;
    horseIds = [];
    let horseManagerIds: any;
    horseManagerIds = [];
    let data: any = {};
    
    if (this.serviceType == '0') {
        status = null;
    }
    else if (this.serviceType == '1'){
        status = HLInvoiceStatus.submitted;
    } else {
        status = HLInvoiceStatus.fullPaid;
    }
    
    this.horses.forEach(horse => {
        horseIds.push(horse.uid);
    });
    this.serviceProviders.forEach(manager => {
        horseManagerIds.push(manager.userId);
    });
    data = {
        startDate: new Date(this.startDate).getTime(),
        endDate: new Date(this.endDate).getTime(),
        status: status,
        horseIds: horseIds,
        horseManagerIds: horseManagerIds
    };

    this._paymentProviderService.exportInvoicePayment(data)
    .then((res) => {
        // Show the success message
        this._appService.showSnackBar(res.result.message , 'OK');
        this._fuseSidebarService.getSidebar('payment-provider-export-invoice').close();
    })
    .catch((err) => {
        // Show the success message
        this._appService.showSnackBar(err.error.error.message, 'OK');
        this._fuseSidebarService.getSidebar('payment-provider-export-invoice').close();
    });
  }
  
  searchManager(filter: string): void {
      this._paymentProviderService.setSearchType(filter);
      this._fuseSidebarService.getSidebar('payment-provider-searchmanager').open();
      this.closePanel();
  }

  closePanel(): void {
      this._fuseSidebarService.getSidebar('payment-provider-export-invoice').close();
  }

  delete(provider): void{
      if (this.serviceProviders.length > 0){
          
          const idx = this.serviceProviders.indexOf(provider);
          this.serviceProviders.splice(idx, 1);
      }
  }

  deleteHorse(horse): void{
      if (this.horses.length > 0){
          const idx = this.horses.indexOf(horse);
          this.horses.splice(idx, 1);
      }
  }
}
