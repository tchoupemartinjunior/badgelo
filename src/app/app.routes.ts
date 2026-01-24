import { Routes } from '@angular/router';
import { Home } from './layout/home/home';

export const routes: Routes = [{
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
}, {
    path: 'home',
    component: Home
},
{
    path: 'editor',
    loadComponent: () => import('./features/editor/editor').then(m => m.Editor),
    loadChildren: () => import('./features/editor/editor.routes').then(m => m.EDITOR_ROUTES)
}

];
