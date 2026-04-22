"use client"

import { Ballot } from "@/components/Ballot";
import { mockRestaurants } from "@/lib/mockRestaurants";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Room() {
	const [votes, setVotes] = useState<Record<string, "yes" | "no"> | null>(null);

	if (votes == null) {
		return (
			<main className=" flex-1 flex flex-col justify-center px-2">
				<Ballot restaurants={mockRestaurants} onComplete={setVotes}></Ballot>
			</main>
		)
	}

	return (
		<main className=" flex-1 flex flex-col justify-around px-2 gap-4">
			<section>
				{Object.entries(votes).map((vote) => (
					<p key={vote[0]}>{mockRestaurants.find(r => r.id == vote[0])?.name}: {vote[1]}</p>
				))}
			</section>
			<Button
				onClick={() => setVotes(null)}
			>
				Reset</Button>

		</main>
	)
}