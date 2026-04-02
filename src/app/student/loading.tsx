import { Skeleton } from "@/components/ui/skeleton"

export default function StudentLoading() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-6">
          <Skeleton className="h-8 w-48" />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-lg border shadow-sm flex flex-col gap-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              
              <div className="flex items-center justify-end mt-4 pt-4 border-t">
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}