export const EDITOR_ROUTES = [
    {
        path: '',
        loadComponent: () => import('./photo-editor').then(m => m.PhotoEditor)
    }
];