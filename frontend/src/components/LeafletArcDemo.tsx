import type { Color } from "@deck.gl/core";
import { scaleQuantile } from "d3-scale";
import type * as GeoJSONNamespace from "geojson";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { LatLngTuple, Layer } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Polyline, TileLayer } from "react-leaflet";

import { socket } from "@/lib/sockets";
import { ArcWidthSlider } from "./ui/arc-width-slider";

import "leaflet/dist/leaflet.css";

export const DATA_URL =
  "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/arc/counties.json";

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

type CountyProperties = {
  name: string;
  flows: Record<string, number>;
  centroid: [lon: number, lat: number];
};

export type County = Feature<Polygon | MultiPolygon, CountyProperties>;

type MigrationFlow = {
  source: County;
  target: County;
  value: number;
  quantile: number;
  index: number;
};

function calculateArcs(data: County[] | undefined, selectedCounty?: County) {
  if (!data || !data.length) {
    return null;
  }
  if (!selectedCounty) {
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

const ARC_WIDTH_MIN = 0.5;
const ARC_WIDTH_MAX = 10;
const ARC_WIDTH_STEP = 0.5;
const DEFAULT_STROKE_WIDTH = 8;

const INITIAL_CENTER: LatLngTuple = [40.7, -100];

export const LeafletArcDemo = () => {
  const [selectedCounty, selectCounty] = useState<County>();
  const [arcWidth, setArcWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [data, setData] = useState<County[]>([]);
  const [visibleArcCount, setVisibleArcCount] = useState(0);
  const [serverAnimationStartTime, setServerAnimationStartTime] = useState<
    number | null
  >(null);

  useEffect(() => {
    fetch(DATA_URL).then(async (resp) => {
      const [geojson, serverState] = await Promise.all([
        resp.json(),
        socket.getState(),
      ]);
      const features: County[] = geojson.features;
      setData(features);
      const { select_county_event } = serverState;
      if (select_county_event) {
        const county = features.find(
          (f) => f.properties.name === select_county_event.county_id
        );
        if (county) {
          selectCounty(county);
          setServerAnimationStartTime(select_county_event.animation_start_time);
        }
      }
    });
  }, []);

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

  const visibleArcs = useMemo(() => {
    return arcs && visibleArcCount > 0 ? arcs.slice(0, visibleArcCount) : [];
  }, [arcs, visibleArcCount]);

  const handleCountyFeature = (feature: County, layer: Layer) => {
    layer.on("click", () => {
      socket.emitSelectCounty({ county_id: feature.properties.name });
    });
    if (feature.properties?.name) {
      layer.bindTooltip(feature.properties.name);
    }
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={INITIAL_CENTER}
        zoom={6}
        className="h-full w-full"
        style={{ background: "#080929" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.length > 0 && (
          <GeoJSON
            data={data as unknown as GeoJSONNamespace.GeoJsonObject}
            style={() => ({
              weight: 0,
              opacity: 0,
              fillOpacity: 0,
            })}
            onEachFeature={(feature: GeoJSONNamespace.Feature, layer: Layer) =>
              handleCountyFeature(feature as County, layer)
            }
          />
        )}

        {visibleArcs.map((arc) => {
          const [sourceLon, sourceLat] = arc.source.properties.centroid;
          const [targetLon, targetLat] = arc.target.properties.centroid;

          const colorArray = (arc.value > 0 ? inFlowColors : outFlowColors)[
            arc.quantile
          ];
          const color = `rgb(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]})`;

          const curvePositions = makeCurve(
            sourceLon,
            sourceLat,
            targetLon,
            targetLat,
            40,
            0.3
          );

          return (
            <Polyline
              key={arc.index}
              positions={curvePositions}
              pathOptions={{
                color,
                weight: arcWidth,
                opacity: 1,
              }}
            />
          );
        })}
      </MapContainer>

      <ArcWidthSlider
        value={arcWidth}
        min={ARC_WIDTH_MIN}
        max={ARC_WIDTH_MAX}
        step={ARC_WIDTH_STEP}
        onChange={handleArcWidthChange}
        id="leaflet-arc-width-slider"
        className="absolute bottom-10 left-4 z-1000"
      />
    </div>
  );
};

function makeCurve(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  n = 40,
  bend = 0.3
): LatLngTuple[] {
  if (sx === tx && sy === ty) {
    return [
      [sy, sx],
      [ty, tx],
    ];
  }

  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  const dx = tx - sx;
  const dy = ty - sy;
  let d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) d = 1;

  const px = -dy / d;
  const py = dx / d;

  const h = bend * d;

  const cx = mx + px * h;
  const cy = my + py * h;

  const points: LatLngTuple[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const lon = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * tx;
    const lat = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ty;
    points.push([lat, lon]);
  }

  return points;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
