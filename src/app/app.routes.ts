import {Routes} from '@angular/router';
import {ReadmeComponent} from "./pages/readme/readme.component";
import {RedNodeKind} from "../shared/red-ast/red-node.ast";

export const routes: Routes = [
  {path: '', component: ReadmeComponent},
  {path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(c => c.SettingsComponent)},
  {
    path: 'history',
    loadComponent: () => import('./pages/recent-visits/recent-visits.component').then(c => c.RecentVisitsComponent)
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./pages/bookmarks/bookmarks.component').then(c => c.BookmarksComponent)
  },
  {path: 'e/:id', loadComponent: () => import('./pages/enum/enum.component').then(c => c.EnumComponent)},
  {path: 'b/:id', loadComponent: () => import('./pages/bitfield/bitfield.component').then(c => c.BitfieldComponent)},
  {
    path: 'c/:id',
    loadComponent: () => import('./pages/object/object.component').then(c => c.ObjectComponent),
    data: {kind: RedNodeKind.class}
  },
  {
    path: 's/:id',
    loadComponent: () => import('./pages/object/object.component').then(c => c.ObjectComponent),
    data: {kind: RedNodeKind.struct}
  },
  {path: 'f', loadComponent: () => import('./pages/functions/functions.component').then(c => c.FunctionsComponent)},
  {path: 'f/:id', loadComponent: () => import('./pages/function/function.component').then(c => c.FunctionComponent)},
];
