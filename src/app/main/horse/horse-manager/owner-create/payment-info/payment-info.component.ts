import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { fuseAnimations } from '@fuse/animations';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { UserPhotoEditComponent, UserPhotoInput, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { UserPaymentCardComponent } from 'app/main/@shared/payment-card/payment-card.component';
import { HLUserModel } from 'app/model/users';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';

@Component({
  selector: 'horse-owner-payment-info',
  templateUrl: './payment-info.component.html',
  styleUrls: ['./payment-info.component.scss'],
  animations   : fuseAnimations,
})

export class HorseOwnerPaymentInfoComponent implements OnInit {
    infoForm: FormGroup;

    user: HLUserModel;
    paymentApprovers: [];
    paymentApproversData: FilesDataSource | null;
    paymentApproversDataColumns = ['avatar', 'name-amount', 'edit-buttons', 'delete-buttons'];
    paymentApproversLoading = true;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FormBuilder} _formBuilder
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _matDialog: MatDialog, 
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _managerProvidersService: UserManagerProvidersService,
        private _paymentApproversService: UserPaymentApproversService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.user = new HLUserModel('', {});

        // Configure the layout
        // this._fuseConfigService.config = {
        //     layout: {
        //         navbar   : {
        //             hidden: true
        //         },
        //         toolbar  : {
        //             hidden: true
        //         },
        //         footer   : {
        //             hidden: true
        //         },
        //         sidepanel: {
        //             hidden: true
        //         }
        //     }
        // };
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // console.log('payment-info-ngOnInit');
        this.user = this._horseManagerService.editingHorseOwner;

        this.infoForm = this._formBuilder.group({
            email   : ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });

        // Subscribe to update providerServices on changes
        this.paymentApprovers = [];
        this.paymentApproversData = new FilesDataSource(this._paymentApproversService);

        this._paymentApproversService.onPaymentApproversChanged1
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(paymentApprovers => {             
                // console.log('payment-info-payApprovers:', paymentApprovers);   
                this.paymentApprovers = paymentApprovers;
                if (paymentApprovers !== false){
                    this.paymentApproversLoading = false;
                }
            });

        // this._userAuthService.getUser("ea1ZRwc6BFfKoAjkAIo6OX2omDB3")
        // .then( (user)=> {
        //     if (user != false && user.uid){
        //         this.user = new HLUserModel(user.uid, user);
        //         this._horseManagerService.editingHorseOwner = this.user;
        //         console.log('payment-info-payuser1:', this.user);
        //         this._paymentApproversService.getPaymentApprovers1(user.uid);
        //     }
        // });

        this._horseManagerService.onHorseOwnerCreated
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false && user.uid){
                this.user = new HLUserModel(user.uid, user);
                // console.log('payment-info-payuser2:', this.user);
                this._paymentApproversService.getPaymentApprovers1(user.uid);
            }
        });    
    }
    /**
     * Edit ProviderService
     *
     * @param providerService
     */
    editPaymentApprover(paymentApprover): void
    {
        this._paymentApproversService.setCurrentApprover('edit', paymentApprover);
        this._paymentApproversService.updatePaymentApprover(paymentApprover);
        this._fuseSidebarService.getSidebar('horse-owner-payment-info').close();
        this._fuseSidebarService.getSidebar('horse-owner-payment-approver').open();
    }
    deletePaymentApprover(paymentApprover): void
    {
        const event = {
            title: "HorseLinc",
            msg: "Are you sure you want to delete?",
            btn1Name: "No",
            btn2Name: "Yes"
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
    addPaymentApprover(): void
    {
        this._paymentApproversService.setCurrentApprover('Add');
        this._fuseSidebarService.getSidebar('horse-owner-payment-info').close();
        this._fuseSidebarService.getSidebar('horse-owner-payment-approver').open();
    }

    onAddPaymentCard(): void{

        const dialogRef = this._matDialog.open(UserPaymentCardComponent, {
            panelClass: 'user-payment-card',
            data: {data: this.user
            } 
        });

        dialogRef.afterClosed().subscribe(() => {
            this._userAuthService.getUser(this.user.uid)
            .then( (user)=> {
                if (user != false){
                    this.user = new HLUserModel(user.uid, user);
                    this._horseManagerService.editingHorseOwner = this.user;
                }
            })
        });
    }
    onChangeDefaultCard(item: any): void{
        this._horseManagerService.changeDefaultCard(this.user.horseManager.customer.id, item.id, this.user.uid)
        .then( ()=> {
            this._userAuthService.getUser(this.user.uid)
            .then( (user)=> {
                if (user != false){
                    this.user = new HLUserModel(user.uid, user);
                    this._horseManagerService.editingHorseOwner = this.user;
                }
            })
        });
    }
    closePanel(): void
    {
        this._fuseSidebarService.getSidebar('horse-owner-payment-info').close();
        // this._userService.paymentInfoShow = false;
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
        return this._paymentApproversService.onPaymentApproversChanged1;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
