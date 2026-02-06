import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

export function ErrorBoundary({ error }: { error: unknown }) {
  // const error = useRouteError();

  // Build a human-friendly message
  // let message: string;
  // if (isRouteErrorResponse(error)) {
  //   message = `HTTP ${error.status} — ${error.statusText}`;
  // } else if (error instanceof Error) {
  //   message = error.message;
  // } else {
  //   message = String(error);
  // }

  // Always log to console
  // console.error("Route error:", error);

  return (
    <div className="min-h-screen bg-[#fee] p-40 text-red-500">
      <h1>🚨 Uh oh — something went wrong!</h1>
      <pre className="rounded-md bg-white p-20 whitespace-pre-wrap">
        {error as ReactNode}
      </pre>

      <div className="mt-48">
        <h2>🔍 Router DevTools</h2>
        <p className="text-lg text-gray-500">
          (inspect your matches, params & loaders below)
        </p>
        <TanStackRouterDevtools />
      </div>
    </div>
  );
}
