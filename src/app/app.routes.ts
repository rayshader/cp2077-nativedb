import {Routes} from '@angular/router';
import {EnumComponent} from "./pages/enum/enum.component";
import {BitfieldComponent} from "./pages/bitfield/bitfield.component";

export const routes: Routes = [
  {path: 'e/:id', component: EnumComponent},
  {path: 'b/:id', component: BitfieldComponent},
];
