import type { RootRoute } from "@tanstack/react-router";
import { createRoute } from "@tanstack/react-router";

import { ArcLayerDemo } from "@/components/ArcLayerDemo";
// import { SimpleDemo } from "@/components/SimpleDemo";

export const IndexPage = () => {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#080929]">
      {/* <SimpleDemo /> */}
      <ArcLayerDemo />
    </main>
  );
};

const IndexRoute = <A, B, C, D, E, F extends Record<string, never>, G, H>(
  parentRoute: RootRoute<A, B, C, D, E, F, G, H>
) =>
  createRoute({
    path: "/",
    component: IndexPage,
    getParentRoute: () => parentRoute,
  });

export default IndexRoute;
