import useSettings from "app/hooks/useSettings";
import MatxCustomizer from "../MatxCustomizer/MatxCustomizer";
import SecondarySidebarToggle from "./SecondarySidebarToggle";
import SecondarySidebarContent from "./SecondarySidebarContent";
import { SecondarySidenavTheme } from "../MatxTheme/SecondarySidenavTheme";

export default function SecondarySidebar() {
  const { settings, updateSettings } = useSettings();
  const secondarySidebarTheme = settings.themes[settings.secondarySidebar.theme];

  const handleClose = () => {
    updateSettings({ secondarySidebar: { open: false } });
  };

  return (
    <SecondarySidenavTheme theme={secondarySidebarTheme}>
      {settings.secondarySidebar.open && (
        <MatxCustomizer open={true} onClose={handleClose} />
      )}
      <SecondarySidebarToggle />
    </SecondarySidenavTheme>
  );
}
