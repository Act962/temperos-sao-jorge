import { createFileRoute } from "@tanstack/react-router";
import { BrandValuesBar } from "@/components/home/brand-values-bar";
import { HeroSection } from "@/components/home/hero-section";
import { ProductFamiliesSection } from "@/components/home/product-families-section";
import { RecipesPreviewSection } from "@/components/home/recipes-preview-section";
import { StorySection } from "@/components/home/story-section";
import { buildPageSeo } from "@/lib/seo";

const DESCRIPTION =
	"Temperos, chás, ervas, molhos, farinhas e grãos naturais São Jorge Alimentos. Há mais de 40 anos levando qualidade e sabor para a mesa das famílias brasileiras.";

export const Route = createFileRoute("/")({
	head: () => {
		const seo = buildPageSeo({ description: DESCRIPTION, path: "/" });
		return { meta: seo.meta, links: seo.links };
	},
	component: HomePage,
});

function HomePage() {
	return (
		<>
			{/* The visible <h1> lives inside HeroSection. */}
			<HeroSection />
			<StorySection />
			<ProductFamiliesSection />
			<RecipesPreviewSection />
			<BrandValuesBar />
		</>
	);
}
