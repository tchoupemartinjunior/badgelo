export const EDITOR_ROUTES = [
    {
        path: '',
        loadComponent: () => import('./editor').then(m => m.Editor)
    }
]; 