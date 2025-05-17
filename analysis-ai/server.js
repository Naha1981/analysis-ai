// Server-side code for CEAI Analysis with AI API
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files from current directory

// API endpoint for CEAI analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }
    
    // Process the CSV data to get the actual scores and analysis
    let processedData;
    try {
      // Import the processCEAIData function from ceaiProcessor.js
      const { processCEAIData } = require('./ceaiProcessor');
      processedData = processCEAIData(csvData);
      console.log('Processed data successfully');
    } catch (dataError) {
      console.error('Error processing CSV data:', dataError);
      // Continue with the API call even if data processing fails
    }
    
    try {
      // Use API key from environment variables
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found in environment variables');
      }
      
      // Initialize the AI API
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // For text-only input, use the gemini-pro model
      const model = 'gemini-pro';
      const genModel = genAI.getGenerativeModel({ model: model });
      
      // Process the CSV data for the AI
      const { prepareDataForGeminiAnalysis } = require('./ceaiProcessor');
      const formattedData = prepareDataForGeminiAnalysis(csvData);
      
      // Create a prompt for the AI
      const prompt = "You are an expert in corporate entrepreneurship assessment. Analyze the following CEAI (Corporate Entrepreneurship Assessment Instrument) survey data and provide a comprehensive report. Include an executive summary, dimension averages, reliability analysis, strengths, weaknesses, and recommendations. Format your response in markdown.\n\nHere is the survey data to analyze:\n" + formattedData;
      
      // Generate content from the AI API
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Return the AI analysis
      res.json({ analysis: text });
    } catch (apiError) {
      console.error('Error calling AI API:', apiError);
      
      // If the API call fails, generate a fallback analysis based on the processed data
      try {
        // Import the generateSampleGeminiAnalysis function from ceaiProcessor.js
        const { generateSampleGeminiAnalysis } = require('./ceaiProcessor');
        const fallbackAnalysis = generateSampleGeminiAnalysis(processedData);
        res.json({ 
          analysis: fallbackAnalysis,
          note: 'Generated using local analysis due to API error'
        });
      } catch (fallbackError) {
        console.error('Error generating fallback analysis:', fallbackError);
        res.status(500).json({ error: 'Failed to generate analysis', details: 'Both API and fallback analysis failed' });
      }
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    
    // Return a generic error message to the client
    res.status(500).json({ error: 'Error processing AI analysis', details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log('CEAI Analysis server running on port ' + port);
});
