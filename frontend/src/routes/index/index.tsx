import type { RootRoute } from "@tanstack/react-router";
import { createRoute } from "@tanstack/react-router";

import { ArcLayerDemo } from "@/components/ArcLayerDemo";
// import { SimpleDemo } from "@/components/SimpleDemo";

const COLUMN_WIDTH = 100 / 16;
const LEFT_COLUMN_WIDTH = COLUMN_WIDTH * 3;
const RIGHT_COLUMN_WIDTH = COLUMN_WIDTH * 3;

export const IndexPage = () => {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#080929]">
      {/* <SimpleDemo /> */}
      <div
        className="flex h-full items-center justify-center bg-red-500"
        style={{ width: `${LEFT_COLUMN_WIDTH}%` }}
      >
        <h1 className="text-white">Section A</h1>
      </div>
      <div className="min-w-0 flex-1">
        <ArcLayerDemo />
      </div>
      <div
        className="flex h-full items-center justify-center bg-green-500"
        style={{ width: `${RIGHT_COLUMN_WIDTH}%` }}
      >
        <h1 className="text-white">Section B</h1>
      </div>
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
