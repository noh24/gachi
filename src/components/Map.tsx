'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import turfCircle from '@turf/circle';

export type LocationValue = {
	lat: number;
	lng: number;
};

const DEFAULT_LOCATION: LocationValue = {
	lat: 42.9634,
	lng: -85.6681,
};
const MAP_ZOOM: number = 10;

const buildRadiusCircle = (loc: LocationValue, radiusInMiles: number) =>
	turfCircle([loc.lng, loc.lat], radiusInMiles, { units: 'miles' });

type Props = {
	value?: LocationValue;
	defaultValue?: LocationValue;
	radiusInMiles: number;
	onChange?: (location: LocationValue) => void;
};

export default function Map({
	value,
	defaultValue = DEFAULT_LOCATION,
	radiusInMiles,
	onChange,
}: Props) {
	const mapContainer = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const markerRef = useRef<maplibregl.Marker | null>(null);
	const onChangeRef = useRef(onChange);
	const lastEmittedRef = useRef<LocationValue | null>(null);

	useEffect(() => {
		if (!radiusInMiles || !mapRef.current) return;
		if (!mapRef.current.isStyleLoaded()) return;
		
		const loc = value ?? defaultValue;
		const circle = buildRadiusCircle(loc, radiusInMiles);
		(mapRef.current.getSource('radius-circle') as maplibregl.GeoJSONSource).setData(circle);
	}, [value, radiusInMiles, defaultValue]);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		if (!mapContainer.current || mapRef.current) return;

		const initialLngLat = toLngLat(value ?? defaultValue);

		const initialRadiusCircle =
			radiusInMiles && (value ?? defaultValue)
				? buildRadiusCircle(value ?? defaultValue, radiusInMiles)
				: { type: 'FeatureCollection' as const, features: [] };

		const emitChange = (location: LocationValue) => {
			lastEmittedRef.current = location;
			onChangeRef.current?.(location);
		};

		const map = new maplibregl.Map({
			container: mapContainer.current,
			style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
			center: initialLngLat,
			zoom: MAP_ZOOM,
		});

		const marker = new maplibregl.Marker({ draggable: true })
			.setLngLat(initialLngLat)
			.addTo(map);

		const handleMapClick = (event: maplibregl.MapMouseEvent) => {
			const nextLocation = fromLngLat(event.lngLat);

			marker.setLngLat(event.lngLat);
			mapRef.current?.flyTo({
				center: event.lngLat,
				zoom: Math.max(mapRef.current?.getZoom(), MAP_ZOOM),
			});

			emitChange(nextLocation);
		};

		const handleMarkerDragEnd = () => {
			emitChange(fromLngLat(marker.getLngLat()));
		};

		map.addControl(new maplibregl.NavigationControl());

		map.on('load', () => {
			map.addSource('radius-circle', {
				type: 'geojson',
				data: initialRadiusCircle,
			});
			map.addLayer({
				id: 'radius-circle-fill',
				type: 'fill',
				source: 'radius-circle',
				paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.15 },
			});
		});
		map.on('click', handleMapClick);
		marker.on('dragend', handleMarkerDragEnd);

		markerRef.current = marker;
		mapRef.current = map;

		return () => {
			map.off('click', handleMapClick);
			marker.off('dragend', handleMarkerDragEnd);
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!mapRef.current || !markerRef.current || !value) return;

		const lastEmitted = lastEmittedRef.current;

		if (lastEmitted?.lat === value.lat && lastEmitted.lng === value.lng) return;

		const nextLngLat = toLngLat(value);

		markerRef.current.setLngLat(nextLngLat);

		mapRef.current.flyTo({
			center: nextLngLat,
			zoom: Math.max(mapRef.current.getZoom(), MAP_ZOOM),
		});
	}, [value]);

	return (
		<div
			ref={mapContainer}
			className='h-100 w-full rounded-2xl overflow-hidden border shadow'
		></div>
	);
}

function toLngLat(location: LocationValue): LngLatLike {
	return [location.lng, location.lat];
}

function fromLngLat(lngLat: maplibregl.LngLat): LocationValue {
	return { lat: lngLat.lat, lng: lngLat.lng };
}
