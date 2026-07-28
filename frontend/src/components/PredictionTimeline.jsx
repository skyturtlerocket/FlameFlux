import React, { useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { getIsochroneColor, parseUtcTimestamp } from '../utils/helpers';

const hourLayer = (hour) => `predicted_reach_h${String(hour).padStart(2, '0')}`;

// valid_at_utc is UTC but arrives without a zone designator, so it must go
// through parseUtcTimestamp — plain `new Date()` would read it as local time
// and label every forecast hour with the viewer's UTC offset baked in.
const formatLocal = (isoString) => {
  const date = parseUtcTimestamp(isoString);
  if (!date) return null;
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

// Bottom-of-map scrubber/playback control for the arrival_run hourly
// isochrone forecast: a 1..`hours` range slider, play/pause, the selected
// hour's real timestamp (from the feature's own valid_at_utc), and a
// yellow -> dark-red legend matching the isochrone band colors on the map.
const PredictionTimeline = ({ featureCollection, currentHour, hours, isPlaying, onScrub, onTogglePlay }) => {
  const currentTimestamp = useMemo(() => {
    if (!featureCollection) return null;
    const feature = featureCollection.features.find(
      (f) => f.properties.layer === hourLayer(currentHour)
    );
    return feature?.properties?.valid_at_utc || null;
  }, [featureCollection, currentHour]);

  const label = formatLocal(currentTimestamp);

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:left-4 sm:right-4 z-[1000] bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 shadow-xl border border-gray-600">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-orange-600 hover:bg-orange-500 text-white transition-colors"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <input
          type="range"
          min={1}
          max={hours}
          step={1}
          value={currentHour}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="flex-1 accent-orange-500 cursor-pointer"
          aria-label="Forecast hour"
        />

        <div className="shrink-0 text-right text-xs sm:text-sm w-28 sm:w-40">
          {/* Mono + tabular so the readout doesn't reflow while scrubbing/playing. */}
          <div className="font-semibold text-white tabular">+{currentHour}h</div>
          <div className="text-gray-400 truncate tabular">{label || '—'}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
        <span>Soon</span>
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{
            background: `linear-gradient(to right, ${getIsochroneColor(0)}, ${getIsochroneColor(0.5)}, ${getIsochroneColor(1)})`,
          }}
        />
        <span>24h since last update</span>
      </div>
    </div>
  );
};

export default PredictionTimeline;
