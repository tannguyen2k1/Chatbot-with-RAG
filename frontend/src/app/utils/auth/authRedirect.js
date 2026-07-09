let redirecting = false;

export function isAuthPath(pathname) {
  return Boolean(pathname && pathname.startsWith("/auth"));
}

export function resetLoginRedirect() {
  redirecting = false;
}

export function redirectToLogin(router, pathname) {
  const currentPath =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "");

  if (isAuthPath(currentPath) || redirecting) {
    return;
  }

  redirecting = true;

  if (router?.replace) {
    router.replace("/auth/login");
    return;
  }

  if (typeof window !== "undefined") {
    window.location.replace("/auth/login");
  }
}
