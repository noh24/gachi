'use client';

import Map, { LocationValue } from '@/components/Map';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useRouter } from 'next/navigation';
import { GeocodingSuggestion } from '@/types/geocoding';
import { LocateFixed } from 'lucide-react';

export default function CreateRoom() {
	const RADIUS_OPTIONS = [0.5, 1, 3, 5];
	const router = useRouter();

	const [location, setLocation] = useState<LocationValue>();

	const [input, setInput] = useState<string>('');
	const [suggestions, setSuggestions] = useState<GeocodingSuggestion[] | null>(null);
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const isSelecting = useRef<boolean>(false);

	const [radiusIndex, setRadiusIndex] = useState(1);
	const selectedRadius = RADIUS_OPTIONS[radiusIndex];

	useEffect(() => {
		const timer = setTimeout(async () => {
			if (isSelecting.current) {
				isSelecting.current = false;
				return;
			}

			if (!input.trim()) {
				setSuggestions(null);
				return;
			}

			try {
				const res = await fetch(`/api/geocode?q=${encodeURIComponent(input)}`);

				if (!res.ok) {
					console.error('geocode fetch failed', res.status);
					return;
				}

				if (res.ok) {
					const data = (await res.json()) as { suggestions: GeocodingSuggestion[] };

					if (!data.suggestions) {
						console.error('geocode suggestions does not exist');
						return;
					}

					if (data.suggestions.length === 0) {
						const empty: GeocodingSuggestion = {
							label: 'No results',
							lat: 0,
							lng: 0,
						};
						setSuggestions([empty]);
					} else {
						setSuggestions(data.suggestions);
					}
				}
			} catch (ex) {
				console.error(ex);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [input]);

	return (
		<section className='flex flex-col w-full gap-4 justify-center items-center'>
			<div className='flex gap-2 w-full'>
				<div className='relative flex-1'>
					<Input
						placeholder='Type in address'
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
					/>
					{suggestions != null && isFocused && (
						<ul className='absolute top-full w-full z-10 bg-zinc-800 text-zinc-400 mt-2 rounded-xl'>
							{suggestions.map((s) => (
								<li
									key={s.label}
									className='border-b-2 p-2 cursor-pointer hover:bg-zinc-600'
									onMouseDown={(e) => {
										e.preventDefault();
										isSelecting.current = true;
										setInput(s.label);
										setLocation({ lat: s.lat, lng: s.lng });
										setSuggestions(null);
									}}
								>
									{s.label}
								</li>
							))}
						</ul>
					)}
				</div>
				<Button
					variant={'outline'}
					size={'icon'}
					className=''
					onClick={() => {
						if (!navigator.geolocation) {
							console.error('Geolocation is not supported by this browser');
							return;
						}

						navigator.geolocation.getCurrentPosition(
							(position) => {
								setLocation({
									lat: position.coords.latitude,
									lng: position.coords.longitude,
								});
							},
							(error) => {
								console.error('Unable to get current location', error);
							},
						);
					}}
				>
					<LocateFixed></LocateFixed>
				</Button>
			</div>
			<Map
				value={location}
				onChange={setLocation}
			/>
			<div className='mx-auto flex flex-col w-1/2'>
				<Slider
					min={0}
					max={3}
					step={1}
					value={[radiusIndex]}
					onValueChange={([i]) => setRadiusIndex(i)}
				></Slider>
			</div>

			<div className='flex justify-between text-xs text-muted-foreground w-4/7'>
				<span className={radiusIndex === 0 ? `text-amber-500` : ``}>0.5 mi</span>
				<span className={radiusIndex === 1 ? `text-amber-500` : ``}>1 mi</span>
				<span className={radiusIndex === 2 ? `text-amber-500` : ``}>3 mi</span>
				<span className={radiusIndex === 3 ? `text-amber-500` : ``}>5 mi</span>
			</div>

			<div className=''>
				<Button>Create</Button>
				<Button onClick={() => router.push('/')}>Cancel</Button>
			</div>
		</section>
	);
}
