import { Route } from '@angular/router';
import { ShellComponent } from './core/components/shell/shell.component';
import { AccountGuard } from './core/providers/guards/account.guard';

export const routes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'account',
        loadChildren: () =>
          import('./account/account.module').then((mod) => mod.AccountModule),
        canActivate: [AccountGuard],
      },
    ],
  },
  {
    path: '',
    loadChildren: () =>
      import('./auth/auth.module').then((mod) => mod.AuthModule),
  },
];