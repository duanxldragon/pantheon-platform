"use client";

import * as React from "react";

import { cn } from "./utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Avatar({
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

function AvatarImage({
  className,
  ...props
}: AvatarImageProps) {
  const [error, setError] = React.useState(false);

  if (error) return null;

  return (
    <img
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      onError={() => setError(true)}
      {...props}
    />
  );
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

function AvatarFallback({
  className,
  ...props
}: AvatarFallbackProps) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
