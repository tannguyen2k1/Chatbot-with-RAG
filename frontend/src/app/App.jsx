import { useRoutes } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
// ROOT THEME PROVIDER
import { MatxTheme } from "./components";
// ALL CONTEXTS
import SettingsProvider from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/FirebaseAuthContext";
import { UserProvider } from "./contexts/UserContext";
import { AuthProviderCustom } from "./contexts/AuthContext";
import { SnackbarProvider } from "notistack";
// ROUTES
import routes from "./routes";
// FAKE SERVER
import "../__api__";

export default function App() {
  const content = useRoutes(routes);

  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
      <SettingsProvider>
        <AuthProvider>
          <AuthProviderCustom>
            <UserProvider>
              <MatxTheme>
                <CssBaseline />
                {content}
              </MatxTheme>
            </UserProvider>
          </AuthProviderCustom>
        </AuthProvider>
      </SettingsProvider>
    </SnackbarProvider>
  );
}
