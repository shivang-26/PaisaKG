import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, apiKey: customApiKey } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const apiKey = (customApiKey && customApiKey.trim().length > 0) ? customApiKey.trim() : null;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is missing. Please set your Personal key or Family Shared key in Workspace Settings.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    const todayISO = new Date().toISOString().slice(0, 10);
    const prompt = `You are a specialized receipt scanner OCR system. Extract all details from this receipt photo into structured JSON format.
Today's date is ${todayISO}. Use this to accurately assign the year and month when scanning receipts. If the receipt date is from a previous month (e.g. last month), extract that exact receipt date accurately in YYYY-MM-DD format.
If a detail is uncertain, provide your best estimation and reflect low confidence in confidenceScore (0 to 100).
Ensure category matches one of: Groceries, Food, Fuel, Medical, Shopping, Utilities, Education, Travel, Entertainment, Others.
Date must be in YYYY-MM-DD format. Total amount must be a number.`;

    const contentsPayload = {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    };

    const configPayload = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING, description: 'Store or merchant name' },
          totalAmount: { type: Type.NUMBER, description: 'Total paid amount' },
          date: { type: Type.STRING, description: 'Receipt date YYYY-MM-DD' },
          category: {
            type: Type.STRING,
            description: 'One of Groceries, Food, Fuel, Medical, Shopping, Utilities, Education, Travel, Entertainment, Others',
          },
          tax: { type: Type.NUMBER, description: 'Tax amount if present' },
          receiptNumber: { type: Type.STRING, description: 'Receipt invoice or ticket number' },
          confidenceScore: { type: Type.NUMBER, description: 'Confidence level from 0 to 100' },
          confidenceNotes: { type: Type.STRING, description: 'Notes on low confidence or missing fields' },
          items: {
            type: Type.ARRAY,
            description: 'List of individual items on receipt',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                qty: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
              },
            },
          },
        },
        required: ['merchant', 'totalAmount', 'date', 'category', 'confidenceScore'],
      },
    };

    // Try primary model gemini-3.6-flash, fallback to gemini-3.1-pro-preview if high demand / 503
    const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: configPayload,
          });
          if (response) break;
        } catch (err: any) {
          lastError = err;
          const errMsg = err.message || JSON.stringify(err) || '';
          const isRetryable =
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('429') ||
            errMsg.includes('RESOURCE_EXHAUSTED');

          if (isRetryable && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
            continue;
          }
          break; // Move to next model if available
        }
      }
      if (response) break;
    }

    if (!response) {
      throw lastError || new Error('All AI vision models are currently experiencing high demand. Please try again shortly.');
    }

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error('OCR API Error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Failed to scan receipt with Gemini OCR',
      },
      { status: 500 }
    );
  }
}
