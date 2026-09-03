/**
 * Скелет вместо пустого экрана при переходе. Ожидание без отклика читается
 * как «не нажалось», и человек жмёт второй раз.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <div className="mb-6">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="skeleton mt-2 h-4 w-72 rounded" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel p-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton mt-3 h-7 w-12 rounded" />
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel flex items-center gap-4 p-4">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton mt-2 h-3 w-64 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
