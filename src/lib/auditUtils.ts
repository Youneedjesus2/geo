import { ComparisonData } from '@/types/audit';

/**
 * Regenerates Schema.org JSON-LD from corrected fields
 */
export const regenerateSchema = (businessName: string, fields: ComparisonData): string => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": businessName,
        "description": fields.description.value,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": fields.address.value
        },
        "telephone": fields.phone.value,
        "openingHours": fields.hours.value
    };
    return JSON.stringify(schema, null, 2);
};
