export type Restaurant = {
	id: string;
	name: string;
	cuisine: string;
	rating: number; // 1.0 - 5.0
	priceLevel: "$" | "$$" | "$$$" | "$$$$";
	imageUrl: string;
	address: string;
}