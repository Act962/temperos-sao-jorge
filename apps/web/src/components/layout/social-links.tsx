import { cn } from "@my-better-t-app/ui/lib/utils";
import type { ComponentType, SVGProps } from "react";
import { SOCIAL_LINKS } from "@/data/site";

/**
 * Brand glyphs are drawn inline, transcribed from the design canvas —
 * lucide-react dropped its brand icon set, and these match the artwork exactly.
 */
type IconProps = SVGProps<SVGSVGElement>;

function InstagramIcon(props: IconProps) {
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			{...props}
		>
			<rect x="3" y="3" width="18" height="18" rx="5" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
		</svg>
	);
}

function FacebookIcon(props: IconProps) {
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 24 24"
			fill="currentColor"
			{...props}
		>
			<path d="M13.5 21v-8h2.7l.4-3h-3.1V8.2c0-.9.3-1.5 1.6-1.5h1.6V4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H7.5v3h2.8v8h3.2z" />
		</svg>
	);
}

function YoutubeIcon(props: IconProps) {
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 24 24"
			fill="currentColor"
			{...props}
		>
			<path d="M21.6 7.5a2.6 2.6 0 00-1.8-1.8C18.2 5.3 12 5.3 12 5.3s-6.2 0-7.8.4A2.6 2.6 0 002.4 7.5C2 9.1 2 12 2 12s0 2.9.4 4.5a2.6 2.6 0 001.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 001.8-1.8c.4-1.6.4-4.5.4-4.5s0-2.9-.4-4.5zM10 15.2V8.8l5.4 3.2-5.4 3.2z" />
		</svg>
	);
}

const ICONS: Record<string, ComponentType<IconProps>> = {
	instagram: InstagramIcon,
	facebook: FacebookIcon,
	youtube: YoutubeIcon,
};

interface SocialLinksProps {
	className?: string;
}

/** Social profile buttons rendered on the red footer surface. */
export function SocialLinks({ className }: SocialLinksProps) {
	return (
		<ul className={cn("flex gap-3", className)}>
			{SOCIAL_LINKS.map((link) => {
				const Icon = ICONS[link.icon];
				if (!Icon) return null;
				return (
					<li key={link.name}>
						<a
							href={link.href}
							target="_blank"
							rel="noreferrer noopener"
							aria-label={`${link.name} da São Jorge Alimentos`}
							className="flex size-[34px] items-center justify-center rounded-md bg-cream-fg/15 text-cream-fg transition-colors hover:bg-cream-fg/30"
						>
							<Icon className="size-[18px]" />
						</a>
					</li>
				);
			})}
		</ul>
	);
}
