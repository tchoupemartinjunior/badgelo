import { Routes } from '@angular/router';
import { Home } from './features/home/home';

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
    loadComponent: () => import('./features/photo-editor/photo-editor').then(m => m.PhotoEditor),
    loadChildren: () => import('./features/photo-editor/editor.routes').then(m => m.EDITOR_ROUTES)
}

];
