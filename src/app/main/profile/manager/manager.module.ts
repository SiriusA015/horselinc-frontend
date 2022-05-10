import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS, MatSnackBarModule, MatTableModule, MatProgressBarModule, MatCheckboxModule, MatRippleModule,
    MatMenuModule, MatSelectModule, MatToolbarModule, MatSidenavModule, MatListModule,  MatRadioModule, MatGridListModule, MatDatepickerModule, MatNativeDateModule, MatCardModule,
    MatDividerModule, MatSlideToggleModule, MatAutocompleteModule, MatOptionModule
  } from '@angular/material';

import { ReactiveFormsModule } from '@angular/forms';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { FuseConfirmDialogModule } from '@fuse/components';
import { SharedModule } from 'app/main/@shared/shared.module';
import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

import { ProfileManagerComponent } from 'app/main/profile/manager/manager.component';
import { ProfileManagerListComponent } from 'app/main/profile/manager/list/list.component';
import { ProfileManagerDetailsComponent } from 'app/main/profile/manager/details/details.component';
import { ProfileManagerProviderComponent } from 'app/main/profile/manager/details/provider/provider.component';
import { ProfileManagerPaymentComponent } from 'app/main/profile/manager/details/payment/payment.component';
import { ProfileManagerEditProfileComponent } from 'app/main/profile/manager/dialogs/edit-profile/edit-profile.component';
import { ProfileManagerUpdateEmailComponent } from 'app/main/profile/manager/dialogs/update-email/update-email.component';
import { ProfileManagerUpdatePasswordComponent } from 'app/main/profile/manager/dialogs/update-password/update-password.component';
import { ProfileManagerAddProviderComponent } from 'app/main/profile/manager/dialogs/add-provider/addprovider.component';
import { ProfileManagerSearchProviderComponent } from 'app/main/profile/manager/dialogs/search-provider/search-provider.component';
import { ProfileManagerAddApproverComponent } from 'app/main/profile/manager/dialogs/add-approver/add-approver.component';

import { UserAuthGuard } from 'app/service/user-auth.guard';

// export const options: Partial<IConfig> | (() => Partial<IConfig>);

const routes: Routes = [
    {
        path  : '',
        component: ProfileManagerComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: ProfileManagerService
        }
    },
    {
        path      : '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];

@NgModule({
    declarations   : [
        ProfileManagerComponent,
        ProfileManagerListComponent,
        ProfileManagerDetailsComponent,
        ProfileManagerProviderComponent,
        ProfileManagerPaymentComponent,
        ProfileManagerEditProfileComponent,
        ProfileManagerUpdateEmailComponent,
        ProfileManagerUpdatePasswordComponent,
        ProfileManagerAddProviderComponent,
        ProfileManagerSearchProviderComponent,
        ProfileManagerAddApproverComponent,
    ],
    imports        : [
        RouterModule.forChild(routes),

        MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
        MatDialogModule, MatSnackBarModule, MatTableModule, MatProgressBarModule, MatCheckboxModule, MatRippleModule,
        MatMenuModule, MatSelectModule, MatToolbarModule, MatSidenavModule, MatListModule,  MatRadioModule, MatGridListModule, 
        MatDatepickerModule, MatNativeDateModule, MatCardModule,
        MatDividerModule, MatSlideToggleModule, MatAutocompleteModule, MatOptionModule,

        ReactiveFormsModule,
        FuseSharedModule,
        FuseSidebarModule,
        FuseConfirmDialogModule,
        CommonModule,
        SharedModule
      
    ],
    providers      : [
         ProfileManagerService
    ]
   
})

export class ProfileManagerModule
{
}
