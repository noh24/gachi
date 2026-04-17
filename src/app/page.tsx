import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<main className="flex-1 flex flex-col justify-center items-center">
			<section className="flex flex-col items-center p-12 gap-6 text-center">
				<div className="flex flex-col gap-4">
					<h1 className="text-6xl font-bold">gachi</h1>
					<div className="text-zinc-400">
						<p className="">swipe together</p>
						<p className="">eat together</p>
					</div>
				</div>
				<Button
					variant="outline"
					size="icon-lg"
				>
					→
				</Button>
			</section>
		</main>
	);
}
