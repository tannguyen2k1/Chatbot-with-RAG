import { Be_Vietnam_Pro } from "next/font/google";

export const plus = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  fallback: ["Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

const typography = {
  fontFamily: plus.style.fontFamily,
  h1: {
    fontWeight: 700,
    fontSize: "2.25rem",
    lineHeight: "2.75rem",
  },
  h2: {
    fontWeight: 700,
    fontSize: "1.875rem",
    lineHeight: "2.25rem",
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: "1.75rem",
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.3125rem",
    lineHeight: "1.6rem",
  },
  h5: {
    fontWeight: 600,
    fontSize: "1.125rem",
    lineHeight: "1.6rem",
  },
  h6: {
    fontWeight: 600,
    fontSize: "1rem",
    lineHeight: "1.2rem",
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
  },
  body1: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: "1.45rem",
  },
  body2: {
    fontSize: "0.75rem",
    letterSpacing: "0rem",
    fontWeight: 400,
    lineHeight: "1.1rem",
  },
  subtitle1: {
    fontSize: "0.875rem",
    fontWeight: 400,
  },
  subtitle2: {
    fontSize: "0.875rem",
    fontWeight: 400,
  },
};

export default typography;
