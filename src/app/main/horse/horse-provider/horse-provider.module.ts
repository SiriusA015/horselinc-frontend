import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatTreeModule} from '@angular/material/tree';
import {CdkTreeModule} from '@angular/cdk/tree';

import { NgxDnDModule } from '@swimlane/ngx-dnd';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { MatSidenavModule, MatListModule,  MatRadioModule, MatGridListModule, MatDatepickerModule, MatNativeDateModule, MatCardModule} from '@angular/material';
import { MatSelectModule } from '@angular/material/select';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { HorseProviderComponent } from './horse-provider.component';
import { HorseProviderListComponent } from './horse-provider-list/horse-provider-list.component';
import { HorseProviderDetailsComponent } from './horse-provider-details/horse-provider-details.component';
import { HorseProviderPrivateComponent} from './horse-provider-private/horse-provider-private.component';
import { HorseProviderInvoiceComponent } from './horse-provider-invoice/horse-provider-invoice.component';
import { HorseProviderConfirmComponent } from './horse-provider-confirm/horse-provider-confirm.component';
import { HorseProviderSearchComponent } from './horse-provider-search/horse-provider-search.component';
import { HorseServiceDialogComponent } from './horse-provider-invoice/horse-service-dialog/horse-service-dialog.component';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { InvoiceHorseProfileComponent } from 'app/main/horse/horse-provider/invoice-horse-profile/invoice-horse-profile.component'
import { UserAuthGuard } from 'app/service/user-auth.guard';

const routes: Routes = [
    {
        path     : '',
        component: HorseProviderComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: HorseProviderService
        }
    },
    {
        path     : '/:providerId',
        component: HorseProviderComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: HorseProviderService
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

    NgxDnDModule,
    FuseSharedModule,
    FuseSidebarModule,

    MatTreeModule,

    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRippleModule,   
    MatSidenavModule,
    MatListModule,  
    MatRadioModule, 
    MatGridListModule, 
    MatDatepickerModule, 
    MatNativeDateModule, 
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    CdkTreeModule,
    
  ],
  declarations: [
      HorseProviderComponent,
      HorseProviderListComponent,
      HorseProviderDetailsComponent,
      HorseProviderPrivateComponent,
      HorseProviderInvoiceComponent,
      HorseServiceDialogComponent,
      HorseProviderConfirmComponent,
      HorseProviderSearchComponent,
      InvoiceHorseProfileComponent,
  
  ],
  providers   : [
         //HorseProviderService
  ],
  entryComponents: [
        HorseServiceDialogComponent,
        InvoiceHorseProfileComponent,
],

})

export class HorseProviderModule { }
