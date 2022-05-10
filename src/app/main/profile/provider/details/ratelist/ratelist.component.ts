import { Component, OnDestroy, OnInit, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk/collections';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';
import { ProfileProviderService } from 'app/main/profile/provider/provider.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

import { UserServiceEditComponent } from 'app/main/@shared/sevice-edit/service-edit.component';

@Component({
  selector: 'apps-profile-provider-ratelist',
  templateUrl: './ratelist.component.html',
  styleUrls: ['./ratelist.component.scss']
})
export class ProfileProviderRateListComponent implements OnInit {
    user: HLUserModel;

    providerServices: any;
    providerServiceData: FilesDataSource | null;
    providerServiceDataColumns = ['service', 'rate', 'edit-buttons', 'delete-buttons'];
    providerServiceDataLoading = true;

    // Private
    private _unsubscribeAll: Subject<any>;

    
  constructor(
    private _formBuilder: FormBuilder,
    private _matDialog: MatDialog, 
    public sanitizer: DomSanitizer,
    private _fuseSidebarService: FuseSidebarService,
    private _fuseConfigService: FuseConfigService,
    private _appService: AppService,
    private _userAuthService: UserAuthService,
    private _serviceProviderService: UserServiceProviderService,
    private _providerServicesService: UserProviderServicesService,
    private _profileProviderService: ProfileProviderService,
    private _progressBarService: FuseProgressBarService,
  ) 
  {
    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this._userAuthService.onHLUserChanged
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe(user => {
    });

    // Subscribe to update providerServices on changes
    this.providerServices = [];
    this.providerServiceData = new FilesDataSource(this._providerServicesService);
    this._providerServicesService.onProviderServicesChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(providerServices => {                
            this.providerServices = providerServices;
            if (providerServices !== false){
                this.providerServiceDataLoading = false;
            }
        });
  }

    /**
     * Edit ProviderService
     *
     * @param providerService
     */
    editProviderService(providerService): void
    {
        const dialogRef = this._matDialog.open(UserServiceEditComponent, {
            panelClass: 'user-service-edit',
            disableClose: true,
            data      : {
                providerService: providerService,
                action : 'edit'
            }
        });
        dialogRef.afterClosed()
            .subscribe(response => {                
                if ( !response )
                {
                    return;
                }
                const actionType: string = response[0];
                const formData: FormGroup = response[1];
                switch ( actionType )
                {
                    /**
                     * Save
                     */
                    case 'save':                                
                        this._providerServicesService.updateProviderService(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteProviderService(providerService);

                        break;
                }
            });
    }
    /**
     * Delete ProviderService
     */
    deleteProviderService(providerService): void
    {
        const event = {
            title: 'HorseLinc',
            msg: 'Are you sure you want to delete?',
            btn1Name: 'No',
            btn2Name: 'Yes'
        }
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action == event.btn2Name) {
                this._providerServicesService.deleteProviderService(providerService);
            }
            else
            {
            }
        });
    }

    /**
     * New ProviderService
     */
    newProviderService(): void
    {
        const dialogRef = this._matDialog.open(UserServiceEditComponent, {
            panelClass: 'user-service-edit',
            disableClose: true,
            data      : {
                action: 'new'
            }
        });

        dialogRef.afterClosed()
            .subscribe((form: FormGroup) => {
                if ( !form )
                {
                    return;
                }                
                this._providerServicesService.createProviderService(form.getRawValue());
            });
    }
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {UserProviderServicesService} _providerServicesService
     */
    constructor(
        private _providerServicesService: UserProviderServicesService
    )
    {
        super();
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        return this._providerServicesService.onProviderServicesChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
