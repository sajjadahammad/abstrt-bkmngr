export function BookmarkSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {/* Image placeholder */}
            <div className="aspect-video animate-pulse bg-secondary" />

            {/* Content */}
            <div className="flex flex-1 flex-col gap-3 p-3.5">
                <div className="flex items-start gap-2.5">
                    {/* Favicon */}
                    <div className="mt-0.5 h-4 w-4 animate-pulse rounded-sm bg-secondary" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Title */}
                        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                        {/* Domain */}
                        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                </div>

                {/* Tags */}
                <div className="flex gap-1.5">
                    <div className="h-5 w-14 animate-pulse rounded-md bg-secondary" />
                    <div className="h-5 w-10 animate-pulse rounded-md bg-secondary" />
                    <div className="h-5 w-12 animate-pulse rounded-md bg-secondary" />
                </div>
            </div>
        </div>
    )
}
