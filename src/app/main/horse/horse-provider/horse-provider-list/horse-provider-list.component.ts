import { Component, ViewChild, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { Subject } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { HLHorseManagerModel } from 'app/model/users';
import { HLHorseModel } from 'app/model/horses';
import { HLProviderHorseModel } from 'app/model/horses';
import { takeUntil, debounceTime, distinctUntilChanged  } from 'rxjs/operators';
import { FuseConfigService } from '@fuse/services/config.service';

interface ExampleFlatNode {

    expandable: boolean;
    manager: HLHorseManagerModel;
    horses: any;
    level: number;
}

@Component({
    selector: 'horse-provider-list',
    templateUrl: './horse-provider-list.component.html',
    styleUrls: ['./horse-provider-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations

})
export class HorseProviderListComponent implements OnInit, OnDestroy
{
    
    @ViewChild('tree', {static: false}) tree;

    horses: HLProviderHorseModel[];
    providerManager: HLHorseManagerModel;
    providerHorses: HLHorseModel[];
    tempHorsesForManager: HLProviderHorseModel[] = [];
    tempHorse: HLHorseModel;
    userQuestion: string = '';
    disFlag: boolean;
    isLogging: boolean = false;
    isLogging1: boolean = true;
    findErr: boolean = false;
    isLoggingFilter: boolean = false;
    listFlag: boolean = true;
    userQuestionUpdate = new Subject<string>();

    private _unsubscribeAll: Subject<any>;
    private _transformer = (node: any, level: number) => {
        return {
            expandable: !!node.horses && node.horses.length > 0,
            manager: node.manager,
            horses: node,
            level: level,
        };
    }

    treeFlattener = new MatTreeFlattener(
        this._transformer, node => node.level, node => node.expandable, node => node.horses
    );

    treeControl = new FlatTreeControl<ExampleFlatNode> (
        node => node.level,
        node => node.expandable
    );
    
   dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  
    constructor(
        private _horseProviderService: HorseProviderService, 
        private _fuseConfigService: FuseConfigService,

    ) 
    {
        this._unsubscribeAll = new Subject();   
        this.isLogging1 = true;
    }

    ngOnDestroy(): void{
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void{
        this.tempHorsesForManager = [];
        this._horseProviderService.onProviderHorsesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {  
                if (horses != false && horses != null ){
                    this.horses = horses;
                    this.dataSource.data = horses;
                    this.disFlag = true;
                    this.isLogging1 = false;
                }
                else{
                    this.disFlag = false;
                    if (horses == null){ this.isLogging1 = false; }
                }
            }
        );  
        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                this.isLogging = true;
                this.findErr = false; 
                this.searchCurrent(value);
               
            });       
    }
    
    hasChild = (_: number, node: ExampleFlatNode) => node.expandable;
 
    readHorseProvider(data): void{
       this.tempHorse = data;
       this._horseProviderService.setCurrentHorseFlag(true);
       this._horseProviderService.onSetCurrentProviderHorse.next(this.tempHorse);
       
    }
    onManager(manager): void{
        this._horseProviderService.onManagerFlag.next({'data': manager, 'status': 'false'});
    }

    

    searchCurrent(query): void{

        this._horseProviderService.getHorsesForProvider().then(horsesForProvider => {
                let tempHorses: HLHorseModel[] = [];
                let temp: HLProviderHorseModel[] = [];
                this.tempHorsesForManager = horsesForProvider;
                this.tempHorsesForManager.map(horseForManager => {
                    horseForManager.horses.map(horse => {
                        if (horse.barnName.toLowerCase().search(query.toLowerCase()) >= 0 || horse.trainer.name.toLowerCase().search(query.toLowerCase()) >= 0 || horse.displayName.toLowerCase().search(query.toLowerCase()) >= 0) {
                            tempHorses.push(horse);
                        }
                    });
                    horseForManager.horses = tempHorses;
                    tempHorses = [];

                    if (horseForManager.horses.length > 0){
                        temp.push(horseForManager);
                    }   
                });
                if ( temp.length > 0 ){
                    this.findErr = false; }
                else{this.findErr = true; }
                this.dataSource.data = temp;
                this.tree.treeControl.expandAll();
                this.isLogging = false;
                temp = [];
        });
    }
}
  
