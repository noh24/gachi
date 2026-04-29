"use client";

import { useCallback, useEffect, useRef } from "react";
import maplibregl, { LngLatLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type LocationValue = {
	lat: number;
	lng: number;
};

const DEFAULT_LOCATION: LocationValue = {
	lat: 42.9634,
	lng: -85.6681,
};

type Props = {
	value?: LocationValue;
	defaultValue?: LocationValue;
	onChange?: (location: LocationValue) => void;
};

export default function Map({ value, defaultValue = DEFAULT_LOCATION, onChange, }: Props) {
	const mapContainer = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const markerRef = useRef<maplibregl.Marker | null>(null);
	const onChangeRef = useRef(onChange);
	const lastEmittedRef = useRef<LocationValue | null>(null);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		if (!mapContainer.current || mapRef.current) return;

		const initialLngLat = toLngLat(value ?? defaultValue)

		const emitChange = (location: LocationValue) => {
			lastEmittedRef.current = location;
			onChangeRef.current?.(location);
		}

		const map = new maplibregl.Map({
			container: mapContainer.current,
			style: "https://tiles.stadiamaps.com/styles/alidade_smooth.json",
			center: initialLngLat,
			zoom: 12,
		});

		const marker = new maplibregl.Marker({ draggable: true })
			.setLngLat(initialLngLat)
			.addTo(map);


		const handleMapClick = (event: maplibregl.MapMouseEvent) => {
			const nextLocation = fromLngLat(event.lngLat)

			marker.setLngLat(event.lngLat)
			mapRef.current?.flyTo({
				center: event.lngLat,
				zoom: Math.max(mapRef.current?.getZoom(), 12)
			})

			emitChange(nextLocation)
		};

		const handleMarkerDragEnd = () => {
			emitChange(fromLngLat(marker.getLngLat()));
		};

		map.addControl(new maplibregl.NavigationControl());

		map.on("click", handleMapClick)
		marker.on("dragend", handleMarkerDragEnd);

		markerRef.current = marker;
		mapRef.current = map;

		return () => {
			map.off('click', handleMapClick);
			marker.off('dragend', handleMarkerDragEnd)
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!mapRef.current || !markerRef.current || !value) return;

		const lastEmitted = lastEmittedRef.current;

		if (lastEmitted?.lat === value.lat && lastEmitted.lng === value.lng)
			return;

		const nextLngLat = toLngLat(value)

		markerRef.current.setLngLat(nextLngLat);

		mapRef.current.flyTo({
			center: nextLngLat,
			zoom: Math.max(mapRef.current.getZoom(), 12),
		});
	}, [value]);

	return (
		<div
			ref={mapContainer}
			className="h-100 w-full rounded-2xl overflow-hidden border shadow"
		></div>
	);
}

function toLngLat(location: LocationValue): LngLatLike {
	return [location.lng, location.lat]
}

function fromLngLat(lngLat: maplibregl.LngLat): LocationValue {
	return { lat: lngLat.lat, lng: lngLat.lng }
}