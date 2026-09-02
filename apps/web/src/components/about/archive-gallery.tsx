import { PhotoFrame } from "@/components/ui/photo-frame";

interface ArchivePhoto {
	readonly src: string;
	readonly alt: string;
	readonly hint: string;
	readonly wide?: boolean;
}

const PHOTOS: readonly ArchivePhoto[] = [
	{
		src: "/images/sobre/frota-antiga.jpg",
		alt: "Frota antiga de caminhões da São Jorge Alimentos",
		hint: "Foto de arquivo: frota antiga",
		wide: true,
	},
	{
		src: "/images/sobre/arquivo-1.jpg",
		alt: "Registro do arquivo histórico da São Jorge Alimentos",
		hint: "Foto de arquivo",
	},
	{
		src: "/images/sobre/arquivo-2.jpg",
		alt: "Registro do arquivo histórico da São Jorge Alimentos",
		hint: "Foto de arquivo",
	},
];

/** Sepia-toned archive mosaic beside the company story. */
export function ArchiveGallery() {
	return (
		<div className="grid grid-cols-2 grid-rows-[200px_150px] gap-3.5">
			{PHOTOS.map((photo) => (
				<div
					key={photo.src}
					className={`overflow-hidden rounded-md [filter:grayscale(1)_sepia(0.2)] ${
						photo.wide ? "col-span-2" : ""
					}`}
				>
					<PhotoFrame src={photo.src} alt={photo.alt} hint={photo.hint} />
				</div>
			))}
		</div>
	);
}
