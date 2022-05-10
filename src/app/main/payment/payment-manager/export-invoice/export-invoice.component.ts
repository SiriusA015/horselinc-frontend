import { Component, OnInit } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HLServiceProviderModel } from 'app/model/users';
import { HLInvoiceStatus} from 'app/model/enumerations';
import { PaymentManagerService } from '../payment-manager.service';
import { HLHorseModel } from 'app/model/horses';
import { AppService } from 'app/service/app.service';

@Component({
  selector: 'payment-manager-export-invoice',
  templateUrl: './export-invoice.component.html',
  styleUrls: ['./export-invoice.component.scss']
})
export class PaymentManagerExportInvoiceComponent implements OnInit {
   
    serviceProviders: HLServiceProviderModel[];
    currentProvider: HLServiceProviderModel;
    horses: HLHorseModel[];
    serviceType: string;
    startDate: any;
    endDate: any;
    isLogging = false;

    // Private
    private _unsubscribeAll: Subject<any>;

  constructor(
    private _fuseSidebarService: FuseSidebarService,
    private _paymentManagerService: PaymentManagerService,
    private _appService: AppService
  ) {
    this.serviceProviders = [];
    this.horses = [];
    this.serviceType = '0';
    this._unsubscribeAll = new Subject();
  }
  
  ngOnInit(): void {
      this._paymentManagerService.onSearchServiceProvider
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(provider => {
          if (provider && provider != false) {
               this.currentProvider = provider;
               this.serviceProviders.push(provider);
          }
      });

      this._paymentManagerService.onSearchHorse
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(horse => {
          if (horse && horse != false) {
              this.horses.push(horse);
          }
      });

      this._paymentManagerService.onExportPaymentHistoryInit
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
    const horseIds = [];
    const providerIds = [];
    let data: any = {};

    if (this.serviceType == '0'){
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
    this.serviceProviders.forEach(provider => {
        providerIds.push(provider.userId);
    });
    data = {
        startDate: new Date(this.startDate).getTime(),
        endDate: new Date(this.endDate).getTime(),
        status: status,
        horseIds: horseIds ? horseIds : [],
        serviceProviderIds: providerIds ? providerIds : []
    };

    this.isLogging = true;
    this._paymentManagerService.exportInvoicePayment(data)
    .then((res) => {
        this._appService.showSnackBar(res.result.message , 'OK');
        this.isLogging = false;
        this._fuseSidebarService.getSidebar('payment-manager-export-invoice').close();
    })
    .catch((err) => {
        this._appService.showSnackBar(err.error.error.message, 'OK');
        this.isLogging = false;
        this._fuseSidebarService.getSidebar('payment-manager-export-invoice').close();
    });
  }
  
  searchProvider(filter: string): void {
      this._paymentManagerService.setSearchType(filter);
      this._fuseSidebarService.getSidebar('payment-manager-searchprovider').open();
      this.closePanel();
  }

  closePanel(): void {
      this._fuseSidebarService.getSidebar('payment-manager-export-invoice').close();
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
