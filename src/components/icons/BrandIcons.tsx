import React from "react";
import {
  SiFacebook,
  SiWhatsapp,
  SiTelegram,
  SiDiscord,
  SiTiktok,
  SiYoutube,
  SiLine,
  SiGoogle,
  SiApple,
  SiStripe,
  SiGithub,
  SiInstagram,
  SiX,
  type IconType,
} from "@icons-pack/react-simple-icons";

// Re-export standard icons
export {
  SiFacebook,
  SiWhatsapp,
  SiTelegram,
  SiDiscord,
  SiTiktok,
  SiYoutube,
  SiLine,
  SiGoogle,
  SiApple,
  SiStripe,
  SiGithub,
  SiInstagram,
  SiX,
};

// Interface for Lucide-compatible props
export interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

/**
 * Facebook Official Brand Icon
 */
export function BrandFacebook({ size = 20, color = "#1877F2", className, ...props }: BrandIconProps) {
  return <SiFacebook size={size} color={color} className={className} {...props} />;
}

/**
 * WhatsApp Official Brand Icon
 */
export function BrandWhatsapp({ size = 20, color = "#25D366", className, ...props }: BrandIconProps) {
  return <SiWhatsapp size={size} color={color} className={className} {...props} />;
}

/**
 * Telegram Official Brand Icon
 */
export function BrandTelegram({ size = 20, color = "#24A1DE", className, ...props }: BrandIconProps) {
  return <SiTelegram size={size} color={color} className={className} {...props} />;
}

/**
 * Discord Official Brand Icon
 */
export function BrandDiscord({ size = 20, color = "#5865F2", className, ...props }: BrandIconProps) {
  return <SiDiscord size={size} color={color} className={className} {...props} />;
}

/**
 * LINE Official Brand Icon
 */
export function BrandLine({ size = 20, color = "#06C755", className, ...props }: BrandIconProps) {
  return <SiLine size={size} color={color} className={className} {...props} />;
}

/**
 * Google Official Brand Icon
 */
export function BrandGoogle({ size = 20, color = "#4285F4", className, ...props }: BrandIconProps) {
  return <SiGoogle size={size} color={color} className={className} {...props} />;
}

/**
 * Apple Official Brand Icon
 */
export function BrandApple({ size = 20, color = "currentColor", className, ...props }: BrandIconProps) {
  return <SiApple size={size} color={color} className={className} {...props} />;
}

/**
 * Stripe Official Brand Icon
 */
export function BrandStripe({ size = 20, color = "#635BFF", className, ...props }: BrandIconProps) {
  return <SiStripe size={size} color={color} className={className} {...props} />;
}

/**
 * TikTok Official Brand Icon
 */
export function BrandTiktok({ size = 20, color = "currentColor", className, ...props }: BrandIconProps) {
  return <SiTiktok size={size} color={color} className={className} {...props} />;
}

/**
 * YouTube Official Brand Icon
 */
export function BrandYoutube({ size = 20, color = "#FF0000", className, ...props }: BrandIconProps) {
  return <SiYoutube size={size} color={color} className={className} {...props} />;
}

/**
 * GitHub Official Brand Icon
 */
export function BrandGithub({ size = 20, color = "currentColor", className, ...props }: BrandIconProps) {
  return <SiGithub size={size} color={color} className={className} {...props} />;
}

/**
 * Instagram Official Brand Icon
 */
export function BrandInstagram({ size = 20, color = "#E4405F", className, ...props }: BrandIconProps) {
  return <SiInstagram size={size} color={color} className={className} {...props} />;
}
