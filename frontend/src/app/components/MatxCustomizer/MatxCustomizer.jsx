import { Fragment, useState } from "react";
import Scrollbar from "react-perfect-scrollbar";
import Close from "@mui/icons-material/Close";
import Settings from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import styled from "@mui/material/styles/styled";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ThemeProvider from "@mui/material/styles/ThemeProvider";

import useSettings from "app/hooks/useSettings";
import { H5, Span } from "../Typography";
import { StyledBadge } from "./styles";
import { themeShadows } from "../MatxTheme/themeColors";

// STYLED COMPONENTS
const Label = styled(Span)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  borderRadius: "4px",
  marginBottom: "2.5rem",
  letterSpacing: "1.5px",
  padding: ".25rem .5rem",
  transform: "rotate(90deg)",
  color: theme.palette.secondary.main,
  backgroundColor: theme.palette.primary.dark,
  "&:hover, &.open": {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText
  }
}));

const MaxCustomaizer = styled("div")(({ theme }) => ({
  top: 0,
  right: 0,
  zIndex: 50,
  width: 320,
  display: "flex",
  height: "100vh",
  position: "fixed",
  paddingBottom: "32px",
  flexDirection: "column",
  boxShadow: themeShadows[12],
  background: theme.palette.background.default,
  "& .helpText": { margin: "0px .5rem 1rem" }
}));

const LayoutBox = styled(StyledBadge)(() => ({
  width: "100%",
  height: "152px !important",
  cursor: "pointer",
  marginTop: "12px",
  marginBottom: "12px",
  "& .layout-name": { display: "none" },
  "&:hover .layout-name": {
    zIndex: 12,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
    background: "rgba(0,0,0,0.3)"
  }
}));

const Controller = styled("div")(() => ({
  minHeight: 58,
  display: "flex",
  alignItems: "center",
  marginBottom: "16px",
  padding: "14px 20px",
  boxShadow: themeShadows[6],
  justifyContent: "space-between"
}));

const IMG = styled("img")(() => ({ width: "100%" }));

const StyledScrollBar = styled(Scrollbar)(() => ({
  paddingLeft: "16px",
  paddingRight: "16px"
}));

export default function MatxCustomizer({ open: openProp, onClose }) {
  const [openState, setOpenState] = useState(false);
  // Remove tabIndex and tab logic
  const { settings, updateSettings } = useSettings();

  // Determine if controlled or uncontrolled
  const isControlled = typeof openProp === 'boolean';
  const open = isControlled ? openProp : openState;
  const handleToggle = () => {
    if (isControlled) {
      if (onClose) onClose();
    } else {
      setOpenState((prev) => !prev);
    }
  };

  // Remove handleTabChange
  let activeTheme = { ...settings.themes[settings.activeTheme] };

  return (
    <Fragment>
      {/* Hide Label if controlled and open */}
      {!(isControlled && open) && (
        <Tooltip title="Theme Settings" placement="left">
          <Label className={open ? "open" : ""} onClick={handleToggle}>
            THEMES
          </Label>
        </Tooltip>
      )}
      <ThemeProvider theme={activeTheme}>
        <Drawer
          open={open}
          anchor="right"
          variant="temporary"
          onClose={handleToggle}
          ModalProps={{ keepMounted: true }}>
          <MaxCustomaizer>
            <Controller>
              <Box display="flex">
                <Settings className="icon" color="primary" />
                <H5 ml={1} fontSize={16}>
                  Theme Settings
                </H5>
              </Box>
              <IconButton onClick={handleToggle}>
                <Close className="icon" />
              </IconButton>
            </Controller>
            {/* Remove tab buttons, always show Demos content */}
            <StyledScrollBar options={{ suppressScrollX: true }}>
              <Box mb={4} mx={3}>
                <Box color="text.secondary">Layouts</Box>
                <Box display="flex" flexDirection="column">
                  {demoLayouts.map((layout) => (
                    <LayoutBox
                      key={layout.name}
                      color="secondary"
                      badgeContent={"Pro"}
                      invisible={!layout.isPro}>
                      <Card
                        elevation={4}
                        sx={{ position: "relative" }}
                        onClick={() => updateSettings(layout.options)}>
                        <Box overflow="hidden" className="layout-name">
                          <Button variant="contained" color="secondary">
                            {layout.name}
                          </Button>
                        </Box>
                        <IMG src={layout.thumbnail} alt={layout.name} />
                      </Card>
                    </LayoutBox>
                  ))}
                </Box>
              </Box>
            </StyledScrollBar>
          </MaxCustomaizer>
        </Drawer>
      </ThemeProvider>
    </Fragment>
  );
}

const demoLayouts = [
  {
    isPro: false,
    name: "Light Sidebar",
    thumbnail: "/assets/images/screenshots/layout1-customizer.png",
    options: {
      activeTheme: "blue",
      activeLayout: "layout1",
      layout1Settings: {
        topbar: { theme: "blueDark", fixed: true },
        leftSidebar: { mode: "full", theme: "whiteBlue", bgOpacity: 0.98 }
      },
      footer: { theme: "slateDark1" }
    }
  },
  {
    isPro: false,
    name: "Compact Sidebar",
    thumbnail: "/assets/images/screenshots/layout5-customizer.png",
    options: {
      activeTheme: "blue",
      activeLayout: "layout1",
      layout1Settings: {
        topbar: { theme: "whiteBlue", fixed: true },
        leftSidebar: { mode: "compact", theme: "slateDark1", bgOpacity: 0.92 }
      }
    }
  },
  {
    isPro: false,
    name: "Dark Sidebar",
    thumbnail: "/assets/images/screenshots/layout1-blue-customizer.png",
    options: {
      activeTheme: "blue",
      activeLayout: "layout1",
      layout1Settings: {
        topbar: { theme: "blueDark", fixed: true },
        leftSidebar: { mode: "full", theme: "slateDark1", bgOpacity: 0.92 }
      }
    }
  }
];
