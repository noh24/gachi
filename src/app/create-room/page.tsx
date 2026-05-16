'use client';

import Map, { LocationValue } from '@/components/Map';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { GeocodingSuggestion } from '@/types/geocoding';
import { LocateFixed } from 'lucide-react';

export default function CreateRoom() {
	const router = useRouter();

	const [location, setLocation] = useState<LocationValue>();
	const [input, setInput] = useState<string>('');
	const [suggestions, setSuggestions] = useState<GeocodingSuggestion[] | null>(null);

	useEffect(() => {
		const timer = setTimeout(async () => {
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
					}
					else{

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
		<section className='flex flex-col w-full gap-4'>
			<div className='flex gap-2'>
				<div className='relative flex-1'>
					<Input
						placeholder='Type in address'
						onChange={(e) => setInput(e.target.value)}
						value={input}
					/>
					{suggestions != null && (
						<ul className='absolute top-full w-full z-10 bg-zinc-800 text-zinc-400 mt-2 rounded-xl'>
							{suggestions.map((s) => (
								<li
									key={s.label}
									className='border-b-2 p-2 cursor-pointer hover:bg-zinc-600'
									onClick={() => {
										setLocation({ lat: s.lat, lng: s.lng });
										setSuggestions(null);
										setInput('');
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

			<div>
				<Button>Create</Button>
				<Button onClick={() => router.push('/')}>Cancel</Button>
			</div>
		</section>
	);
}
