import { Star } from 'lucide-react';

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse px-1">
      {/* Categories Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100">
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0" />
            <div className="flex flex-col flex-grow py-1 gap-2">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-3/4 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-50 rounded mt-1" />
              <div className="flex justify-between items-center mt-auto">
                <div className="h-6 w-16 bg-gray-100 rounded" />
                <div className="h-8 w-24 bg-gray-100 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
