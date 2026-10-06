const baselightTheme = {
  direction: "ltr",
  palette: {
    primary: {
      main: "#0B4DA2",
      light: "#E5F4F9",
      dark: "#153877",
    },
    secondary: {
      main: "#F8CF14",
      light: "#FFF6C8",
      dark: "#D4AE00",
    },
    success: {
      main: "#7A9C59",
      light: "#F1F6EB",
      dark: "#5F7C44",
      contrastText: "#ffffff",
    },
    info: {
      main: "#006AF9",
      light: "#E5F4F9",
      dark: "#0B4DA2",
      contrastText: "#ffffff",
    },
    error: {
      main: "#B20000",
      light: "#FDECEC",
      dark: "#8C0000",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#F8CF14",
      light: "#FFF6C8",
      dark: "#D4AE00",
      contrastText: "#1A2B4A",
    },
    purple: {
      A50: "#E5F4F9",
      A100: "#0B4DA2",
      A200: "#153877",
    },
    grey: {
      100: "#F2F6FA",
      200: "#EAEFF4",
      300: "#DFE5EF",
      400: "#7C8FAC",
      500: "#5A6A85",
      600: "#1A2B4A",
    },
    text: {
      primary: "#1A2B4A",
      secondary: "#5A6A85",
    },
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "#f6f9fc",
    },
    divider: "#e5eaef",
    background: {
      default: "#F5F8FC",
      paper: "#ffffff",
    },
  },
};

const baseDarkTheme = {
  direction: "ltr",
  palette: {
    primary: {
      main: "#4B8CDE",
      light: "#1C355C",
      dark: "#0B4DA2",
    },
    secondary: {
      main: "#F8CF14",
      light: "#3D3818",
      dark: "#D4AE00",
    },
    success: {
      main: "#7A9C59",
      light: "#1B3C48",
      dark: "#5F7C44",
      contrastText: "#ffffff",
    },
    info: {
      main: "#006AF9",
      light: "#223662",
      dark: "#0B4DA2",
      contrastText: "#ffffff",
    },
    error: {
      main: "#E05353",
      light: "#4B313D",
      dark: "#B20000",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#F8CF14",
      light: "#4D3A2A",
      dark: "#D4AE00",
      contrastText: "#1A2B4A",
    },
    purple: {
      A50: "#E5F4F9",
      A100: "#0B4DA2",
      A200: "#153877",
    },
    grey: {
      100: "#333F55",
      200: "#465670",
      300: "#7C8FAC",
      400: "#DFE5EF",
      500: "#EAEFF4",
      600: "#F2F6FA",
    },
    text: {
      primary: "#EAEFF4",
      secondary: "#7C8FAC",
    },
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "#333F55",
    },
    divider: "#333F55",
    background: {
      default: "#0F1724",
      dark: "#0F1724",
      paper: "#152033",
    },
  },
};

export { baseDarkTheme, baselightTheme };
