'use client';

import { Restaurant } from '@/types/restaurant';
import { Direction, Vote } from '@/types/swipeActions';
import { Heart, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SwipeCard } from './SwipeCard';
import { Button } from './ui/button';

type SwipeAction = {
	direction: Direction;
	cardId: string;
} | null;

type Props = {
	restaurants: Restaurant[];
	onComplete: (votes: Record<string, Vote>) => void;
};

export function Ballot({ restaurants, onComplete }: Props) {
	const [cards, setCards] = useState<Restaurant[]>(restaurants);
	const [votes, setVotes] = useState<Record<string, Vote>>({});
	const [action, setAction] = useState<SwipeAction>(null);

	const topCard = cards[0];

	const handleVote = useCallback((cardId: string, vote: Vote) => {
		setVotes((prev) => ({ ...prev, [cardId]: vote }));
		setCards((prev) => prev.slice(1));
		setAction(null);
	}, []);

	function triggerSwipe(direction: Direction) {
		if (!topCard) return;
		setAction({ direction, cardId: topCard.id });
	}

	useEffect(() => {
		if (cards.length == 0) onComplete(votes);
	}, [cards.length]);

	return (
		<section className="flex flex-col gap-4">
			<div className="relative aspect-3/4 w-full">
				{cards.map((card, i) => (
					<SwipeCard
						key={card.id}
						index={i}
						voteCount={restaurants.length - cards.length}
						totalCards={restaurants.length}
						card={card}
						actionDirection={
							action?.cardId === card.id ? action.direction : null
						}
						onVote={handleVote}
					/>
				))}
			</div>

			<div className="flex justify-around">
				<Button
					size={'icon-lg'}
					className="rounded-full  w-16 h-16"
					onClick={() => triggerSwipe('left')}
				>
					<X className="text-red-500" />
				</Button>

				<Button
					size={'icon-lg'}
					className="rounded-full w-16 h-16"
					onClick={() => triggerSwipe('right')}
				>
					<Heart className="text-green-500 fill-green-500 h-25 " />
				</Button>
			</div>
		</section>
	);
}
