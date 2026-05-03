'use client';

import Map, { LocationValue } from '@/components/Map';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function CreateRoom() {
	const router = useRouter();

	const [location, setLocation] = useState<LocationValue>();

	return (
		<div className="p-6">
			<Input
				placeholder='Type in address'
			></Input>
			<Map value={location} onChange={setLocation} />
			<p>{location?.lat.toFixed(6)}</p>
			<p>{location?.lng.toFixed(6)}</p>
			<Button
				onClick={() => {
					if (!navigator.geolocation) {
						console.error('Geolocation is not supported by this browser');
						return
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
						}
					);
				}}
			>
				Use my location
			</Button>
			<Button>
				Create
			</Button>
			<Button
				onClick={() => router.push('/')}>
				Cancel
			</Button>
		</div>
	);
}
