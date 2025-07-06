import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define types for our router
type RouteParams = {
  channelId?: string;
  parentId?: string;
  isSearch: boolean;
  isPins: boolean;
  isInvite: boolean;
  isReset: boolean;
  inviteToken?: string;
  resetToken?: string;
};

type RouterContextType = {
  params: RouteParams;
  navigate: (
    path: string,
    options?: { state?: any; relative?: "path" },
  ) => void;
  location: {
    pathname: string;
    hash: string;
    search: string;
    state?: any;
  };
};

// Create context with a default undefined value
export const AppRouterContext = createContext<RouterContextType | undefined>(
  undefined,
);

// Parse hash to extract parameters
const parseHash = (hash: string): RouteParams => {
  // Remove the leading # if present
  const path = hash.startsWith("#") ? hash.substring(1) : hash;

  // Default params
  const params: RouteParams = {
    isSearch: false,
    isPins: false,
    isInvite: false,
    isReset: false,
  };

  if (!path) return params;

  // Handle special routes first
  if (path.startsWith("/invite/")) {
    params.isInvite = true;
    params.inviteToken = path.substring(8); // Remove "/invite/"
    return params;
  }

  if (path.startsWith("/reset/")) {
    params.isReset = true;
    params.resetToken = path.substring(7); // Remove "/reset/"
    return params;
  }

  // Split path into segments and remove empty segments
  const segments = path.split("/").filter((segment) => segment !== "");

  // Match patterns based on:
  // /:channelId
  // /:channelId/search
  // /:channelId/pins
  // /:channelId/t/:parentId
  if (segments.length >= 1) {
    params.channelId = segments[0];

    if (segments.length >= 2) {
      if (segments[1] === "search") {
        params.isSearch = true;
      } else if (segments[1] === "pins") {
        params.isPins = true;
      } else if (segments[1] === "t" && segments.length >= 3) {
        params.parentId = segments[2];
      }
    }
  }

  return params;
};

// Router provider props
type AppRouterProviderProps = {
  children: ReactNode;
};

// Router provider component
export const AppRouterProvider = ({ children }: AppRouterProviderProps) => {
  const [params, setParams] = useState<RouteParams>(() =>
    parseHash(window.location.hash || "")
  );

  const [location, setLocation] = useState({
    pathname: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
    state: undefined,
  });

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash || "";
      setParams(parseHash(newHash));
      setLocation({
        pathname: window.location.pathname,
        hash: newHash,
        search: window.location.search,
        state: undefined,
      });
    };

    // Add event listener
    window.addEventListener("hashchange", handleHashChange);

    // Initialize with current hash
    handleHashChange();

    // Clean up
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Navigate function
  const navigate = (
    path: string,
    options?: { state?: any; relative?: "path" },
  ) => {
    let normalizedPath: string;

    if (options?.relative === "path" && path === ".") {
      // Relative navigation to current path - just update state
      if (options?.state) {
        setLocation((prev) => ({ ...prev, state: options.state }));
      }
      return;
    } else if (options?.relative === "path") {
      // Relative navigation - append to current path
      const currentPath = window.location.hash.substring(1) || "";
      normalizedPath = currentPath + (path.startsWith("/") ? path : `/${path}`);
    } else {
      // Absolute navigation
      normalizedPath = path.startsWith("/") ? path : `/${path}`;
    }

    // Update location state if provided
    if (options?.state) {
      setLocation((prev) => ({ ...prev, state: options.state }));
    }

    window.location.hash = normalizedPath;
  };

  const contextValue: RouterContextType = {
    params,
    navigate,
    location,
  };

  return (
    <AppRouterContext.Provider value={contextValue}>
      {children}
    </AppRouterContext.Provider>
  );
};

// Custom hooks to use the router
export const useRouter = (): RouterContextType => {
  const context = useContext(AppRouterContext);
  if (context === undefined) {
    throw new Error("useRouter must be used within an AppRouterProvider");
  }
  return context;
};

export const useParams = (): RouteParams => {
  const { params } = useRouter();
  return params;
};

export const useNavigate = (): (
  path: string,
  options?: { state?: any; relative?: "path" },
) => void => {
  const { navigate } = useRouter();
  return navigate;
};

export const useLocation = () => {
  const { location } = useRouter();
  return location;
};
