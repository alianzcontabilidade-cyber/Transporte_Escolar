import { useLoading } from '../lib/loadingContext';

export default function LoadingOverlay() {
  const { loading } = useLoading();

  if (!loading.visible) return null;

  const isIndeterminate = loading.progress === undefined;
  const progress = loading.progress ?? 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-[340px] flex flex-col items-center gap-5">
        {/* Road + Bus animation */}
        <div className="w-full h-24 relative overflow-hidden">
          {/* Sky gradient */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 dark:from-sky-900 dark:via-sky-800 dark:to-green-900" />

          {/* Clouds */}
          <div className="absolute top-2 loading-cloud">
            <div className="w-8 h-3 bg-white/70 dark:bg-white/20 rounded-full" />
          </div>
          <div className="absolute top-4 loading-cloud-slow">
            <div className="w-6 h-2.5 bg-white/50 dark:bg-white/15 rounded-full" />
          </div>

          {/* Trees */}
          <div className="absolute bottom-[26px] loading-trees">
            {[0, 50, 110, 170, 230, 290, 350].map((x, i) => (
              <div key={i} className="absolute" style={{ left: x }}>
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[14px] border-transparent border-b-green-500 dark:border-b-green-700" style={{ marginLeft: -2 }} />
                <div className="w-1.5 h-2 bg-amber-700 dark:bg-amber-900 mx-auto" style={{ marginTop: -1 }} />
              </div>
            ))}
          </div>

          {/* Road */}
          <div className="absolute bottom-0 left-0 right-0 h-7 bg-gray-600 dark:bg-gray-700 rounded-b-xl">
            {/* Road markings - animated */}
            <div className="absolute top-1/2 -translate-y-1/2 flex gap-4 loading-road-marks">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-5 h-1 bg-yellow-400 rounded-full flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Bus - positioned based on progress or bouncing */}
          <div
            className={`absolute bottom-4 transition-all duration-500 ease-out ${isIndeterminate ? 'loading-bus-bounce' : ''}`}
            style={!isIndeterminate ? { left: `${Math.min(progress, 92) * 0.85 + 5}%` } : undefined}
          >
            <svg width="52" height="36" viewBox="0 0 52 36" fill="none" className="loading-bus-tilt drop-shadow-md">
              {/* Bus body */}
              <rect x="2" y="6" width="46" height="22" rx="4" fill="#f59e0b" />
              {/* Roof */}
              <rect x="4" y="4" width="42" height="5" rx="2.5" fill="#fbbf24" />
              {/* Windows */}
              <rect x="7" y="10" width="9" height="7" rx="1.5" fill="#fef3c7" stroke="#e8930a" strokeWidth="0.7" />
              <rect x="19" y="10" width="9" height="7" rx="1.5" fill="#fef3c7" stroke="#e8930a" strokeWidth="0.7" />
              <rect x="31" y="10" width="9" height="7" rx="1.5" fill="#fef3c7" stroke="#e8930a" strokeWidth="0.7" />
              {/* Door */}
              <rect x="42" y="12" width="4" height="11" rx="1" fill="#fbbf24" stroke="#e8930a" strokeWidth="0.5" />
              {/* Headlight */}
              <circle cx="48" cy="24" r="2" fill="#fef08a" />
              {/* Tail light */}
              <circle cx="4" cy="24" r="1.5" fill="#ef4444" />
              {/* Bumper */}
              <rect x="1" y="26" width="50" height="2" rx="1" fill="#d1d5db" />
              {/* Wheels */}
              <circle cx="14" cy="30" r="4" fill="#374151" className="loading-wheel" />
              <circle cx="14" cy="30" r="2" fill="#9ca3af" />
              <circle cx="38" cy="30" r="4" fill="#374151" className="loading-wheel" />
              <circle cx="38" cy="30" r="2" fill="#9ca3af" />
              {/* Exhaust smoke */}
              <g className="loading-smoke">
                <circle cx="-2" cy="22" r="2" fill="#d1d5db" opacity="0.5" />
                <circle cx="-5" cy="20" r="1.5" fill="#d1d5db" opacity="0.3" />
              </g>
            </svg>
          </div>
        </div>

        {/* Progress bar (road-style) */}
        <div className="w-full">
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
            {isIndeterminate ? (
              <div className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-full loading-indeterminate" />
            ) : (
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
          {!isIndeterminate && (
            <p className="text-xs text-gray-400 text-right mt-1 font-mono">{Math.round(progress)}%</p>
          )}
        </div>

        {/* Message */}
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
          {loading.message}
        </p>
      </div>
    </div>
  );
}
