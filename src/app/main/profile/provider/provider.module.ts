import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS, MatSnackBarModule, MatTableModule, MatProgressBarModule, MatCheckboxModule, MatRippleModule,
    MatMenuModule, MatSelectModule, MatToolbarModule, MatSidenavModule, MatListModule,  MatRadioModule, MatGridListModule, MatDatepickerModule, MatNativeDateModule, MatCardModule,
    MatDividerModule, MatSlideToggleModule
  } from '@angular/material';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { FuseConfirmDialogModule } from '@fuse/components';
import { SharedModule } from 'app/main/@shared/shared.module';

import { ProfileProviderService } from 'app/main/profile/provider/provider.service';

import { ProfileProviderComponent } from 'app/main/profile/provider/provider.component';
import { ProfileProviderListComponent } from 'app/main/profile/provider/list/list.component';
import { ProfileProviderDetailsComponent } from 'app/main/profile/provider/details/details.component';
import { ProfileProviderRateListComponent } from 'app/main/profile/provider/details/ratelist/ratelist.component';
import { ProfileProviderEditProfileComponent } from 'app/main/profile/provider/dialogs/edit-profile/edit-profile.component';
import { ProfileProviderAddServiceComponent } from 'app/main/profile/provider/dialogs/add-service/add-service.component';
import { ProfileProviderUpdateEmailComponent } from 'app/main/profile/provider/dialogs/update-email/update-email.component';
import { ProfileProviderUpdatePasswordComponent } from 'app/main/profile/provider/dialogs/update-password/update-password.component';
import { ProfileProviderInstantPayoutComponent } from 'app/main/profile/provider/dialogs/instant-payout/instant-payout.component';

import { UserAuthGuard } from 'app/service/user-auth.guard';


const routes: Routes = [
    {
        path  : '',
        component: ProfileProviderComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            provider: ProfileProviderService
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
        ProfileProviderComponent,
        ProfileProviderListComponent,
        ProfileProviderDetailsComponent,
        ProfileProviderRateListComponent,
        ProfileProviderEditProfileComponent,
        ProfileProviderAddServiceComponent,
        ProfileProviderUpdateEmailComponent,
        ProfileProviderUpdatePasswordComponent,
        ProfileProviderInstantPayoutComponent
    ],
    imports        : [
        RouterModule.forChild(routes),

        MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
        MatDialogModule, MatSnackBarModule, MatTableModule, MatProgressBarModule, MatCheckboxModule, MatRippleModule,
        MatMenuModule, MatSelectModule, MatToolbarModule, MatSidenavModule, MatListModule,  MatRadioModule, MatGridListModule, 
        MatDatepickerModule, MatNativeDateModule, MatCardModule,
        MatDividerModule, MatSlideToggleModule,

        FuseSharedModule,
        FuseSidebarModule,
        FuseConfirmDialogModule,
        CommonModule,
        SharedModule
      
    ],
    providers      : [
         ProfileProviderService
    ]
   
})

export class ProfileProviderModule
{
}
