'use client';

import { Restaurant } from '@/types/restaurant';
import { Direction, Vote } from '@/types/swipeActions';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { memo, useEffect, useRef } from 'react';
import { RestaurantCard } from './RestaurantCard';

type Props = {
	index: number;
	voteCount: number;
	totalCards: number;
	card: Restaurant;
	actionDirection: Direction | null;
	onVote: (cardId: string, vote: Vote) => void;
};

function SwipeCardBase({
	index,
	voteCount,
	totalCards,
	card,
	actionDirection,
	onVote,
}: Props) {
	const x = useMotionValue(0);

	const greenOpacity = useTransform(x, [0, 100], [0, 1]);
	const redOpacity = useTransform(x, [-100, 0], [1, 0]);
	const lockedDirection = useRef<Direction | null>(null);

	const isTop = index === 0;

	async function animateVoteThenSubmit(direction: Direction) {
		lockedDirection.current = direction;

		const target: { x: number; vote: Vote } =
			direction === 'right' ? { x: 300, vote: 'yes' } : { x: -300, vote: 'no' };

		await animate(x, target.x, { duration: 0.25 });
		onVote(card.id, target.vote);
	}

	useEffect(() => {
		if (!actionDirection) return;
		animateVoteThenSubmit(actionDirection);
	}, [actionDirection]);

	return (
		<motion.div
			drag={isTop}
			dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
			dragElastic={0.7}
			animate={{ translateY: index * -4, scale: 1 - index * 0.01 }}
			transition={{ duration: 0.3 }}
			onDrag={(_, info) => {
				if (lockedDirection.current) return;
				x.set(info.offset.x);
			}}
			onDragEnd={(_, info) => {
				if (info.offset.x > 100) {
					animateVoteThenSubmit('right');
				} else if (info.offset.x < -100) {
					animateVoteThenSubmit('left');
				}
			}}
			style={{
				x,
				zIndex: totalCards - index,
				pointerEvents: isTop ? 'auto' : 'none',
			}}
			className="absolute inset-x-0"
		>
			{/* Green overlay */}
			<motion.div
				className="absolute z-50 inset-0 rounded-2xl bg-radial-[230%_180%_at_-15%_50%] from-transparent from-40% via-green-500/40 via-50% to-transparent to-60%"
				style={{ opacity: greenOpacity }}
			/>
			{/* Red overlay */}
			<motion.div
				className="absolute z-50 inset-0 rounded-2xl bg-radial-[230%_180%_at_115%_50%] from-transparent from-40% via-red-500/40 via-50% to-transparent to-60%"
				style={{ opacity: redOpacity }}
			/>
			{/* Stack */}
			<div className="absolute z-50 inset-x-0 top-3">
				<div className="flex gap-1 px-4 ">
					{Array.from({ length: totalCards }, (_, i) => (
						<div
							key={card.name + i}
							className={`h-1 flex-1 ${i <= voteCount ? 'bg-white' : 'bg-zinc-200/60'}`}
						/>
					))}
				</div>
			</div>

			<RestaurantCard restaurant={card} />
		</motion.div>
	);
}

export const SwipeCard = memo(SwipeCardBase);
