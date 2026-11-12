import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-surface-container-high rounded-xl ${className}`} />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      {/* Greeting Skeleton */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-36" />
          <SkeletonBox className="h-4 w-52" />
        </div>
        <SkeletonBox className="h-6 w-24 rounded-full" />
      </div>

      {/* Hero Card Skeleton */}
      <div className="p-5 rounded-2xl bg-surface-container space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-5 w-20 rounded-md" />
        </div>
        <SkeletonBox className="h-9 w-48" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <SkeletonBox className="h-20 rounded-xl" />
          <SkeletonBox className="h-20 rounded-xl" />
        </div>
      </div>

      {/* Period Filter Skeleton */}
      <SkeletonBox className="h-10 w-full rounded-xl" />

      {/* Cashflow Chart Skeleton */}
      <div className="p-5 rounded-2xl bg-surface-container space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-5 w-32" />
          <SkeletonBox className="h-4 w-24" />
        </div>
        <SkeletonBox className="h-36 w-full rounded-xl" />
      </div>

      {/* Ratio & Health Skeletons */}
      <div className="p-5 rounded-2xl bg-surface-container space-y-3">
        <SkeletonBox className="h-5 w-36" />
        <div className="flex items-center space-x-4">
          <SkeletonBox className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="p-4 rounded-2xl bg-surface-container space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-5 w-36" />
          <SkeletonBox className="h-4 w-16" />
        </div>
        <SkeletonBox className="h-14 w-full rounded-xl" />
        <SkeletonBox className="h-14 w-full rounded-xl" />
        <SkeletonBox className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
};

