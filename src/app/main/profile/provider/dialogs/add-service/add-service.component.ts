import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'profile-provider-addservice',
  templateUrl: './add-service.component.html',
  styleUrls: ['./add-service.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class ProfileProviderAddServiceComponent implements OnInit {


    message: string;

  constructor() { }

  ngOnInit(): void
  {
  } 

}
