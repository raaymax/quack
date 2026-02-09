import { Main } from "./layout/Main.tsx";
import { Discussion } from "./layout/Discussion.tsx";
import { Search } from "./organisms/Search.tsx";
import { Pins } from "./organisms/Pins.tsx";
import { app, client } from "../core/index.ts";
import { ErrorPageS } from "./pages/ErrorPage.tsx";
import { AppRouterProvider, useParams, useRouter } from "./AppRouter.tsx";
import { useEffect, useState } from "react";
import { InitFailedError, PageNotFoundError } from "./errors.ts";

// Component to handle route loading and errors
const RouteHandler = () => {
  const params = useParams();
  const { navigate } = useRouter();
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(!app.initCompleted);

  useEffect(() => {
    const loadRoute = async () => {
      try {
        setError(null);

        // Handle special routes
        if (params.isInvite || params.isReset) {
          setIsInitialLoading(false);
          return;
        }

        // Initialize app if not already done
        await app.init();
        if (app.initFailed) throw new InitFailedError();
        setIsInitialLoading(false);

        // Handle channel routes
        if (params.channelId) {
          app.setLoading(true);
          const channel = await client.api.getChannelById(params.channelId);
          app.setLoading(false);
          if (!channel) throw new PageNotFoundError();
          app.channels.upsert(channel);
        } else {
          // Redirect to main channel if no channel specified
          const { mainChannelId } = await client.api.getUserConfig() || {};
          if (mainChannelId) {
            navigate(`/${mainChannelId}`);
            return;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsInitialLoading(false);
      }
    };

    loadRoute();
  }, [params.channelId, params.isInvite, params.isReset]);

  if (error) {
    return <ErrorPageS error={error} />;
  }

  if (isInitialLoading) {
    return <div>Loading...</div>;
  }

  // Handle special routes
  if (params.isInvite) {
    return null; // This will be handled by the main App component
  }

  if (params.isReset) {
    return null; // This will be handled by the main App component
  }

  // Handle main app routes
  if (params.channelId) {
    return (
      <Main>
        {params.isSearch && <Discussion><Search /></Discussion>}
        {params.isPins && <Discussion><Pins /></Discussion>}
        {!params.isPins && !params.isSearch && (
          <Discussion/>
        )}
      </Main>
    );
  }

  // Default case - should not reach here due to redirect above
  return <div>Redirecting...</div>;
};

export const Router = () => {
  return (
    <AppRouterProvider>
      <RouteHandler />
    </AppRouterProvider>
  );
};
