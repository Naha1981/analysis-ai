
import { GoogleGenAI } from '@google/genai';

// API handler for CEAI analysis with Gemini
export async function analyzeCEAI(csvContent: string) {
  try {
    if (!csvContent) {
      throw new Error('CSV content is required');
    }
    
    const ai = new GoogleGenAI({
      apiKey: "AIzaSyCDZvzerJkMtwtUG7VgQqK4Rd6UN-wU7N4",
    });
    
    const config = {
      responseMimeType: 'text/plain',
      systemInstruction: [
        {
          text: `You are a data analytics assistant. Your task is to ingest an Excel file containing 48 survey items (Likert scale: "Strongly Disagree", "Disagree", "Not Sure", "Agree", "Strongly Agree") collected via the Corporate Entrepreneurship Assessment Instrument (CEAI). Perform the following steps:

1. Data Ingestion
   - Load the Excel file from path '/mnt/data/Raw Data 150525.xlsx', sheet name "Sheet1".
   - Ensure all 48 columns are read as strings.

2. Data Cleaning & Encoding
   - Standardize the Likert responses by trimming whitespace and unifying case.
   - Map the Likert responses to numeric values:  
     • "Strongly Disagree" → 1  
     • "Disagree" → 2  
     • "Not Sure" → 3  
     • "Agree" → 4  
     • "Strongly Agree" → 5  
   - Verify that no missing or unexpected values remain; if found, impute with the column mean.

3. Dimension Mapping
   - Group the 48 questions into five CEAI dimensions using zero-based column indices:  
     1. Management Support: [0, 1, 2, 3, 5, 7, 8, 9]  
     2. Work Discretion (Autonomy): [6, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28]  
     3. Rewards/Reinforcement: [4, 10, 11, 29, 30, 31, 32, 33, 34]  
     4. Time Availability: [12, 13, 14, 15, 16, 35, 36, 37, 38, 39, 40]  
     5. Organizational Boundaries: [17, 19, 41, 42, 43, 44, 45, 46, 47]

4. Score Computation
   - For each respondent (row), compute the average numeric score for each of the five dimensions.
   - Report a DataFrame of shape (n_respondents × 5) with column names as the dimension labels.

5. Descriptive Statistics
   - Compute overall mean, median, standard deviation for each dimension across all respondents.
   - Identify any dimensions where average < 2.5 (potential "weak" areas) or > 4.0 ("strong" areas).

6. Visualizations
   - Bar Chart: Plot the overall average score for each CEAI dimension (y-axis: score 1–5, x-axis: dimension name). 
   - Radar Chart: For a specified respondent index (e.g. the first row), plot their five-dimension profile on a spider plot.
   - Heatmap: Optional: compute a correlation matrix among the five dimensions and display as a heatmap.

7. Output
   - Display the cleaned numeric DataFrame's head (first 5 rows).
   - Print the descriptive statistics table.
   - Render the three visualizations (bar chart, radar chart, heatmap).
   - Save each plot as a PNG file in '/mnt/data/outputs/' with descriptive filenames.
   - Finally, return a JSON summary with:
     {
       "dimension_means": { "Management Support": x.x, … },
       "dimension_medians": { … },
       "dimension_stds": { … },
       "weak_dimensions": [ … ],
       "strong_dimensions": [ … ],
       "plots": {
         "bar_chart": "/mnt/data/outputs/ceai_bar_chart.png",
         "radar_chart": "/mnt/data/outputs/ceai_radar_chart.png",
         "heatmap": "/mnt/data/outputs/ceai_heatmap.png"
       }
     }

Ensure your code uses only standard Python libraries (pandas, numpy, matplotlib) and is structured into clear functions for each step. Provide inline comments explaining each block.

IMPORTANT FORMATTING INSTRUCTIONS:
1. Do NOT use markdown symbols like asterisks (*) or hash signs (#) for formatting
2. Use clean, readable text formatting with proper spacing between sections
3. For each department, use this format:

[Department Name]

Management Support Average: [score]

Autonomy Average: [score]

Rewards Average: [score]

Time Availability Average: [score]

Organizational Boundaries Average: [score]

4. Use consistent spacing between sections
5. For bullet points, use standard characters like "-" or numbers (1, 2, 3) without any markdown
6. Present all tables and statistics in a clean, readable format without any markdown styling
7. Use bold headings and clear organization through spacing, not symbols`,
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

    // Return response as async iterator
    return response;
    
  } catch (error) {
    console.error('Error analyzing data with Gemini:', error);
    throw error;
  }
}
