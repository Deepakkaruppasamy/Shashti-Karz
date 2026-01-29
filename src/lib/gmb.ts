// Google My Business API Helper Functions

const GMB_API_URL = 'https://mybusiness.googleapis.com/v4';
const GMB_ACCESS_TOKEN = process.env.GMB_ACCESS_TOKEN;
const GMB_LOCATION_ID = process.env.GMB_LOCATION_ID;

/**
 * Sync reviews from database to Google My Business
 */
export async function syncReviewsToGMB() {
    // This would require OAuth2 flow - placeholder for now
    console.log('GMB review sync would happen here');
    return { success: true, synced: 0 };
}

/**
 * Fetch reviews from Google My Business
 */
export async function fetchGMBReviews() {
    if (!GMB_ACCESS_TOKEN || !GMB_LOCATION_ID) {
        console.warn('GMB credentials not configured');
        return [];
    }

    try {
        const response = await fetch(
            `${GMB_API_URL}/${GMB_LOCATION_ID}/reviews`,
            {
                headers: {
                    'Authorization': `Bearer ${GMB_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        return data.reviews || [];
    } catch (error) {
        console.error('GMB fetch reviews error:', error);
        return [];
    }
}

/**
 * Post update to Google My Business
 */
export async function postGMBUpdate(content: string, imageUrl?: string) {
    if (!GMB_ACCESS_TOKEN || !GMB_LOCATION_ID) {
        console.warn('GMB credentials not configured');
        return null;
    }

    try {
        const post = {
            languageCode: 'en',
            summary: content,
            ...(imageUrl && {
                media: [{
                    mediaFormat: 'PHOTO',
                    sourceUrl: imageUrl,
                }],
            }),
            topicType: 'STANDARD',
        };

        const response = await fetch(
            `${GMB_API_URL}/${GMB_LOCATION_ID}/localPosts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GMB_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(post),
            }
        );

        return await response.json();
    } catch (error) {
        console.error('GMB post update error:', error);
        return null;
    }
}

/**
 * Reply to a Google My Business review
 */
export async function replyToGMBReview(reviewId: string, replyText: string) {
    if (!GMB_ACCESS_TOKEN || !GMB_LOCATION_ID) {
        console.warn('GMB credentials not configured');
        return null;
    }

    try {
        const response = await fetch(
            `${GMB_API_URL}/${GMB_LOCATION_ID}/reviews/${reviewId}/reply`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GMB_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comment: replyText,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.error('GMB reply error:', error);
        return null;
    }
}
