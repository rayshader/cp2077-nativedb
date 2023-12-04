import {Routes} from '@angular/router';
import {EnumComponent} from "./pages/enum/enum.component";
import {BitfieldComponent} from "./pages/bitfield/bitfield.component";
import {FunctionComponent} from "./pages/function/function.component";
import {RedNodeKind} from "../shared/red-ast/red-node.ast";
import {ObjectComponent} from "./pages/object/object.component";

export const routes: Routes = [
  {path: 'e/:id', component: EnumComponent},
  {path: 'b/:id', component: BitfieldComponent},
  {path: 'c/:id', component: ObjectComponent, data: {kind: RedNodeKind.class}},
  {path: 's/:id', component: ObjectComponent, data: {kind: RedNodeKind.struct}},
  {path: 'f/:id', component: FunctionComponent},
];
