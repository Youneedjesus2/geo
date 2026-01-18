import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport, ComparisonData, FieldStatus } from "../types";

// Helper to determine status based on string equality (ignoring case/whitespace)
const determineStatus = (v1: string, v2: string): FieldStatus => {
  if (!v1 || !v2 || v1 === 'Not Found' || v2 === 'Not Found' || v1 === 'Unknown' || v2 === 'Unknown') return 'MISSING';
  
  // Simple normalization for comparison
  const n1 = v1.toLowerCase().replace(/[^\w\s]/gi, '').trim();
  const n2 = v2.toLowerCase().replace(/[^\w\s]/gi, '').trim();
  
  return n1 === n2 ? 'MATCH' : 'MISMATCH';
};

export const generateAudit = async (businessName: string, city: string): Promise<AuditReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as a rigorous business data auditor. I need you to simulate a comparison between two AI knowledge bases (Gemini and ChatGPT) for the business "${businessName}" in "${city}".
    
    You need to generate specific values for: Address, Phone Number, Operating Hours, and Business Description.
    
    For each field, provide:
    1. The value found by Gemini.
    2. The value found by ChatGPT (simulate a realistic slight variation or outdated info if common, or exact match if highly stable).
    
    Also provide:
    1. A brief summary of the business online presence.
    2. A list of 2-3 specific suggestions if data is missing or conflicting.
    3. A valid JSON-LD structure (Schema.org/LocalBusiness) for this business based on the Gemini data.

    If the business is fictional or completely unknown, generate realistic "MISSING" or low-confidence placeholder data (Use "Not Found" for missing values).
    
    The output must strictly follow this JSON schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          address: {
            type: Type.OBJECT,
            properties: {
              gemini: { type: Type.STRING },
              gpt: { type: Type.STRING },
            }
          },
          phone: {
             type: Type.OBJECT,
            properties: {
              gemini: { type: Type.STRING },
              gpt: { type: Type.STRING },
            }
          },
          hours: {
             type: Type.OBJECT,
            properties: {
              gemini: { type: Type.STRING },
              gpt: { type: Type.STRING },
            }
          },
          description: {
             type: Type.OBJECT,
            properties: {
              gemini: { type: Type.STRING },
              gpt: { type: Type.STRING },
            }
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          schemaJson: { type: Type.STRING }
        }
      }
    }
  });

  let raw;
  try {
      // Cleanup text if model returns markdown fencing
      let cleanText = response.text || '{}';
      if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
      }
      raw = JSON.parse(cleanText);
  } catch (e) {
      console.error("Failed to parse JSON", e);
      throw new Error("AI response was not valid JSON. Please try again.");
  }

  const fields: ComparisonData = {
    address: {
      label: "Business Address",
      value: raw.address?.gemini || "Unknown",
      geminiValue: raw.address?.gemini,
      gptValue: raw.address?.gpt,
      status: determineStatus(raw.address?.gemini, raw.address?.gpt)
    },
    phone: {
      label: "Phone Number",
      value: raw.phone?.gemini || "Unknown",
      geminiValue: raw.phone?.gemini,
      gptValue: raw.phone?.gpt,
      status: determineStatus(raw.phone?.gemini, raw.phone?.gpt)
    },
    hours: {
      label: "Operating Hours",
      value: raw.hours?.gemini || "Unknown",
      geminiValue: raw.hours?.gemini,
      gptValue: raw.hours?.gpt,
      status: determineStatus(raw.hours?.gemini, raw.hours?.gpt)
    },
    description: {
      label: "Business Description",
      value: raw.description?.gemini || "Not Found",
      geminiValue: raw.description?.gemini,
      gptValue: raw.description?.gpt,
      status: determineStatus(raw.description?.gemini, raw.description?.gpt)
    }
  };

  return {
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toLocaleDateString(),
    businessName,
    city,
    summary: raw.summary || "No summary available.",
    fields,
    missingInfoSuggestions: raw.suggestions || [],
    schemaJson: raw.schemaJson || "{}"
  };
};

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
}