import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';
import { FacilitatorAuthProvider } from './lib/FacilitatorAuthContext';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FacilitatorAuthProvider>
      <RouterProvider router={router} />
    </FacilitatorAuthProvider>
  </React.StrictMode>
);
