
import { Request, Response } from "express";
import { GoogleGenAI } from '@google/genai';

// API handler for CEAI analysis with Gemini
export default async function handler(req: Request, res: Response) {
  // Set headers for streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const { csvContent } = req.body;
    
    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required' });
    }
    
    const ai = new GoogleGenAI({
      apiKey: "AIzaSyCDZvzerJkMtwtUG7VgQqK4Rd6UN-wU7N4",
    });
    
    const config = {
      responseMimeType: 'text/plain',
      systemInstruction: [
        {
          text: `You are an advanced data analysis assistant powered by the Gemini 1.5 Pro model, designed to analyze Corporate Entrepreneurship Assessment Instrument (CEAI) survey data. Your task is to process a CSV file containing CEAI survey responses, compute custom scores for five dimensions, perform reliability analysis, and generate structured output for dashboards. Follow these instructions:

1. **Input Data**:
   - Accept a CSV file with 56 columns: \`timestamp\`, \`department\` (optional), \`Answer1\` to \`Answer48\` (Likert scale 1-5), and pre-calculated averages (\`Management_Support_Avg\`, \`Autonomy_Avg\`, \`Rewards_Avg\`, \`Time_Availability_Avg\`, \`Organizational_Boundaries_Avg\`).
   - Question groupings:
     - Management Support: Answer1 to Answer10
     - Autonomy: Answer11 to Answer20
     - Rewards: Answer21 to Answer29
     - Time Availability: Answer30 to Answer38
     - Organizational Boundaries: Answer39 to Answer48

2. **Processing**:
   - **Validate Input**: Ensure the CSV has the expected columns and valid numerical responses (1-5 for Answer1 to Answer48). Flag any missing or invalid data.
   - **Compute Scores**: Recalculate dimension averages for each response to verify pre-calculated averages:
     - Management Support: Mean of Answer1 to Answer10
     - Autonomy: Mean of Answer11 to Answer20
     - Rewards: Mean of Answer21 to Answer29
     - Time Availability: Mean of Answer30 to Answer38
     - Organizational Boundaries: Mean of Answer39 to Answer48
   - **Reliability Analysis**: Calculate Cronbach's alpha for each dimension to assess internal consistency. Use the formula:
     - α = (k / (k-1)) * (1 - Σσ²ᵢ / σ²ₜ), where k is the number of items, Σσ²ᵢ is the sum of item variances, and σ²ₜ is the variance of the total score.
   - **Department Breakdown**: If \`department\` is provided, compute average scores per dimension for each department.

3. **Output**:
   - Return a well-formatted text document with clear headings, subheadings and bullet points.
   - Include sections for:
     - Overall dimension averages across all responses
     - Reliability analysis with Cronbach's alpha values and interpretations
     - Department breakdowns (if applicable)
     - Any data validation issues or errors found
   - Provide insights on the results and highlight any notable patterns or areas of concern.
   - Make sure the formatting is clean with proper spacing and organization for readability.`,
        }
      ],
    };
    
    const model = 'gemini-2.0-flash';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: csvContent,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    // Stream the response
    for await (const chunk of response) {
      // Remove any HTML tags from the response
      const cleanedText = chunk.text ? chunk.text.replace(/<\/?[^>]+(>|$)/g, '') : '';
      res.write(cleanedText);
    }
    
    res.end();
    
  } catch (error) {
    console.error('Error analyzing data with Gemini:', error);
    
    // If headers weren't sent yet, return error as JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to analyze data with Gemini AI',
        details: error instanceof Error ? error.message : String(error)
      });
    }
    
    // If we were already streaming, end with error message
    res.write(`\n\nError occurred during analysis: ${error instanceof Error ? error.message : String(error)}`);
    res.end();
  }
}
