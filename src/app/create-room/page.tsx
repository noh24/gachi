'use client';

import Map, { LocationValue } from '@/components/Map';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { GeocodingSuggestion } from '@/types/geocoding';

export default function CreateRoom() {
	const router = useRouter();

	const [location, setLocation] = useState<LocationValue>();
	const [input, setInput] = useState<string>('');
	const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);

	useEffect(() => {
		const timer = setTimeout(async () => {
			if (!input.trim()) {
				setSuggestions([]);
				return;
			}

			try {
				const res = await fetch(`/api/geocode?q=${encodeURIComponent(input)}`);

				if (!res.ok) { 
					console.error('geocode fetch failed', res.status);
					return
				}

				if (res.ok) {
					const data = (await res.json()) as { suggestions: GeocodingSuggestion[] };

					if (!data.suggestions) {
						console.error('geocode suggestions does not exist')
						return
					}
					
					setSuggestions(data.suggestions);
				}
			} catch (ex) {
				console.error(ex);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [input]);

	return (
		<div className='p-6'>
			<Input
				placeholder='Type in address'
				onChange={(e) => setInput(e.target.value)}
			></Input>

			<Map
				value={location}
				onChange={setLocation}
			/>
			<p>{location?.lat.toFixed(6)}</p>
			<p>{location?.lng.toFixed(6)}</p>
			<Button
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
				Use my location
			</Button>
			<Button>Create</Button>
			<Button onClick={() => router.push('/')}>Cancel</Button>
		</div>
	);
}
