"use client";

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  createUserMediaAssetPreviewUrl,
  type UserMediaAssetWithPreview,
} from "@/lib/user-self-service";

type PreviewAsset = Pick<
  UserMediaAssetWithPreview,
  "bucket_name" | "id" | "original_name" | "previewUrl" | "storage_path"
>;

type LazyDashboardImagePreviewProps = {
  alt?: string;
  asset: PreviewAsset;
  className?: string;
  errorFallback?: ReactNode;
  imageClassName?: string;
  loadingFallback?: ReactNode;
  rootMargin?: string;
};

type LazyDashboardVideoPreviewProps = {
  asset: PreviewAsset;
  className?: string;
  controls?: boolean;
  errorFallback?: ReactNode;
  loadingFallback?: ReactNode;
  preload?: "auto" | "metadata" | "none";
  rootMargin?: string;
  videoClassName?: string;
};

type PreviewStatus = "error" | "idle" | "loading" | "ready";
type PreviewState = {
  assetId: string;
  previewStatus: PreviewStatus;
  previewUrl: string | null;
};

export function LazyDashboardImagePreview({
  alt,
  asset,
  className,
  errorFallback = null,
  imageClassName,
  loadingFallback = null,
  rootMargin = "200px",
}: LazyDashboardImagePreviewProps) {
  const { previewUrl, previewStatus, ref } = useLazyDashboardMediaPreview(
    asset,
    rootMargin,
  );

  return (
    <div className={className} ref={ref}>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt ?? asset.original_name}
          className={imageClassName}
          loading="lazy"
          src={previewUrl}
        />
      ) : previewStatus === "error" ? (
        errorFallback
      ) : (
        loadingFallback
      )}
    </div>
  );
}

export function LazyDashboardVideoPreview({
  asset,
  className,
  controls = true,
  errorFallback = null,
  loadingFallback = null,
  preload = "metadata",
  rootMargin = "200px",
  videoClassName,
}: LazyDashboardVideoPreviewProps) {
  const { previewUrl, previewStatus, ref } = useLazyDashboardMediaPreview(
    asset,
    rootMargin,
  );

  return (
    <div className={className} ref={ref}>
      {previewUrl ? (
        <video
          className={videoClassName}
          controls={controls}
          preload={preload}
          src={previewUrl}
        />
      ) : previewStatus === "error" ? (
        errorFallback
      ) : (
        loadingFallback
      )}
    </div>
  );
}

function useLazyDashboardMediaPreview(asset: PreviewAsset, rootMargin: string) {
  const [previewState, setPreviewState] = useState(() => createPreviewState(asset));
  const ref = useRef<HTMLDivElement>(null);
  const resolvedPreviewState =
    previewState.assetId === asset.id ? previewState : createPreviewState(asset);
  const { previewStatus, previewUrl } = resolvedPreviewState;

  const resolvePreviewUrl = useEffectEvent(async () => {
    if (previewUrl || previewStatus === "loading" || previewStatus === "ready") {
      return;
    }

    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setPreviewState((current) => ({
        ...resolvePreviewStateForAsset(current, asset),
        previewStatus: "error",
      }));
      return;
    }

    setPreviewState((current) => ({
      ...resolvePreviewStateForAsset(current, asset),
      previewStatus: "loading",
    }));

    const nextPreviewUrl = await createUserMediaAssetPreviewUrl(supabase, asset);

    if (nextPreviewUrl) {
      setPreviewState({
        assetId: asset.id,
        previewStatus: "ready",
        previewUrl: nextPreviewUrl,
      });
      return;
    }

    setPreviewState((current) => ({
      ...resolvePreviewStateForAsset(current, asset),
      previewStatus: "error",
    }));
  });

  useEffect(() => {
    if (previewUrl || previewStatus === "loading" || previewStatus === "ready") {
      return;
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      void resolvePreviewUrl();
      return;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        observer.disconnect();

        if (!cancelled) {
          void resolvePreviewUrl();
        }
      },
      {
        rootMargin,
      },
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [asset.id, previewStatus, previewUrl, rootMargin]);

  return {
    previewStatus,
    previewUrl,
    ref,
  };
}

function createPreviewState(asset: PreviewAsset): PreviewState {
  return {
    assetId: asset.id,
    previewStatus: asset.previewUrl ? "ready" : "idle",
    previewUrl: asset.previewUrl ?? null,
  };
}

function resolvePreviewStateForAsset(
  current: PreviewState,
  asset: PreviewAsset,
): PreviewState {
  return current.assetId === asset.id ? current : createPreviewState(asset);
}
