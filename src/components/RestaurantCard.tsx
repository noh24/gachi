import { Restaurant } from "@/types/restaurant"
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

type Props = {
	restaurant: Restaurant
}

export default function RestaurantCard({ restaurant }: Props) {
	return (
		<div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden shadow-xl">
			<Image
				src={restaurant.imageUrl}
				alt={`Picture of ${restaurant.name}`}
				fill
				loading="eager"
				className="object-cover"
			/>

			<div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />

			<div className="absolute bottom-0 p-5 flex flex-col gap-1">
				<h2 className="text-3xl font-bold text-white">{restaurant.name}</h2>
				<div className="flex gap-1">
					<Badge variant="outline" >{restaurant.priceLevel}</Badge>
					<Badge variant="outline" >{restaurant.cuisine}</Badge>
				</div>
			</div>
		</div>
	)
}