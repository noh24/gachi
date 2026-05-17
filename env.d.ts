declare namespace NodeJS {
    interface ProcessEnv {
        GEOAPIFY_API_KEY: string
        UPSTASH_REDIS_REST_URL: string
        UPSTASH_REDIS_REST_TOKEN: string
        MAPBOX_API_KEY: string
        GOOGLE_PLACES_API_KEY: string
    }
}