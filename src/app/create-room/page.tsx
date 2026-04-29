'use client';

import Map, { LocationValue } from '@/components/Map';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CreateRoom() {
	const [location, setLocation] = useState<LocationValue>();

	return (
		<div className="p-6">
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
		</div>
	);
}
