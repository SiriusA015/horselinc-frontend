import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { NotificationCardComponent } from './notification-card/notification-card.component';
import { NotificationComponent } from './notification.component';
import { NotificationService } from 'app/main/notification/notification.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserAuthGuard } from 'app/service/user-auth.guard';
import { MatIconModule } from '@angular/material/icon';

import {
    MatDialogModule,
    MAT_DIALOG_DEFAULT_OPTIONS
} from '@angular/material'
  

const routes: Routes = [
    {
        path     : '',
        component: NotificationComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            notifications: NotificationService
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
        NotificationCardComponent,
        NotificationComponent,
        // ConfirmDlgComponent
    ],
    imports        : [
        RouterModule.forChild(routes),

        CommonModule,
        MatButtonModule,
        MatRippleModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        FuseSharedModule,
        FuseSidebarModule,
        MatIconModule
    ],
    exports     : [
        // ConfirmDlgComponent,
      ],
    entryComponents : [
        // ConfirmDlgComponent,
      ],
    providers: [
        NotificationService
    ]
   
})

export class NotificationModule
{
}

