export function getBaseUrl() {
  if (typeof window === "undefined") {
    // In SSR/Server Components, route through the internal docker network.
    // The backend server is always reachable at http://server:8080 inside docker.
    return process.env.BACKEND_URL || "http://server:8080";
  }
  // In the browser, use relative paths so Caddy can proxy the request to the backend.
  return "";
}
