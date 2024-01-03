import {Routes} from '@angular/router';
import {ReadmeComponent} from "./pages/readme/readme.component";
import {RedNodeKind} from "../shared/red-ast/red-node.ast";
import {firstUsageGuard} from "./guards/first-usage.guard";
import {RecentVisitsComponent} from "./pages/recent-visits/recent-visits.component";
import {vanillaRedirectGuard} from "./guards/vanilla-redirect.guard";
import {importRedirectGuard} from "./guards/import-redirect.guard";

export const routes: Routes = [
  {path: '', component: RecentVisitsComponent, canActivate: [firstUsageGuard]},
  {path: 'readme', component: ReadmeComponent},
  {path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(c => c.SettingsComponent)},
  {
    path: 'bookmarks',
    loadComponent: () => import('./pages/bookmarks/bookmarks.component').then(c => c.BookmarksComponent)
  },
  {
    path: 'import',
    canActivate: [importRedirectGuard],
    loadComponent: () => import('./pages/import/import.component').then(c => c.ImportComponent)
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

  // NOTE: Vanilla route to prevent dead links.
  {path: 'Globals', redirectTo: 'f'},
  {path: ':name', children: [], canActivate: [vanillaRedirectGuard]}
];
