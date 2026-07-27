import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
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

    const prompt = `You are a specialized receipt scanner OCR system. Extract all details from this receipt photo into structured JSON format.
If a detail is uncertain, provide your best estimation and reflect low confidence in confidenceScore (0 to 100).
Ensure category matches one of: Groceries, Food, Fuel, Medical, Shopping, Utilities, Education, Travel, Entertainment, Others.
Date must be in YYYY-MM-DD format. Total amount must be a number.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
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
      },
      config: {
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
      },
    });

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
