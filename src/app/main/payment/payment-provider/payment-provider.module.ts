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
import { MatTabsModule } from '@angular/material/tabs';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import {MatDividerModule} from '@angular/material/divider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentProviderService } from 'app/main/payment/payment-provider/payment-provider.service';
import { PaymentProviderComponent } from './payment-provider.component';
import { PaymentProviderListComponent } from './payment-provider-list/payment-provider-list.component';
import { PaymentProviderDetailsComponent } from './payment-provider-details/payment-provider-details.component';
import { PaymentProviderListItemComponent } from './payment-provider-list/payment-provider-list-item/payment-provider-list-item.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import {CreateDialogComponent} from './provider-dialogs/create-dialog/create-dialog.component';
import {EditDialogComponent} from './provider-dialogs/edit-dialog/edit-dialog.component';
import { ServicesModalComponent } from './provider-dialogs/services-modal/services-modal.component';
import { AddNewServiceComponent } from './provider-dialogs/add-new-service/add-new-service.component';
import { PaymentProviderExportInvoiceComponent } from './provider-dialogs/export-invoice/export-invoice.component';
import { PaymentProviderSearchManagerComponent } from './provider-dialogs/search-manager-horse/search-manager-horse.component';
import { InvoiceConfirmComponent } from './provider-dialogs/invoice-confirm/invoice-confirm.component';
import { InvoiceHorseProfileComponent } from './provider-dialogs/invoice-horse-profile/invoice-horse-profile.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserAuthGuard } from 'app/service/user-auth.guard';

import {
  MatDialogModule,
  MAT_DIALOG_DEFAULT_OPTIONS
} from '@angular/material';


const routes: Routes = [
    {
        path     : '',
        component: PaymentProviderComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: PaymentProviderService
        }
    },
    {
        path     : '/:providerId',
        component: PaymentProviderComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: PaymentProviderService
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
    MatCheckboxModule,
    MatDatepickerModule,
    MatMenuModule,
    MatRippleModule,
    MatSelectModule,
    MatDialogModule,
    NgxDnDModule,
    MatDividerModule,
    FormsModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    InfiniteScrollModule,
    FuseSharedModule,
    FuseSidebarModule,
    MatTabsModule,
    MatProgressSpinnerModule
    
  ],
  declarations: [
      PaymentProviderComponent,
      PaymentProviderListComponent,
      PaymentProviderDetailsComponent,
      PaymentProviderListItemComponent,
      CreateDialogComponent,
      EditDialogComponent,
      // ConfirmDlgComponent,
      ServicesModalComponent,
      AddNewServiceComponent,
      PaymentProviderExportInvoiceComponent,
      PaymentProviderSearchManagerComponent,
      InvoiceConfirmComponent,
      InvoiceHorseProfileComponent,
  ],
  exports     : [
    // ConfirmDlgComponent,
    ServicesModalComponent
  ],
  entryComponents : [
    // ConfirmDlgComponent,
    ServicesModalComponent
  ],
  providers   : [
    PaymentProviderService
  ]
})

export class PaymentProviderModule { }
