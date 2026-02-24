import { ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { DeckGL } from "@deck.gl/react";
import { scaleQuantile } from "d3-scale";
import { useEffect, useMemo, useState } from "react";
import { Map } from "react-map-gl/maplibre";

import { socket } from "@/lib/sockets";
import { ArcWidthSlider } from "./ui/arc-width-slider";

import type { Color, MapViewState, PickingInfo } from "@deck.gl/core";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { ScaleContainer } from "./ui/scale-container";

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
  zoom: 1.5,
  maxZoom: 15,
  pitch: 0,
  bearing: 0,
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
  /** Index for staggered reveal animation */
  index: number;
};

function calculateArcs(data: County[] | undefined, selectedCounty?: County) {
  if (!data || !data.length) {
    return null;
  }
  if (!selectedCounty) {
    // selectedCounty = data.find((f) => f.properties.name === "Los Angeles, CA")!;
    return null;
  }
  const { flows } = selectedCounty.properties;

  const arcs: MigrationFlow[] = Object.keys(flows).map((toId, index) => {
    const f = data[Number(toId)];
    return {
      source: selectedCounty,
      target: f,
      value: flows[toId],
      quantile: 0,
      index,
    };
  });

  const scale = scaleQuantile()
    .domain(arcs.map((a) => Math.abs(a.value)))
    .range(inFlowColors.map((_, i) => i));

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
  /** Number of arcs to show; animates from 0 to arcs.length for staggered reveal */
  const [visibleArcCount, setVisibleArcCount] = useState(0);
  /** Server-provided animation start time (ms); used so all clients stay in sync */
  const [serverAnimationStartTime, setServerAnimationStartTime] = useState<
    number | null
  >(null);

  // Fetch data
  useEffect(() => {
    fetch(DATA_URL).then(async (resp) => {
      const [data, serverState] = await Promise.all([
        resp.json(),
        socket.getState(),
      ]);
      setData(data.features);
      const { select_county_event } = serverState;
      if (select_county_event) {
        selectCounty(
          data.features.find(
            (f) => f.properties.name === select_county_event.county_id
          )
        );
        setServerAnimationStartTime(select_county_event.animation_start_time);
      }
    });
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    socket.onArcWidthUpdate((payload) => setArcWidth(payload.arc_width));
    socket.onSelectCounty((payload) => {
      const county = data.find((f) => f.properties.name === payload.county_id);
      if (county) {
        selectCounty(county);
        setServerAnimationStartTime(payload.animation_start_time);
      }
    });
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
  }, [data]);

  const handleArcWidthChange = (value: number) => {
    setArcWidth(value);
    socket.emitArcWidthUpdate({ arc_width: value });
  };

  const arcs = useMemo(
    () => calculateArcs(data, selectedCounty),
    [data, selectedCounty]
  );

  useEffect(() => {
    if (!arcs || arcs.length === 0) {
      setVisibleArcCount(0);
      return;
    }
    const startTime = serverAnimationStartTime ?? Date.now();
    const total = arcs.length;

    let rafId: number;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const elapsed = Date.now() - startTime;
      const count = clamp(Math.floor(elapsed / 50), 0, total);
      setVisibleArcCount(count);
      if (count >= total) cancelAnimationFrame(rafId);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [arcs, serverAnimationStartTime]);

  // Only pass arcs that should be visible so the layer actually draws them
  const visibleArcs = useMemo(() => {
    return arcs && visibleArcCount > 0 ? arcs.slice(0, visibleArcCount) : [];
  }, [arcs, visibleArcCount]);

  const layers = [
    new GeoJsonLayer<CountyProperties>({
      id: "geojson",
      data,
      stroked: false,
      filled: true,
      getFillColor: [0, 0, 0, 0],
      onClick: ({ object }) => {
        socket.emitSelectCounty({ county_id: object.properties.name });
      },
      pickable: true,
    }),
    new ArcLayer<MigrationFlow>({
      id: "arc",
      data: visibleArcs,
      getSourcePosition: (d) => d.source.properties.centroid,
      getTargetPosition: (d) => d.target.properties.centroid,
      getSourceColor: (d) => {
        const c = (d.value > 0 ? inFlowColors : outFlowColors)[d.quantile];
        return [c[0], c[1], c[2], 255];
      },
      getTargetColor: (d) => {
        const c = (d.value > 0 ? outFlowColors : inFlowColors)[d.quantile];
        return [c[0], c[1], c[2], 255];
      },
      getWidth: arcWidth,
    }),
  ];

  return (
    <div className="relative h-full w-full">
      <ScaleContainer maxLongSide={2500}>
        {({ ref, styles }) => (
          <div
            data-testid="deckgl-container"
            ref={ref}
            style={{ ...styles, position: "relative" }}
          >
            <DeckGL
              layers={layers}
              initialViewState={INITIAL_VIEW_STATE}
              controller={true}
              getTooltip={getTooltip}
            >
              <Map reuseMaps mapStyle={MAP_STYLE} />
            </DeckGL>
          </div>
        )}
      </ScaleContainer>

      <ArcWidthSlider
        value={arcWidth}
        min={ARC_WIDTH_MIN}
        max={ARC_WIDTH_MAX}
        step={ARC_WIDTH_STEP}
        onChange={handleArcWidthChange}
        id="arc-width-slider"
        className="absolute bottom-10 left-4"
      />
    </div>
  );
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
