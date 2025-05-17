# CEAI Analysis Tool

A web application for analyzing Corporate Entrepreneurship Assessment Instrument (CEAI) survey data using Google's Gemini AI.

## Features

- Upload and process CEAI survey data in CSV format
- AI-powered analysis of survey results
- Comprehensive reports with executive summaries, dimension averages, and recommendations
- Fallback local analysis when API is unavailable
- Clean, user-friendly interface

## Setup

1. Clone the repository
```bash
git clone https://github.com/Naha1981/ceai-insight-forge.git
cd ceai-insight-forge
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with your Gemini API key (see `.env.example` for format)

4. Start the server
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Node.js, Express
- **AI Integration**: Google Gemini API
- **Data Processing**: Custom CEAI processing algorithms

## License

MIT
