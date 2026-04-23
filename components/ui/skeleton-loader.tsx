import { cn } from "@/lib/cn";

interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return <div className={cn("skeleton", className)} />;
}
