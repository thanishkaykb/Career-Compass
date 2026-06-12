export const logoUrl = "/career-compass-logo.png";

export function Logo({ className = "h-9 w-9", alt = "Career Compass" }: { className?: string; alt?: string }) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      loading="eager"
      className={`${className} rounded-lg object-contain bg-[#CDFC6A] p-0.5`}
    />
  );
}
