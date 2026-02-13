import { ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { DeckGL } from "@deck.gl/react";
import { scaleQuantile } from "d3-scale";
import { useEffect, useMemo, useState } from "react";
import { Map } from "react-map-gl/maplibre";

import { socket } from "@/lib/sockets";

import type { Color, MapViewState, PickingInfo } from "@deck.gl/core";
import type { Feature, MultiPolygon, Polygon } from "geojson";

// Source data GeoJSON
export const DATA_URL =
  "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/arc/counties.json"; // eslint-disable-line

export const inFlowColors: Color[] = [
  [255, 255, 204],
  [199, 233, 180],
  [127, 205, 187],
  [65, 182, 196],
  [29, 145, 192],
  [34, 94, 168],
  [12, 44, 132],
];

export const outFlowColors: Color[] = [
  [255, 255, 178],
  [254, 217, 118],
  [254, 178, 76],
  [253, 141, 60],
  [252, 78, 42],
  [227, 26, 28],
  [177, 0, 38],
];

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -100,
  latitude: 40.7,
  zoom: 3,
  maxZoom: 15,
  pitch: 30,
  bearing: 30,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

type CountyProperties = {
  /** county name */
  name: string;
  /** county index -> net flow */
  flows: Record<string, number>;
  /** geographical centroid */
  centroid: [lon: number, lat: number];
};

export type County = Feature<Polygon | MultiPolygon, CountyProperties>;

type MigrationFlow = {
  source: County;
  target: County;
  /** Number of migrants */
  value: number;
  quantile: number;
};

function calculateArcs(data: County[] | undefined, selectedCounty?: County) {
  if (!data || !data.length) {
    return null;
  }
  if (!selectedCounty) {
    selectedCounty = data.find((f) => f.properties.name === "Los Angeles, CA")!;
  }
  const { flows } = selectedCounty.properties;

  const arcs: MigrationFlow[] = Object.keys(flows).map((toId) => {
    const f = data[Number(toId)];
    return {
      source: selectedCounty,
      target: f,
      value: flows[toId],
      quantile: 0,
    };
  });

  const scale = scaleQuantile()
    .domain(arcs.map((a) => Math.abs(a.value)))
    .range(inFlowColors.map((c, i) => i));

  arcs.forEach((a) => {
    a.quantile = scale(Math.abs(a.value));
  });

  return arcs;
}

function getTooltip({ object }: PickingInfo<County>) {
  return object && object.properties.name;
}

const ARC_WIDTH_MIN = 0.5;
const ARC_WIDTH_MAX = 10;
const ARC_WIDTH_STEP = 0.5;
const DEFAULT_STROKE_WIDTH = 1;

export const ArcLayerDemo = () => {
  const [selectedCounty, selectCounty] = useState<County>();
  const [arcWidth, setArcWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [data, setData] = useState<County[]>([]);

  // Fetch data
  useEffect(() => {
    fetch(DATA_URL)
      .then((resp) => resp.json())
      .then((data) => setData(data.features));
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    socket.onArcWidthUpdate((payload) => setArcWidth(payload.arc_width));
    socket.onConnect(() => {
      socket.getState().then((state) => {
        if (typeof state.arc_width === "number") setArcWidth(state.arc_width);
      });
    });
    socket.onReset(() => {
      socket.getState().then((state) => {
        if (typeof state.arc_width === "number") setArcWidth(state.arc_width);
      });
    });
    socket.onError((err) => {
      console.error("Socket error:", err);
    });

    socket.connect();
    return () => void socket.disconnect();
  }, []);

  const handleArcWidthChange = (value: number) => {
    setArcWidth(value);
    socket.emitArcWidthUpdate({ arc_width: value });
  };

  const arcs = useMemo(
    () => calculateArcs(data, selectedCounty),
    [data, selectedCounty]
  );

  const layers = [
    new GeoJsonLayer<CountyProperties>({
      id: "geojson",
      data,
      stroked: false,
      filled: true,
      getFillColor: [0, 0, 0, 0],
      onClick: ({ object }) => selectCounty(object),
      pickable: true,
    }),
    new ArcLayer<MigrationFlow>({
      id: "arc",
      data: arcs,
      getSourcePosition: (d) => d.source.properties.centroid,
      getTargetPosition: (d) => d.target.properties.centroid,
      getSourceColor: (d) =>
        (d.value > 0 ? inFlowColors : outFlowColors)[d.quantile],
      getTargetColor: (d) =>
        (d.value > 0 ? outFlowColors : inFlowColors)[d.quantile],
      getWidth: arcWidth,
    }),
  ];

  return (
    <div className="relative h-full w-full">
      <DeckGL
        layers={layers}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
      <div className="absolute bottom-10 left-4 rounded-lg border border-gray-600 bg-gray-800/90 px-4 py-3 shadow-lg backdrop-blur-sm">
        <label
          htmlFor="arc-width-slider"
          className="mb-2 block text-sm font-medium text-gray-200"
        >
          Arc width: {arcWidth.toFixed(1)}px
        </label>
        <input
          id="arc-width-slider"
          type="range"
          min={ARC_WIDTH_MIN}
          max={ARC_WIDTH_MAX}
          step={ARC_WIDTH_STEP}
          value={arcWidth}
          onChange={(e) => handleArcWidthChange(Number(e.target.value))}
          className="h-2 w-40 cursor-pointer appearance-none rounded-lg bg-gray-600 accent-blue-500"
        />
      </div>
    </div>
  );
};
