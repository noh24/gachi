import { NextRequest, NextResponse } from 'next/server';
import { GeocodingSuggestion } from '@/types/geocoding';

export async function GET(request: NextRequest) {
	const q = request.nextUrl.searchParams.get('q');

	if (!q || q.trim() === '') {
		return NextResponse.json({ error: 'invalid query' }, { status: 400 });
	}
    
	const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
	url.searchParams.set('text', q);
	url.searchParams.set('limit', '5');
	url.searchParams.set('apiKey', process.env.GEOAPIFY_API_KEY);

	try {
		const response = await fetch(url.toString());

		if (!response.ok) {
			return NextResponse.json({ error: 'geocoding failed' }, { status: 502 });
		}

		const data = await response.json();

		if (!data.features) {
			return NextResponse.json({ error: 'geocode feature not exist' }, { status: 502 });
		}

		const suggestions: GeocodingSuggestion[] = data.features.map(
			(feature: GeoapifyFeature) => ({
				label: feature.properties.formatted,
				lat: feature.geometry.coordinates[1],
				lng: feature.geometry.coordinates[0],
			}),
		);

		return NextResponse.json({ suggestions });
	} catch (ex) {
        console.error(ex)
        return NextResponse.json({ error: 'internal error'}, {status: 500})
    }
}

type GeoapifyFeature = {
	properties: { formatted: string };
	geometry: { coordinates: [number, number] };
};
