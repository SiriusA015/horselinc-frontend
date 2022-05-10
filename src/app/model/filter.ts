

export class HLScheduleFilterModel {

    sortType: string;
    endDate: number;
    startDate: number;
    
    constructor(data: any) {
        this.sortType = data.sortType || null;
        this.endDate = data.endDate || null;
        this.startDate = data.startDate || null;
    }
}
