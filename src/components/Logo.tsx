import logoAsset from "@/assets/career-compass-logo.jpg.asset.json";

export const logoUrl = logoAsset.url;

export function Logo({ className = "h-9 w-9", alt = "Career Compass" }: { className?: string; alt?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt={alt}
      className={`${className} rounded-lg object-contain bg-[#c9f64a] p-0.5`}
    />
  );
}
