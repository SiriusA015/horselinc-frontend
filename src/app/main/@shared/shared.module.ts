import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppPrivacyComponent } from "./app-privacy/app-privacy.component";
import { AppTermsComponent } from "./app-terms/app-terms.component";

@NgModule({
imports: [
    CommonModule
],
declarations: [
    AppPrivacyComponent,
    AppTermsComponent
],
exports: [
    AppPrivacyComponent,
    AppTermsComponent
]
})
export class SharedModule 
{

}
