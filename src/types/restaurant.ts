export type Restaurant = {
	id: string;
	name: string;
	address: string;
	photoUrl: string;
	rating: number; // 1.0 - 5.0
	distance: number;
	categories: string[];
	cuisine: string; // Remove
	priceLevel: '$' | '$$' | '$$$' | '$$$$'; // Optional
	imageUrl: string; // Remove later
};
