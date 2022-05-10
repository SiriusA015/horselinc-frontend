import { Component, OnDestroy, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { MatCalendarCellCssClasses } from '@angular/material';

@Component({
    selector     : 'apps-calendar',
    templateUrl  : './calendar.component.html',
    styleUrls    : ['./calendar.component.scss'],
//    encapsulation: ViewEncapsulation.None,
//    animations   : fuseAnimations
})

export class CalendarComponent implements OnInit, OnDestroy
{
    @Input() selectedDates: any;
    selectedDate: any;
    //selectedDates: any;
    datesToHighlight = ["2019-12-22T18:30:00.000Z", "2019-12-22T18:30:00.000Z", "2019-11-24T18:30:00.000Z", "2019-12-28T18:30:00.000Z", "2019-12-24T18:30:00.000Z", "2019-12-23T18:30:00.000Z", "2019-12-22T18:30:00.000Z", "2019-12-25T18:30:00.000Z"];
    
    

    /**
     * Constructor
     *
     */
    constructor(
    )
    {   
        //this.selectedDates = [new Date('2019-12-05T11:13:59'), new Date('2019-12-27T11:13:59')];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        // console.log(this.selectedDates);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    onSelect(event): void
    {
        this.selectedDate = event;
    }    
    dateClass()
    {
        
        return (date: Date): MatCalendarCellCssClasses => {
            const highlightDate = this.selectedDates
              .map(strDate => new Date(strDate))
              .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());
            
            return highlightDate ? 'special-date' : '';
        };
    }
}
