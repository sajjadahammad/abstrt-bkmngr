import { BookmarkSkeleton } from '@/components/bookmark-skeleton'
import { Bookmark, LayoutGrid, Star } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar skeleton */}
            <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                        <Bookmark className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-sidebar-foreground">
                        Smart Bookmark
                    </span>
                </div>

                {/* Nav skeleton */}
                <nav className="flex-1 overflow-y-auto px-3 py-2">
                    <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                        Library
                    </p>
                    <div className="flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent px-2.5 py-2 text-sm text-sidebar-foreground">
                        <LayoutGrid className="h-4 w-4" />
                        All Bookmarks
                    </div>
                    <div className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/70">
                        <Star className="h-4 w-4" />
                        Favorites
                    </div>

                    <div className="mt-5">
                        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                            Collections
                        </p>
                        <div className="space-y-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                                    <div className="h-3 w-3 animate-pulse rounded-sm bg-secondary" />
                                    <div className="h-3.5 w-24 animate-pulse rounded bg-secondary" />
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User skeleton */}
                <div className="border-t border-sidebar-border p-3">
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <div className="h-7 w-7 animate-pulse rounded-full bg-secondary" />
                        <div className="h-3.5 w-28 animate-pulse rounded bg-secondary" />
                    </div>
                </div>
            </aside>

            {/* Main content skeleton */}
            <main className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <div className="h-6 w-36 animate-pulse rounded bg-secondary" />
                        <div className="mt-1 h-3.5 w-20 animate-pulse rounded bg-secondary" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-64 animate-pulse rounded-lg bg-secondary" />
                        <div className="h-9 w-20 animate-pulse rounded-lg bg-primary/30" />
                    </div>
                </header>

                {/* Bookmark grid skeleton */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <BookmarkSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
