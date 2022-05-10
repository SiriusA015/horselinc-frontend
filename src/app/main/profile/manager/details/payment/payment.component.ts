import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { MatSnackBar, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import { UserPaymentCardComponent } from 'app/main/@shared/payment-card/payment-card.component';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

import { HLUserModel } from 'app/model/users';

import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';

import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
  selector: 'apps-profile-manager-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  animations   : fuseAnimations,
})
export class ProfileManagerPaymentComponent implements OnInit {
    user: HLUserModel;

    paymentApprovers: [];
    paymentApproversData: FilesDataSource | null;
    paymentApproversDataColumns = ['avatar', 'name-amount', 'edit-buttons', 'delete-buttons'];
    paymentApproversLoading = true;

    // Private
    private _unsubscribeAll: Subject<any>;

  constructor(
    private _matDialog: MatDialog, 
    private _fuseSidebarService: FuseSidebarService,
    private _fuseConfigService: FuseConfigService,
    private _userAuthService: UserAuthService,
    private _horseManagerService: UserHorseManagerService,
    private _managerProvidersService: UserManagerProvidersService,
    private _paymentApproversService: UserPaymentApproversService,
    private _profileManagerService: ProfileManagerService
    ) 
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void{
        // Subscribe to update providerServices on changes
        this.paymentApprovers = [];
        this.paymentApproversData = new FilesDataSource(this._paymentApproversService);
        this._paymentApproversService.onPaymentApproversChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(paymentApprovers => {                
                this.paymentApprovers = paymentApprovers;
                if (paymentApprovers !== false){
                    this.paymentApproversLoading = false;
                }
            });

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);
            }
        });
    }
    onAddPaymentCard(): void{

        const dialogRef = this._matDialog.open(UserPaymentCardComponent, {
            panelClass: 'user-payment-card',
            data: {data: this.user
            } 
        });

        dialogRef.afterClosed().subscribe(() => {
            this._userAuthService.loadUser();
        });
    }
    onDeletePaymentCard(item: any): void{
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
                this._horseManagerService.deletePaymentCard(this.user.horseManager.customer.id, item.id, this.user.horseManager.userId)
                .then(() => {
                    this._userAuthService.loadUser();
                });
            }
            else
            {
            }
        });
    }
    onChangeDefaultCard(item: any): void{
        this._horseManagerService.changeDefaultCard(this.user.horseManager.customer.id, item.id, this.user.horseManager.userId)
        .then(() => {
            this._userAuthService.loadUser();
        });
    }

    /**
     * Edit ProviderService
     *
     * @param providerService
     */
    editPaymentApprover(paymentApprover): void
    {
        this._profileManagerService.setCurrentApprover('Edit', paymentApprover);
        this._fuseSidebarService.getSidebar('profile-manager-addapprover').open();

    }
    deletePaymentApprover(paymentApprover): void
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
                this._paymentApproversService.deletePaymentApprover(paymentApprover);
            }
            else
            {
            }
        });
    }
    addPaymentApprover(): void{
        this._profileManagerService.setCurrentApprover('Add');
        this._fuseSidebarService.getSidebar('profile-manager-addapprover').open();
    }
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {UserProviderServicesService} _paymentApproversService
     */
    constructor(
        private _paymentApproversService: UserPaymentApproversService
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
        return this._paymentApproversService.onPaymentApproversChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
