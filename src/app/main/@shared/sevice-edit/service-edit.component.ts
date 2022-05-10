import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

import { HLServiceProviderServiceModel, HLBaseUserModel } from 'app/model/users';

import { UserAuthService } from 'app/service/user-auth.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';

@Component({
    selector     : 'user-service-edit',
    templateUrl  : './service-edit.component.html',
    styleUrls    : ['./service-edit.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class UserServiceEditComponent implements OnInit
{
    action: string;
    providerService: HLServiceProviderServiceModel;
    providerServiceForm: FormGroup;
    dialogTitle: string;    
    pageType: string;
    
    message: string;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {MatDialogRef<UserServiceEditComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public _matDialogRef: MatDialogRef<UserServiceEditComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _providerServicesService: UserProviderServicesService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Service';            
            this.providerService = _data.providerService;
        }
        else
        {
            this.dialogTitle = 'Add New Service';
            this.providerService = new HLServiceProviderServiceModel('', {});
        }

        this.providerServiceForm = this.createProviderServiceForm();
    }

    /**
     * On init
     */
    ngOnInit(): void
    {

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create providerService form
     *
     * @returns {FormGroup}
     */
    createProviderServiceForm(): FormGroup
    {
        return this._formBuilder.group({
            uid      : [this.providerService.uid],                        
            service: [this.providerService.service],
            quantity: [this.providerService.quantity],
            rate: [this.providerService.rate]
        });
    }
    checkForm(): boolean{
        const data = this.providerServiceForm.getRawValue();

        if (data.service === ''){
            this.message = 'The service field is blanked';
            return false;
        }
        else if (data.rate === 0){
            this.message = 'The rate value is zero';
            return false;
        }
        return true;
    }

    onCancel(): void{
        this._matDialogRef.close(null);
    }
    onClose(retParam: any): void{
        if (!this.checkForm()){
            return;
        }

        this._matDialogRef.close(retParam);
    }
    psearch(evt): boolean{
        const charCode = (evt.which) ? evt.which : evt.keyCode;

        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        const _value = this.providerServiceForm.value.rate;    

        const _pattern0 = /^\d*[.]\d*$/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        
        const _pattern2 = /^\d*[.]\d{2}$/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }
    
}
