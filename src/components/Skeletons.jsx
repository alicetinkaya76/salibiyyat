/* Page-specific skeleton loading states */

export function MapSkeleton() {
  return (
    <div className="pt-14 h-screen flex bg-ink-100">
      <div className="w-80 flex-shrink-0 border-r border-gold/10 p-4 space-y-6 hidden md:block">
        <SkeletonBlock w="60%" h="14px" />
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock w="14px" h="14px" rounded />
            <SkeletonBlock w="10px" h="10px" rounded />
            <SkeletonBlock w={`${50 + Math.random() * 30}%`} h="12px" />
          </div>
        ))}
        <div className="pt-4 border-t border-gold/5">
          <SkeletonBlock w="40%" h="14px" mb="12px" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 mb-2">
              <SkeletonBlock w="14px" h="14px" rounded />
              <SkeletonBlock w={`${40 + Math.random() * 40}%`} h="12px" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-ink-200/50 animate-pulse" />
        <div className="absolute bottom-5 left-4 w-40 h-44 bg-ink-100/80 rounded-xl border border-gold/10 animate-pulse" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="pt-20 pb-8 min-h-screen bg-ink-100">
      <div className="max-w-6xl mx-auto px-6">
        <SkeletonBlock w="200px" h="28px" mb="8px" />
        <SkeletonBlock w="300px" h="16px" mb="24px" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse" style={{ animationDelay: `${i * 0.08}s` }}>
              <SkeletonBlock w="100%" h="3px" />
              <SkeletonBlock w="70%" h="16px" />
              <SkeletonBlock w="50%" h="12px" />
              <div className="flex gap-2">
                <SkeletonBlock w="60px" h="20px" rounded />
                <SkeletonBlock w="40px" h="20px" rounded />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="pt-20 pb-8 min-h-screen bg-ink-100">
      <div className="max-w-6xl mx-auto px-6">
        <SkeletonBlock w="200px" h="28px" mb="8px" />
        <SkeletonBlock w="350px" h="16px" mb="24px" />
        <div className="flex gap-2 mb-6">
          {[1,2,3,4].map(i => <SkeletonBlock key={i} w="80px" h="28px" rounded />)}
        </div>
        <div className="glass-card h-[420px] animate-pulse" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="pt-20 pb-8 min-h-screen bg-ink-100">
      <div className="max-w-4xl mx-auto px-6">
        <SkeletonBlock w="80px" h="14px" mb="16px" />
        <SkeletonBlock w="250px" h="28px" mb="8px" />
        <SkeletonBlock w="180px" h="20px" mb="24px" />
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1,2,3].map(i => <div key={i} className="glass-card p-4 h-20 animate-pulse" />)}
        </div>
        <div className="glass-card h-[300px] animate-pulse mb-6" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <SkeletonBlock key={i} w="100%" h="60px" />)}
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ w = '100%', h = '16px', mb = '0', rounded = false }) {
  return (
    <div
      className="bg-gold/[0.04] rounded animate-pulse"
      style={{
        width: w,
        height: h,
        marginBottom: mb,
        borderRadius: rounded ? '9999px' : '6px',
      }}
    />
  );
}
