"use client"

import { Restaurant } from "@/types/restaurant";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RestaurantCard } from "./RestaurantCard";
import { Button } from "./ui/button";
import { Heart, X } from "lucide-react";
type Props = {
	restaurants: Restaurant[],
	onComplete: (votes: Record<string, "yes" | "no">) => void
}

export function Ballot({ restaurants, onComplete }: Props) {
	const [cards, setCards] = useState<Restaurant[]>(restaurants);
	const [votes, setVotes] = useState<Record<string, "yes" | "no">>({});
	const swipeDir = useRef<"left" | "right" | null>(null)

	useEffect(() => {
		if (cards.length == 0) {
			onComplete(votes)
		}
	}, [cards.length])

	function handleVote(cardId: string, vote: "yes" | "no") {
		if (vote == "yes") {
			swipeDir.current = "right"
		} else {
			swipeDir.current = "left"
		}
		setVotes({ ...votes, [cardId]: vote })
		setCards((cards.slice(1)))
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="relative aspect-3/4 w-full">
				<AnimatePresence custom={swipeDir.current}>
					{cards.map((card, i) => (
						<motion.div
							key={card.id}
							custom={swipeDir.current}
							drag={i === 0}
							dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
							dragElastic={0.7}
							variants={{ exit: (direction) => ({ x: direction === "left" ? -500 : 500, opacity: 0 }) }}
							animate={{ translateY: i * -4, scale: 1 - i * 0.01 }}
							transition={{ duration: 0.3 }}
							onDragEnd={(_event, info) => {
								if (info.offset.x > 100) {
									handleVote(card.id, "yes")
								} else if (info.offset.x < -100) {
									handleVote(card.id, "no")
								}
							}}
							style={{ zIndex: cards.length - i, pointerEvents: i !== 0 ? "none" : "auto" }}
							className="absolute inset-x-0"
						>
							<div className="absolute z-50 inset-x-0 top-3">
								<div className="flex gap-1 px-4 ">
									{restaurants.map((r, ri) => (
										<div key={ri} className={`h-1 flex-1 ${ri <= restaurants.length - cards.length ? 'bg-white' : 'bg-zinc-200/60'}`} />
									))}
								</div>
							</div>
							<RestaurantCard restaurant={card} />
						</motion.div>
					))}
				</AnimatePresence >
			</div>
			<div className="flex justify-around">
				<Button
					size={"icon-lg"}
					className="rounded-full  w-16 h-16"
					onClick={() => handleVote(cards[0].id, "no")}
				>
					<X className="text-red-500" />
				</Button>

				<Button
					size={"icon-lg"}
					className="rounded-full w-16 h-16"
					onClick={() => handleVote(cards[0].id, "yes")}
				>
					<Heart className="text-green-500 fill-green-500 h-25 " />
				</Button>
			</div>
		</section>
	)
}