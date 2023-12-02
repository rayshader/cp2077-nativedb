import {Routes} from '@angular/router';
import {EnumComponent} from "./pages/enum/enum.component";
import {BitfieldComponent} from "./pages/bitfield/bitfield.component";
import {FunctionComponent} from "./pages/function/function.component";

export const routes: Routes = [
  {path: 'e/:id', component: EnumComponent},
  {path: 'b/:id', component: BitfieldComponent},
  {path: 'f/:id', component: FunctionComponent},
];
