import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { NgxDnDModule } from '@swimlane/ngx-dnd';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { PaymentManagerComponent } from './payment-manager.component';
import { PaymentManagerService } from 'app/main/payment/payment-manager/payment-manager.service';
import { PaymentManagerDetailsComponent } from './payment-manager-details/payment-manager-details.component';
import { PaymentManagerListComponent } from 'app/main/payment/payment-manager/payment-manager-list/payment-manager-list.component';
import { PaymentManagerListItemComponent } from './payment-manager-list/payment-manager-list-item/payment-manager-list-item.component';
import { PaymentManagerExportInvoiceComponent } from './export-invoice/export-invoice.component';
import { PaymentManagerSearchProviderComponent } from './search-provider/search-provider.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardsModalComponent } from './cards-modal/cards-modal.component';
import { UserAuthGuard } from 'app/service/user-auth.guard';

import {
  MatDialogModule,
  MAT_DIALOG_DEFAULT_OPTIONS
} from '@angular/material';

const routes: Routes = [
    {
        path     : '',
        component: PaymentManagerComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            manager: PaymentManagerService
        }
    },
    {
        path     : '/:invoiceId',
        component: PaymentManagerComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: PaymentManagerService
        }
    },
    {
      path     : '/:invoiceId/:deeplink',
      component: PaymentManagerComponent,
      canActivate: [UserAuthGuard],
      resolve  : {
          provider: PaymentManagerService
      }
  },
  {
        path      : '**',
        redirectTo: '',
        pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),

    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatRippleModule,
    MatSelectModule,
    MatDividerModule,
    MatRadioModule,
    NgxDnDModule,
    InfiniteScrollModule,
    FuseSharedModule,
    FuseSidebarModule,
    MatTabsModule,
    MatProgressSpinnerModule
    
  ],
  declarations: [
      PaymentManagerComponent,
      PaymentManagerDetailsComponent,
      PaymentManagerListComponent,
      PaymentManagerListItemComponent,
      PaymentManagerExportInvoiceComponent,
      PaymentManagerSearchProviderComponent,
      CardsModalComponent,
  ],
  exports     : [
    CardsModalComponent
  ],
  entryComponents : [
    CardsModalComponent
  ],
  providers   : [
    PaymentManagerService
  ]
})

export class PaymentManagerModule { }
