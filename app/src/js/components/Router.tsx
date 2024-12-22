import { Main } from './layout/Main';
import { Discussion } from './layout/Discussion';
import { Search } from './organisms/Search';
import { Pins } from './organisms/Pins';
import { redirect, useRouteError ,
  createHashRouter,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { client, ApiError } from '../core'
import { ErrorPageS } from './pages/ErrorPage';

import { PageNotFoundError } from './errors';


const router = createHashRouter([
  { 
    element: <Main><Outlet /></Main>,
    children: [
      {
        path: "/:channelId",
        loader: async ({ params }) => {
          const {channelId} = params;
          if(!channelId) throw new PageNotFoundError()
          const channel = await client.api.getChannelById(channelId);
          if(!channel) throw new PageNotFoundError()
          return null;
        },
        element: <Discussion />,
        errorElement: <ErrorPageS/>,
      },
      {
        path: "/:channelId/search",
        element: <Discussion><Search /></Discussion>,
      },
      {
        path: "/:channelId/pins",
        element: <Discussion><Pins /></Discussion>,
      },
      {
        path: "/:channelId/t/:parentId",
        element: <Discussion/>,
      },
    ],
    errorElement: <ErrorPageS />,
  },
  {
    path: "/*",
    loader: async () => {
      const {mainChannelId} = await client.api.getUserConfig()
      return redirect(`/${mainChannelId}`);
    },
    errorElement: <ErrorPageS />,
  },
]);


export const Router= () => {
  return (
    <RouterProvider router={router} />
  );
};

