import axios from 'axios';
import { format, addDays } from 'date-fns';

interface BookingJsonSchema {
  bookingType: 'INDIVIDUAL' | 'ORGANIZATION';
  bookingDate: string;
  bookingTime: string;
  pickupPoint: string;
  dropPoint: string;
  vehicleType: string;
  travellersCount: number;
  passengers: Array<{
    passengerName: string;
    passengerPhone?: string;
    passengerEmail?: string;
  }>;
  remarks: string;
  confidence: Record<string, number>;
  missingFields: string[];
  needsClarification: boolean;
  clarificationMessage?: string;
}

/**
 * Parses user booking query using Gemini 1.5 Flash API or a local fallback rule parser if key is absent.
 */
export const parseBookingCommand = async (text: string, currentServerDate?: string): Promise<BookingJsonSchema> => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const serverDate = currentServerDate || format(new Date(), 'yyyy-MM-dd');

  // Fallback Rule Parser if no API Key is set
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY is not set. Using local fallback rule-based parser.');
    return parseCommandLocally(text, serverDate);
  }

  const prompt = `
    You are an AI assistant for a Fleet & Transport Management Platform.
    Extract the ride booking information from this user request.
    The request might be in English, Tamil, Tanglish (Tamil in Latin script), or mixed.
    
    Current Server Date: ${serverDate} (Use this date to resolve relative terms like "today", "tomorrow", "next Monday", "நாளைக்கு", "இன்னைக்கு").
    
    User Request: "${text}"

    Strictly extract:
    - bookingType: "INDIVIDUAL" (default) or "ORGANIZATION" (if user specifically mentions booking for corporate, school, bulk students, or company manifest).
    - bookingDate: in YYYY-MM-DD format.
    - bookingTime: in HH:mm format.
    - pickupPoint: string (leave empty if not specified).
    - dropPoint: string (leave empty if not specified).
    - vehicleType: SUV, Sedan, Hatchback, Bus, or Tempo Traveller.
    - travellersCount: integer count (default to 1).
    - passengers: array of objects containing passengerName, passengerPhone, passengerEmail if mentioned.
    - remarks: any notes or requests.
    - needsClarification: true if pickup, drop, date, or time is ambiguous/missing.
    - missingFields: list of missing keys like ["pickupPoint", "bookingTime", "bookingDate"].
    - clarificationMessage: A friendly response asking for the missing fields in Tamil/Tanglish/English.
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              bookingType: { type: 'STRING', enum: ['INDIVIDUAL', 'ORGANIZATION'] },
              bookingDate: { type: 'STRING' },
              bookingTime: { type: 'STRING' },
              pickupPoint: { type: 'STRING' },
              dropPoint: { type: 'STRING' },
              vehicleType: { type: 'STRING' },
              travellersCount: { type: 'INTEGER' },
              passengers: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    passengerName: { type: 'STRING' },
                    passengerPhone: { type: 'STRING' },
                    passengerEmail: { type: 'STRING' }
                  }
                }
              },
              remarks: { type: 'STRING' },
              confidence: { type: 'OBJECT' },
              missingFields: { type: 'ARRAY', items: { type: 'STRING' } },
              needsClarification: { type: 'BOOLEAN' },
              clarificationMessage: { type: 'STRING' }
            },
            required: ['bookingType', 'needsClarification', 'missingFields']
          }
        }
      }
    );

    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (resultText) {
      return JSON.parse(resultText) as BookingJsonSchema;
    }
    throw new Error('Empty response from Gemini API');
  } catch (err: any) {
    console.error('Gemini API call failed, falling back to local parser:', err.message);
    return parseCommandLocally(text, serverDate);
  }
};

/**
 * Deterministic rule-based local parser for development fallback
 */
const parseCommandLocally = (text: string, serverDate: string): BookingJsonSchema => {
  const lowerText = text.toLowerCase();
  
  // Date Parsing
  let parsedDate = serverDate;
  if (lowerText.includes('tomorrow') || lowerText.includes('nalaiku') || lowerText.includes('நாளைக்கு')) {
    parsedDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  } else if (lowerText.includes('day after') || lowerText.includes('nala marunal') || lowerText.includes('நாளை மறுநாள்')) {
    parsedDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');
  }

  // Time Parsing
  let parsedTime = '';
  if (lowerText.includes('10')) {
    parsedTime = '10:00';
  } else if (lowerText.includes('9')) {
    parsedTime = '09:00';
  } else if (lowerText.includes('5')) {
    parsedTime = '17:00';
  }

  // Location Parsing
  let pickupPoint = '';
  if (lowerText.includes('surandai') || lowerText.includes('சுரண்டை')) {
    pickupPoint = 'Surandai';
  } else if (lowerText.includes('chennai') || lowerText.includes('சென்னை')) {
    pickupPoint = 'Chennai Airport';
  }

  let dropPoint = '';
  if (lowerText.includes('tenkasi') || lowerText.includes('தென்காசி')) {
    dropPoint = 'Tenkasi';
  } else if (lowerText.includes('coimbatore') || lowerText.includes('கோயம்புத்தூர்')) {
    dropPoint = 'Coimbatore';
  }

  // Vehicle Type
  let vehicleType = 'SUV';
  if (lowerText.includes('sedan') || lowerText.includes('கார்')) {
    vehicleType = 'Sedan';
  } else if (lowerText.includes('bus') || lowerText.includes('பேருந்து')) {
    vehicleType = 'Bus';
  }

  // Travellers Count
  let travellersCount = 1;
  const matchCount = lowerText.match(/(\d+)\s*(per|people|passengers|members)/);
  if (matchCount) {
    travellersCount = parseInt(matchCount[1]);
  } else if (lowerText.includes('40')) {
    travellersCount = 40;
  }

  // Booking Type
  const bookingType = lowerText.includes('college') || lowerText.includes('corporate') || lowerText.includes('students')
    ? 'ORGANIZATION'
    : 'INDIVIDUAL';

  // Clarification Verification
  const missingFields: string[] = [];
  if (!pickupPoint) missingFields.push('pickupPoint');
  if (!dropPoint) missingFields.push('dropPoint');
  if (!parsedTime) missingFields.push('bookingTime');

  const needsClarification = missingFields.length > 0;
  let clarificationMessage = '';
  if (needsClarification) {
    const listNames = missingFields.map(f => {
      if (f === 'pickupPoint') return 'Pickup Location';
      if (f === 'dropPoint') return 'Destination';
      if (f === 'bookingTime') return 'Time';
      return f;
    }).join(', ');
    clarificationMessage = `இதை நான் புரிந்துகொண்டேன். ஆனால் ${listNames} விடுபட்டுள்ளது. தயவுசெய்து கூறவும். (Please provide: ${listNames})`;
  }

  return {
    bookingType,
    bookingDate: parsedDate,
    bookingTime: parsedTime,
    pickupPoint,
    dropPoint,
    vehicleType,
    travellersCount,
    passengers: [],
    remarks: '',
    confidence: {
      pickupPoint: pickupPoint ? 0.95 : 0,
      dropPoint: dropPoint ? 0.95 : 0,
      bookingDate: 0.95,
      bookingTime: parsedTime ? 0.95 : 0
    },
    missingFields,
    needsClarification,
    clarificationMessage
  };
};
