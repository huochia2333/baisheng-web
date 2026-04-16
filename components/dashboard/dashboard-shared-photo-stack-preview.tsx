import type { UserMediaAssetWithPreview } from "@/lib/user-self-service";
import { cn } from "@/lib/utils";
import { LazyDashboardImagePreview } from "./dashboard-media-preview";

type PhotoStackPreviewProps = {
  assets: UserMediaAssetWithPreview[];
  footerLabel: string;
};

const fallbackFrames = [
  "bg-[linear-gradient(135deg,#d7e3d8_0%,#9fb59d_100%)]",
  "bg-[linear-gradient(135deg,#f7e8c9_0%,#ddc19d_100%)]",
  "bg-[linear-gradient(135deg,#d7e3ec_0%,#93aabd_100%)]",
];

const frameClasses = [
  "left-5 top-7 h-[58%] w-[42%] rotate-[-9deg]",
  "left-[34%] top-5 z-10 h-[62%] w-[44%] rotate-[6deg]",
  "left-[20%] top-[24%] z-20 h-[60%] w-[48%] rotate-[-2deg]",
];

export function PhotoStackPreview({
  assets,
  footerLabel,
}: PhotoStackPreviewProps) {
  const visibleFrames = frameClasses.map((frameClass, index) => ({
    frameClass,
    thumbnail: assets[index],
    fallbackClass: fallbackFrames[index],
  }));

  return (
    <div className="absolute inset-0 p-4">
      {visibleFrames.map(({ frameClass, thumbnail, fallbackClass }, index) => (
        <div
          key={thumbnail?.id ?? `fallback-${index}`}
          className={cn(
            "absolute overflow-hidden rounded-[16px] border border-white/85 shadow-[0_14px_24px_rgba(86,103,119,0.18)]",
            frameClass,
            thumbnail ? "bg-[#e8e3dc]" : fallbackClass,
          )}
        >
          {thumbnail ? (
            <LazyDashboardImagePreview
              alt={thumbnail.original_name}
              asset={thumbnail}
              className="h-full w-full"
              imageClassName="h-full w-full object-cover"
              loadingFallback={<div className="h-full w-full bg-[#e8e3dc]" />}
            />
          ) : null}
        </div>
      ))}

      <div className="absolute inset-x-4 bottom-4 z-30 flex justify-end rounded-[14px] bg-white/78 px-4 py-3 backdrop-blur-sm">
        <span className="text-xs font-medium text-[#7b858d]">{footerLabel}</span>
      </div>
    </div>
  );
}
