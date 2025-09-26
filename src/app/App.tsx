import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router';

export const App: React.FC = () => <RouterProvider router={router} />;
