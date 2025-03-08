import { Loader } from "../atoms/Loader";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

export const LoadingIndicator = observer(() => {
  const app = useApp();
  const loading = app.loading;
  if (!loading) return null;
  return <Loader />;
});
