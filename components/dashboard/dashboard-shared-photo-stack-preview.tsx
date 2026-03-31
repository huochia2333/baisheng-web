import { cn } from "@/lib/utils";

export type PhotoThumbnail = {
  alt: string;
  src: string;
};

type PhotoStackPreviewProps = {
  footerLabel: string;
  thumbnails: PhotoThumbnail[];
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
  footerLabel,
  thumbnails,
}: PhotoStackPreviewProps) {
  const visibleFrames = frameClasses.map((frameClass, index) => ({
    frameClass,
    thumbnail: thumbnails[index],
    fallbackClass: fallbackFrames[index],
  }));

  return (
    <div className="absolute inset-0 p-4">
      {visibleFrames.map(({ frameClass, thumbnail, fallbackClass }, index) => (
        <div
          key={thumbnail?.src ?? `fallback-${index}`}
          className={cn(
            "absolute overflow-hidden rounded-[16px] border border-white/85 shadow-[0_14px_24px_rgba(86,103,119,0.18)]",
            frameClass,
            !thumbnail && fallbackClass,
          )}
        >
          {thumbnail ? (
            // Object URLs are rendered directly here for local preview stacking.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={thumbnail.alt}
              className="h-full w-full object-cover"
              loading="lazy"
              src={thumbnail.src}
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
