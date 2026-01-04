import { createClient, ErrorResponse, PhotosWithTotalResults } from 'pexels';

// Initialize the Pexels client with the API key from environment variables
const client = createClient(process.env.EXPO_PUBLIC_PEXELS_API_KEY || '');

/**
 * Searches for an image URL based on a query string using the Pexels API.
 * @param query The item name to search for (e.g., "apple", "milk").
 * @returns A promise that resolves to an image URL.
 */
export async function searchItemImage(query: string): Promise<string> {
    try {
        if (!process.env.EXPO_PUBLIC_PEXELS_API_KEY) {
            console.warn("Pexels API Key is missing. Returning placeholder.");
            return `https://loremflickr.com/320/240/${encodeURIComponent(query)}`;
        }

        const response = await client.photos.search({ query, per_page: 1 }) as PhotosWithTotalResults | ErrorResponse;

        // Check if the response is a valid photo result
        if ('photos' in response && response.photos.length > 0) {
            // Return the medium sized image URL
            return response.photos[0].src.medium;
        } else {
            console.log(`No Pexels match for "${query}". Returning placeholder.`);
            return `https://loremflickr.com/320/240/${encodeURIComponent(query)}`;
        }
    } catch (error) {
        console.error("Error searching Pexels:", error);
        // Fallback to placeholder service in case of error
        return `https://loremflickr.com/320/240/${encodeURIComponent(query)}`;
    }
}
