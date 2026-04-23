"use client"

import { Restaurant } from "@/types/restaurant"
import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { RestaurantCard } from "./RestaurantCard"
import { forwardRef, useImperativeHandle } from "react";

export interface SwipeCardRef {
	swipe: (dir: "left" | "right") => void;
}

type Props = {
	index: number,
	voteCount: number,
	totalCards: number
	card: Restaurant,
	swipeDir: "left" | "right" | null
	onVote: (cardId: string, vote: "yes" | "no") => void
}

export const SwipeCard = forwardRef<SwipeCardRef, Props>(({ index, voteCount, totalCards, card, swipeDir, onVote }: Props, ref) => {
	const x = useMotionValue(0)

	const greenOpacity = useTransform(x, [0, 100], [0, 1])
	const redOpacity = useTransform(x, [-100, 0], [1, 0])

	useImperativeHandle(ref, () => ({
		swipe: (dir) => {
			const target = dir === "right" ? 100 : -100
			animate(x, target, { duration: 0.2 }).then(() => {
				onVote(card.id, dir === "right" ? "yes" : "no")
			})
		}
	}))

	return (
		<motion.div
			custom={swipeDir}
			drag={index === 0}
			dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
			dragElastic={0.7}
			variants={{ exit: (direction) => ({ x: direction === "left" ? -500 : 500, opacity: 0 }) }}
			animate={{ translateY: index * -4, scale: 1 - index * 0.01 }}
			transition={{ duration: 0.3 }}
			onDrag={(_event, info) => {
				x.set(info.offset.x)
			}}
			onDragEnd={(_event, info) => {
				if (info.offset.x > 100) {
					onVote(card.id, "yes")
				} else if (info.offset.x < -100) {
					onVote(card.id, "no")
				} else {
					x.set(0)
				}
			}}
			style={{ zIndex: totalCards - index, pointerEvents: index !== 0 ? "none" : "auto" }}
			className="absolute inset-x-0"
		>
			<motion.div
				className="absolute z-50 inset-0 rounded-2xl bg-radial-[230%_180%_at_115%_50%] from-transparent from-40% via-red-500/40 via-50% to-transparent to-60%"
				style={{ opacity: redOpacity }}
			/>
			<motion.div
				className="absolute z-50 inset-0 rounded-2xl bg-radial-[230%_180%_at_-15%_50%] from-transparent from-40% via-green-500/40 via-50% to-transparent to-60%"
				style={{ opacity: greenOpacity }}
			/>
			<div className="absolute z-50 inset-x-0 top-3">
				<div className="flex gap-1 px-4 ">
					{Array.from({ length: totalCards }, (_, i) => (
						<div key={card.name + i} className={`h-1 flex-1 ${i <= voteCount ? 'bg-white' : 'bg-zinc-200/60'}`} />
					))}
				</div>
			</div>
			<RestaurantCard restaurant={card} />
		</motion.div>
	)
})
