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

// Helper function to resolve relative paths
const resolveRelativePath = (basePath: string, relativePath: string): string => {
  // Remove leading # if present
  const cleanBasePath = basePath.startsWith("#") ? basePath.substring(1) : basePath;
  
  // Split both paths into segments
  const baseSegments = cleanBasePath.split("/").filter(segment => segment !== "");
  const relativeSegments = relativePath.split("/").filter(segment => segment !== "");
  
  // Handle each relative segment
  const resultSegments = [...baseSegments];
  
  for (const segment of relativeSegments) {
    if (segment === ".") {
      // Current directory - do nothing
      continue;
    } else if (segment === "..") {
      // Parent directory - remove last segment
      if (resultSegments.length > 0) {
        resultSegments.pop();
      }
    } else {
      // Regular segment - add to result
      resultSegments.push(segment);
    }
  }
  
  // Join segments back together
  return "/" + resultSegments.join("/");
};

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
    state: params,
  });

  const handleHashChange = () => {
    const newHash = window.location.hash || "";
    setParams(parseHash(newHash));
    setLocation({
      pathname: window.location.pathname,
      hash: newHash,
      search: window.location.search,
      state: params,
    });
  };
  // Handle hash changes
  useEffect(() => {
    
    const handlePopState = (event: PopStateEvent) => {
      // Handle browser back/forward buttons
      const newHash = window.location.hash || "";
      setParams(parseHash(newHash));
      setLocation({
        pathname: window.location.pathname,
        hash: newHash,
        search: window.location.search,
        state: {...params, ...event.state }
      });
    };
    
    // Add event listeners
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);
    
    // Initialize with current hash
    handleHashChange();
    
    // Clean up
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handlePopState);
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
      // Relative navigation - resolve relative path
      const currentPath = window.location.hash || "";
      normalizedPath = resolveRelativePath(currentPath, path);
    } else {
      // Absolute navigation
      normalizedPath = path.startsWith("/") ? path : `/${path}`;
    }
    
    // Update location state if provided
    if (options?.state) {
      setLocation((prev) => ({ ...prev, state: options.state }));
    }
    
    // Use history.pushState to avoid page reload
    const newHash = `#${normalizedPath}`;
    window.history.pushState(options?.state || null, "", newHash);
    handleHashChange(); 
    // Manually trigger the hash change handler to update our state
    //const hashChangeEvent = new HashChangeEvent("hashchange", {
    //  oldURL: window.location.href,
    //  newURL: window.location.origin + window.location.pathname + newHash
    //});
    //window.dispatchEvent(hashChangeEvent);
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
