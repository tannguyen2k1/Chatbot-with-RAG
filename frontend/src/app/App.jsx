import { useRoutes } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
// ROOT THEME PROVIDER
import { MatxTheme } from "./components";
// ALL CONTEXTS
import SettingsProvider from "./contexts/SettingsContext";
import { UserProvider } from "./contexts/UserContext";
import { AuthProviderCustom } from "./contexts/AuthContext";
import { SnackbarProvider } from "notistack";
import BaseProvider from "app/contexts/BaseProvider";
// ROUTES
import routes from "./routes";
// FAKE SERVER
import "../__api__";

export default function App() {
  const content = useRoutes(routes);

  return (
    <BaseProvider>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <SettingsProvider>
          <AuthProviderCustom>
            {/* Không bọc toàn bộ app bằng UserProvider nữa */}
            <MatxTheme>
              <CssBaseline />
              {content}
            </MatxTheme>
          </AuthProviderCustom>
        </SettingsProvider>
      </SnackbarProvider>
    </BaseProvider>
  );
}
