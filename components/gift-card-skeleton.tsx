import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function GiftCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex sm:flex-col">
        <Skeleton className="w-24 h-24 sm:w-full sm:aspect-square flex-shrink-0" />
        <CardContent className="p-2.5 sm:p-4 flex-1">
          <Skeleton className="h-4 sm:h-5 w-3/4 mb-1 sm:mb-2" />
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
            <Skeleton className="h-4 sm:h-5 w-12 sm:w-16" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
          </div>
          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
        </CardContent>
      </div>
    </Card>
  )
}
