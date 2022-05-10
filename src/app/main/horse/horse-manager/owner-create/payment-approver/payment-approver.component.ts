import { Component, OnInit, Pipe } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';

import { HLUserModel, HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';

import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Component({
  selector: 'horse-owner-payment-approver',
  templateUrl: './payment-approver.component.html',
  styleUrls: ['./payment-approver.component.scss']
})

export class HorseOwnerPaymentApproverComponent implements OnInit {
    horseManagers: [];
    
    action: string;
    curApprover: HLHorseManagerPaymentApproverModel;

    userQuestionUpdate = new Subject<string>();
    userQuestion: string;
    userQuestionAuto: string;
    amountUnlimited: boolean;
    amountValue: number;
    message: string;

    private _unsubscribeAll: Subject<any>;
    /**
     * Constructor
     *
     * @param {FormBuilder} _formBuilder
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _managerProvidersService: UserManagerProvidersService,
        private _paymentApproversService: UserPaymentApproversService,
        private _progressBarService: FuseProgressBarService,
    )
    {
        this._unsubscribeAll = new Subject();
        this.horseManagers = [];

        this.curApprover = new HLHorseManagerPaymentApproverModel('', {});
        this.amountUnlimited = false;
        this.amountValue = 0;

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

        this.action = 'Add';
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this._horseManagerService.onSearchHorseManagers
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horseManagers => {
            this.horseManagers = horseManagers;
            // console.log('this is horse-manager:', this.horseManagers);
        });

        this._paymentApproversService.onSelectedApproverChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(approver => {
            this.action = this._paymentApproversService.actionOfApprover;
            if (this.action === 'Add'){
                this.curApprover = new HLHorseManagerPaymentApproverModel('', {});
                this.amountValue = 0;
                this.amountUnlimited = false;    
            }
            else{
                this.curApprover = new HLHorseManagerPaymentApproverModel(approver.uid, approver);
                this.amountValue = this.curApprover.amount;
                this.amountUnlimited = this.curApprover.amount == null || this.curApprover.amount === 0;    
            }
            // console.log ('addapprover:', approver, ',', this.curApprover);
            this.userQuestion = this.curApprover.name;
            this.message = '';
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    // console.log ('searchprovider:', value);
                    this.searchCurrent(value);
                }
            });
    }
    displayFnOfSearch(item): string{
        return item ? item.name : '';
    }
    searchCurrent(query: any): void{
        // let query: any;

        // query = event.target.value;
        this._horseManagerService.searcHorseManagers(query);
    }
    onSelectApprover(horseManager: HLHorseManagerModel): void{
        this.curApprover.userId = horseManager.userId;
        this.curApprover.creatorId = this._horseManagerService.editingHorseOwner.uid;
        this.curApprover.name = horseManager.name || '';
        this.curApprover.location = horseManager.location || '';
        this.curApprover.avatarUrl = horseManager.avatarUrl || '';
        this.curApprover.phone = horseManager.phone || '';
        this.curApprover.createdAt = Date.now();
    }
    editApprover(): void{
        if (this.curApprover.name == ''){
            this.message = 'The approver is not selected';
            return;
        }
        if (this.amountUnlimited){
            this.curApprover.amount = null;
        }
        else{
            this.curApprover.amount = Number(this.amountValue);
            if (this.amountValue == 0)
            {
                this.message = 'The amount has must value';
                return;
            }
        }

        // console.log('editPaymentApprover:', this.amountUnlimited, ',', this.amountValue, ',', this.curApprover);

        this.curApprover.percentage = 100;
        if (this.action === 'Add'){
            this._paymentApproversService.addPaymentApprover1(this.curApprover);
        }
        else{
            this._paymentApproversService.updatePaymentApprover1(this.curApprover);
        }
        
        this.closePanel();
    }
    psearch(evt): boolean{
        let charCode = (evt.which) ? evt.which : evt.keyCode;
        
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        let _value = this.amountValue.toString();    

        let _pattern0 = /\d+/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        
        let _pattern2 = /\d+/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }
    closePanel(): void
    {
        this._fuseSidebarService.getSidebar('horse-owner-payment-approver').close();
        this._fuseSidebarService.getSidebar('horse-owner-payment-info').open();
    }
}
