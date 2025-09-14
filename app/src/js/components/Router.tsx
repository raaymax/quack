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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRoute = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Handle special routes
        if (params.isInvite || params.isReset) {
          setIsLoading(false);
          return;
        }

        // Initialize app if not already done
        await app.init();
        console.log("App initialized:", app.initFailed);
        if (app.initFailed) throw new InitFailedError();

        // Handle channel routes
        if (params.channelId) {
          console.log("Loading channel:", params.channelId);
          const channel = await client.api.getChannelById(params.channelId);
          if (!channel) throw new PageNotFoundError();
          console.log("Channel loaded:", channel);
        } else {
          // Redirect to main channel if no channel specified
          const { mainChannelId } = await client.api.getUserConfig() || {};
          if (mainChannelId) {
            navigate(`/${mainChannelId}`);
            return;
          }
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    };

    loadRoute();
  }, [params.channelId, params.isInvite, params.isReset]);

  if (error) {
    return <ErrorPageS error={error} />;
  }

  if (!app.initCompleted) {
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
        {/*params.isSearch && <Discussion><Search /></Discussion>*/}
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
