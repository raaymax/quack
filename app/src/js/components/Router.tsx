import { Main } from "./layout/Main.tsx";
import { Discussion } from "./layout/Discussion.tsx";
import { Search } from "./organisms/Search.tsx";
import { Pins } from "./organisms/Pins.tsx";
import {
  createHashRouter,
  Outlet,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { app, client } from "../core/index.ts";
import { ErrorPageS } from "./pages/ErrorPage.tsx";

import { InitFailedError, PageNotFoundError } from "./errors.ts";

const router = createHashRouter([
  {
    element: (
      <Main>
        <Outlet />
      </Main>
    ),
    children: [
      {
        path: "/:channelId",
        loader: async ({ params }) => {
          await app.init();
          if (app.initFailed) throw new InitFailedError();
          const { channelId } = params;
          if (!channelId) throw new PageNotFoundError();
          const channel = await client.api.getChannelById(channelId);
          if (!channel) throw new PageNotFoundError();
          return null;
        },
        element: <Discussion />,
        errorElement: <ErrorPageS />,
      },
      {
        path: "/:channelId/search",
        element: (
          <Discussion>
            <Search />
          </Discussion>
        ),
      },
      {
        path: "/:channelId/pins",
        element: (
          <Discussion>
            <Pins />
          </Discussion>
        ),
      },
      {
        path: "/:channelId/t/:parentId",
        element: <Discussion />,
      },
    ],
    errorElement: <ErrorPageS />,
  },
  {
    path: "/*",
    loader: async () => {
      const { mainChannelId } = await client.api.getUserConfig() || {};
      return redirect(`/${mainChannelId}`);
    },
    errorElement: <ErrorPageS />,
  },
]);

export const Router = () => {
  return <RouterProvider router={router} />;
};
