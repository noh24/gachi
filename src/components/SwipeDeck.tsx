"use client"

import { Restaurant } from "@/types/restaurant"
import { useState } from "react";
import RestaurantCard from "./RestaurantCard";
import { motion } from "framer-motion";

type Props = {
	restaurants: Restaurant[]
}

export default function SwipeDeck({ restaurants }: Props) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [votes, setVotes] = useState<Record<string, "yes" | "no">>({});
	const [exit, setExit] = useState({ x: 0, y: 0 });

	if (currentIndex >= restaurants.length) {
		return (
			<div>
				{Object.entries(votes).map(([id, vote]) => {
					const restaurant = restaurants.find(r => r.id === id);

					return <p key={id}>{restaurant?.name}: {vote}</p>
				})}
			</div>
		)
	}

	return (
		<motion.div
			drag={true}
			dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
			dragElastic={0.7}
			animate={{ x: exit.x, y: exit.y }}
			transition={{ duration: 0.3 }}
			onAnimationComplete={() => {
				if (exit.x !== 0) {
					setExit({ x: 0, y: 0 })
					setCurrentIndex(currentIndex + 1)
				}
			}}
			onDragEnd={(event, info) => {
				if (info.offset.x > 100) {
					setVotes({ ...votes, [restaurants[currentIndex].id]: "yes" })
					setExit({ x: 500, y: -250 })
				} else if (info.offset.x < -100) {
					setVotes({ ...votes, [restaurants[currentIndex].id]: "no" })
					setExit({ x: -500, y: -250 })
				}
			}}
		>
			<RestaurantCard restaurant={restaurants[currentIndex]} />
		</motion.div>
	)
}