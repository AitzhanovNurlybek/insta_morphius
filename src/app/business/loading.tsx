export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <div className="mb-6">
        <div className="skeleton h-8 w-52 rounded-lg" />
        <div className="skeleton mt-2 h-4 w-64 rounded" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel p-4">
            <div className="skeleton h-4 w-56 rounded" />
            <div className="skeleton mt-2 h-3 w-40 rounded" />
            <div className="skeleton mt-4 h-1 w-full rounded-full" />
            <div className="skeleton mt-3 h-4 w-72 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
