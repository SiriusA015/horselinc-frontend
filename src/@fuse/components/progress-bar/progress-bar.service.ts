import { Injectable } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Overlay } from '@angular/cdk/overlay';

@Injectable({
    providedIn: 'root'
})
export class FuseProgressBarService
{
    // Private
    private _bufferValue: BehaviorSubject<number>;
    private _mode: BehaviorSubject<string>;
    private _value: BehaviorSubject<number>;
    private _visible: BehaviorSubject<boolean>;
    progress: number;
    isProgressing: boolean;
    /**
     * Constructor
     *
     * @param {Router} _router
     */
    constructor(
        private _router: Router,
        private _overlay: Overlay
    )
    {
        // Initialize the service
        this._init();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Buffer value
     */
    get bufferValue(): Observable<any>
    {
        return this._bufferValue.asObservable();
    }

    setBufferValue(value: number): void
    {
        this._bufferValue.next(value);
    }

    /**
     * Mode
     */
    get mode(): Observable<any>
    {
        return this._mode.asObservable();
    }

    setMode(value: 'determinate' | 'indeterminate' | 'buffer' | 'query'): void
    {
        this._mode.next(value);
    }

    /**
     * Value
     */
    get value(): Observable<any>
    {
        return this._value.asObservable();
    }

    setValue(value: number): void
    {
        this._value.next(value);
    }

    /**
     * Visible
     */
    get visible(): Observable<any>
    {
        return this._visible.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Initialize
     *
     * @private
     */
    private _init(): void
    {
        // Initialize the behavior subjects
        this._bufferValue = new BehaviorSubject(0);
        this._mode = new BehaviorSubject('determinate');
        this._value = new BehaviorSubject(0);
        this._visible = new BehaviorSubject(false);

        this.isProgressing = false;
        // Subscribe to the router events to show/hide the loading bar
        this._router.events
            .pipe(filter((event) => event instanceof NavigationStart))
            .subscribe(() => {
                this.beginLoading1();
            });

        this._router.events
            .pipe(filter((event) => event instanceof NavigationEnd || event instanceof NavigationError || event instanceof NavigationCancel))
            .subscribe(() => {
                this.endLoading1();
            });
    }

    beginLoading1(): void{
        if (this.isProgressing){
            return;
        }
        this.isProgressing = true;
        this.setProgress(0);
        this._visible.next(true);
        setTimeout(() => {
            this.setProgress(20);
        }, 100);
        setTimeout(() => {
            this.setProgress(30);
        }, 500);
        setTimeout(() => {
            this.setProgress(50);
        }, 1000);
        setTimeout(() => {
            this.setProgress(70);
        }, 1500);
        setTimeout(() => {
            this.setProgress(90);
        }, 2000);

        setTimeout(() => {
            this.endLoading1();
        }, 5000);
    }
    endLoading1(): void{
        this.setProgress(100);
        this.isProgressing = false;
        setTimeout(() => {
            this._visible.next(false);
        }, 500);
    }
    beginLoading2(): void{
        // console.log('beginLoading2');
        this.beginLoading1();
    }
    endLoading2(): void{
        // console.log('endLoading2');
        this.endLoading1();
    }
    setProgress(value: number): void{
        if (!this.isProgressing){
            return;
        }
        this.progress = value;
        this.setValue(this.progress);
        this.setBufferValue(this.progress);
    }
}

