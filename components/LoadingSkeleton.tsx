import React from "react";

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-3 w-1/3 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-20 bg-muted rounded-full" />
        <div className="h-4 w-4 bg-muted rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
          <div className="space-y-2 flex-1 mr-4">
            <div className="h-4 w-1/4 bg-muted rounded" />
            <div className="h-3 w-1/3 bg-muted rounded" />
          </div>
          <div className="h-6 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
