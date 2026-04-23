"use client"

import { Restaurant } from "@/types/restaurant";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RestaurantCard } from "./RestaurantCard";
import { Button } from "./ui/button";
import { Heart, X } from "lucide-react";
import { SwipeCard, SwipeCardRef } from "./SwipeCard";

type Props = {
	restaurants: Restaurant[],
	onComplete: (votes: Record<string, "yes" | "no">) => void
}

export function Ballot({ restaurants, onComplete }: Props) {
	const cardRefs = useRef(new Map<string, SwipeCardRef>());

	const triggerVote = (vote: "yes" | "no") => {
		cardRefs.current.get(cards[0].id)?.swipe(vote === "yes" ? "right" : "left");
	}

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
						<SwipeCard
							ref={(r) => {
								if (r) cardRefs.current.set(card.id, r)
									else cardRefs.current.delete(card.id)
							}}
							key={card.id}
							index={i}
							voteCount={restaurants.length - cards.length}
							totalCards={restaurants.length}
							card={card}
							swipeDir={swipeDir.current}
							onVote={handleVote}
						/>
					))}
				</AnimatePresence >
			</div>
			<div className="flex justify-around">
				<Button
					size={"icon-lg"}
					className="rounded-full  w-16 h-16"
					onClick={() => triggerVote("no")}
				>
					<X className="text-red-500" />
				</Button>

				<Button
					size={"icon-lg"}
					className="rounded-full w-16 h-16"
					onClick={() => triggerVote("yes")}
				>
					<Heart className="text-green-500 fill-green-500 h-25 " />
				</Button>
			</div>
		</section>
	)
}

