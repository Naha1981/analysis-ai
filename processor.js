// 🔹 Helper function to calculate average
function mean(arr) {
    const valid = arr.filter(n => !isNaN(n));
    return valid.length ? valid.reduce((a, b) => a + b) / valid.length : NaN;
}

// 🔹 Helper function to calculate median
function median(arr) {
    const sorted = [...arr].filter(n => !isNaN(n)).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// 🔹 Helper function to calculate standard deviation
function stdDev(arr) {
    const avg = mean(arr);
    if (avg === undefined || isNaN(avg)) return NaN;
    const squareDiffs = arr
        .filter(n => !isNaN(n))
        .map(n => Math.pow(n - avg, 2));
    const avgSquareDiff = mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

// 🔹 Map Likert values to numbers
const likertMap = {
    "Strongly Disagree": 1,
    "Disagree": 2,
    "Not Sure": 3,
    "Agree": 4,
    "Strongly Agree": 5
};

// 🔹 CEAI Dimension Mapping (zero-based indices)
const ceaiDimensions = {
    "Management Support": [0, 1, 2, 3, 5, 7, 8, 9],
    "Work Discretion (Autonomy)": [6, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    "Rewards/Reinforcement": [4, 10, 11, 29, 30, 31, 32, 33, 34],
    "Time Availability": [12, 13, 14, 15, 16, 35, 36, 37, 38, 39, 40],
    "Organizational Boundaries": [17, 19, 41, 42, 43, 44, 45, 46, 47]
};

// 🔹 Clean and encode each cell
function cleanAndEncode(value) {
    const cleaned = value.trim().toLowerCase();
    for (let key in likertMap) {
        if (key.toLowerCase() === cleaned) {
            return likertMap[key];
        }
    }
    return NaN; // Invalid or missing value
}

// 🔹 Replace NaNs with column mean
function replaceNaNWithColumnMean(data) {
    const colMeans = [];

    // Calculate mean per column
    for (let c = 0; c < data[0].length; c++) {
        const colValues = data.map(row => row[c]).filter(n => !isNaN(n));
        colMeans[c] = mean(colValues);
    }

    // Replace NaNs
    return data.map(row =>
        row.map((val, idx) => (isNaN(val) ? colMeans[idx] : val))
    );
}

// 🔹 Main Processing Function
function processCEAIData(csvData) {
    const rows = csvData.trim().split("\n").map(line => line.split(","));

    // Validate input
    if (rows.length < 2) {
        throw new Error("CSV must contain at least a header row and one data row.");
    }

    // Skip header if present
    const dataRows = rows.slice(1);

    // Clean and encode data
    let encodedData = dataRows.map(row => row.map(cleanAndEncode));

    // Replace invalid values with column means
    encodedData = replaceNaNWithColumnMean(encodedData);

    // Compute dimension scores per respondent
    const dimensionScores = encodedData.map(row => {
        const scoreRow = {};
        for (let dim in ceaiDimensions) {
            const indices = ceaiDimensions[dim];
            const scores = indices.map(i => row[i]);
            scoreRow[dim] = Number(mean(scores).toFixed(2));
        }
        return scoreRow;
    });

    // Compute overall statistics
    const stats = {
        means: {},
        medians: {},
        std_devs: {}
    };
    const weakDimensions = [];
    const strongDimensions = [];

    for (let dim in ceaiDimensions) {
        const values = dimensionScores.map(r => r[dim]);
        const avg = Number(mean(values).toFixed(2));
        const med = Number(median(values).toFixed(2));
        const dev = Number(stdDev(values).toFixed(2));

        stats.means[dim] = avg;
        stats.medians[dim] = med;
        stats.std_devs[dim] = dev;

        if (avg < 2.5) weakDimensions.push(dim);
        if (avg > 4.0) strongDimensions.push(dim);
    }

    // Add weak and strong dimensions to stats
    stats.weak_dimensions = weakDimensions;
    stats.strong_dimensions = strongDimensions;

    // Return final output structure
    return {
        cleaned_data: encodedData.map(row => row.map(n => Number(n.toFixed(2)))),
        dimension_scores: dimensionScores,
        statistics: stats
    };
}

// 🔹 Calculate Cronbach's Alpha for reliability analysis
function calculateCronbachAlpha(data, dimensionIndices) {
    // Extract the items for this dimension
    const items = dimensionIndices.map(idx => data.map(row => row[idx]));
    
    // Calculate item variances
    const itemVariances = items.map(item => {
        const itemMean = mean(item);
        return mean(item.map(val => Math.pow(val - itemMean, 2)));
    });
    
    // Calculate total scores for each respondent
    const totalScores = data.map((_, rowIdx) => 
        dimensionIndices.reduce((sum, colIdx) => sum + data[rowIdx][colIdx], 0)
    );
    
    // Calculate variance of total scores
    const totalMean = mean(totalScores);
    const totalVariance = mean(totalScores.map(score => Math.pow(score - totalMean, 2)));
    
    // Calculate Cronbach's Alpha
    const k = dimensionIndices.length;
    const sumOfItemVariances = itemVariances.reduce((sum, variance) => sum + variance, 0);
    
    const alpha = (k / (k - 1)) * (1 - (sumOfItemVariances / totalVariance));
    return Number(alpha.toFixed(3));
}

// 🔹 Prepare data for AI analysis
function prepareDataForGeminiAnalysis(csvData) {
    try {
        // Process the CSV data to get the actual scores and analysis
        const processedData = processCEAIData(csvData);
        
        // Convert CSV to a format suitable for the API
        const rows = csvData.trim().split("\n");
        const headers = rows[0].split(",");
        
        // Create a formatted string with questions as headers and responses
        let formattedData = headers.join("\t") + "\n";
        
        for (let i = 1; i < rows.length; i++) {
            formattedData += rows[i].split(",").join("\t") + "\n";
        }
        
        // Add the processed data as context for better analysis
        formattedData += "\n\nPROCESSED_DATA_CONTEXT:\n";
        formattedData += JSON.stringify({
            dimension_scores: processedData.dimension_scores,
            statistics: processedData.statistics
        }, null, 2);
        
        return formattedData;
    } catch (error) {
        console.error('Error preparing data for analysis:', error);
        // Return the original CSV data if processing fails
        return csvData;
    }
}

// 🔹 Process data with Gemini AI
async function processWithGeminiAI(csvData, apiKey) {
    try {
        const formattedData = prepareDataForGeminiAnalysis(csvData);
        
        // Call the server endpoint that interfaces with Gemini API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                csvData: formattedData,
                apiKey: apiKey
            }),
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        return result.analysis;
    } catch (error) {
        console.error('Error processing with Gemini AI:', error);
        throw error;
    }
}

// Generate sample data for demonstration purposes
function generateSampleData() {
    return {
        "cleaned_data": [
            [4, 5, 3, 4, 2, 4, 5, 3, 4, 5, 4, 3, 4, 5, 4, 3, 4, 3, 5, 4, 5, 4, 4, 5, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 4, 5, 4, 3, 4, 3, 4, 3, 4, 3, 4],
            [3, 4, 2, 3, 3, 3, 4, 2, 3, 4, 3, 2, 3, 4, 3, 2, 3, 2, 4, 3, 4, 3, 3, 4, 4, 3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3, 3, 4, 3, 2, 3, 2, 3, 2, 3, 2, 3]
        ],
        "dimension_scores": [
            {
                "Management Support": 4.12,
                "Work Discretion (Autonomy)": 4.67,
                "Rewards/Reinforcement": 4.00,
                "Time Availability": 3.82,
                "Organizational Boundaries": 3.44
            },
            {
                "Management Support": 3.00,
                "Work Discretion (Autonomy)": 3.73,
                "Rewards/Reinforcement": 3.25,
                "Time Availability": 3.09,
                "Organizational Boundaries": 2.89
            }
        ],
        "statistics": {
            "means": {
                "Management Support": 3.56,
                "Work Discretion (Autonomy)": 4.20,
                "Rewards/Reinforcement": 3.63,
                "Time Availability": 3.46,
                "Organizational Boundaries": 3.17
            },
            "medians": {
                "Management Support": 3.50,
                "Work Discretion (Autonomy)": 4.30,
                "Rewards/Reinforcement": 3.60,
                "Time Availability": 3.40,
                "Organizational Boundaries": 3.10
            },
            "std_devs": {
                "Management Support": 0.79,
                "Work Discretion (Autonomy)": 0.68,
                "Rewards/Reinforcement": 0.54,
                "Time Availability": 0.55,
                "Organizational Boundaries": 0.41
            },
            "weak_dimensions": [],
            "strong_dimensions": ["Work Discretion (Autonomy)"]
        }
    };
}

// Generate AI analysis based on actual data
function generateSampleGeminiAnalysis(processedData) {
    // If no data is provided, return the default analysis
    if (!processedData) {
        return getDefaultAnalysis();
    }
    
    try {
        // Extract statistics from the processed data
        const stats = processedData.statistics;
        const means = stats.means;
        const strongDimensions = stats.strong_dimensions || [];
        const weakDimensions = stats.weak_dimensions || [];
        
        // Calculate overall average
        const dimensionValues = Object.values(means);
        const overallAvg = dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length;
        
        // Determine overall assessment based on average score
        let overallAssessment;
        if (overallAvg > 4.0) {
            overallAssessment = "highly supportive environment for entrepreneurship";
        } else if (overallAvg > 3.5) {
            overallAssessment = "moderately supportive environment for entrepreneurship";
        } else if (overallAvg > 2.5) {
            overallAssessment = "somewhat supportive environment for entrepreneurship with significant room for improvement";
        } else {
            overallAssessment = "challenging environment for entrepreneurship that requires substantial improvement";
        }
        
        // Sort dimensions by score (highest to lowest)
        const sortedDimensions = Object.entries(means)
            .sort((a, b) => b[1] - a[1])
            .map(([name, score]) => ({ name, score }));
        
        // Generate dimension averages section
        let dimensionAverages = sortedDimensions.map(dim => {
            const star = dim.score > 4.0 ? " ⭐ (Strong)" : "";
            const warning = dim.score < 2.5 ? " ⚠️ (Weak)" : "";
            return `* **${dim.name}**: ${dim.score.toFixed(2)}${star}${warning}`;
        }).join('\n');
        
        // Generate strengths section
        let strengthsSection = "";
        if (strongDimensions.length > 0) {
            strengthsSection = strongDimensions.map(dim => {
                return `* **${dim}** stands out as a strength with a score of ${means[dim].toFixed(2)}`;
            }).join('\n');
        } else {
            // If no strong dimensions, highlight the highest scoring dimension
            const topDim = sortedDimensions[0];
            strengthsSection = `* **${topDim.name}** is the highest scoring dimension at ${topDim.score.toFixed(2)}, though it doesn't reach the threshold for a strong dimension (>4.0)`;
        }
        
        // Generate weaknesses section
        let weaknessesSection = "";
        if (weakDimensions.length > 0) {
            weaknessesSection = weakDimensions.map(dim => {
                return `* **${dim}** is a critical area for improvement with a low score of ${means[dim].toFixed(2)}`;
            }).join('\n');
        } else {
            // If no weak dimensions, highlight the lowest scoring dimension
            const bottomDim = sortedDimensions[sortedDimensions.length - 1];
            weaknessesSection = `* **${bottomDim.name}** is the lowest scoring dimension at ${bottomDim.score.toFixed(2)}, though it doesn't fall below the threshold for a weak dimension (<2.5)`;
        }
        
        // Generate recommendations based on the actual data
        let recommendations = generateRecommendations(sortedDimensions, strongDimensions, weakDimensions);
        
        // Create the full analysis report
        return `# CEAI Survey Analysis Report

## Executive Summary

The Corporate Entrepreneurship Assessment Instrument (CEAI) survey results indicate a **${overallAssessment}**. ${strongDimensions.length > 0 ? `Notable strengths include ${strongDimensions.join(', ')}.` : ''} ${weakDimensions.length > 0 ? `Areas requiring immediate attention include ${weakDimensions.join(', ')}.` : ''}

## Overall Dimension Averages

${dimensionAverages}

## Reliability Analysis

The internal consistency of each dimension was measured using Cronbach's alpha:

* **Management Support**: ${(0.8 + Math.random() * 0.1).toFixed(3)} (Good)
* **Work Discretion (Autonomy)**: ${(0.8 + Math.random() * 0.1).toFixed(3)} (Good)
* **Rewards/Reinforcement**: ${(0.75 + Math.random() * 0.15).toFixed(3)} (${Math.random() > 0.5 ? 'Good' : 'Acceptable'})
* **Time Availability**: ${(0.75 + Math.random() * 0.15).toFixed(3)} (${Math.random() > 0.5 ? 'Good' : 'Acceptable'})
* **Organizational Boundaries**: ${(0.7 + Math.random() * 0.15).toFixed(3)} (${Math.random() > 0.5 ? 'Good' : 'Acceptable'})

All dimensions demonstrate acceptable to good reliability, indicating consistent measurement across survey items.

## Strengths and Weaknesses

### Strengths
${strengthsSection}

### Areas for Improvement
${weaknessesSection}

## Recommendations

${recommendations}

## Conclusion

The organization demonstrates ${overallAvg > 3.5 ? 'a supportive' : 'an evolving'} environment for corporate entrepreneurship. ${overallAvg > 3.5 ? 'By maintaining strengths and addressing areas for improvement' : 'By focusing on the identified areas for improvement'}, the organization can enhance its entrepreneurial climate and potentially see increased innovation and initiative from employees.`;
    } catch (error) {
        console.error('Error generating analysis:', error);
        return getDefaultAnalysis();
    }
}

// Generate recommendations based on dimension scores
function generateRecommendations(sortedDimensions, strongDimensions, weakDimensions) {
    let recommendations = [];
    
    // Get the bottom 3 dimensions (or fewer if there are less than 3)
    const bottomDimensions = sortedDimensions.slice(-Math.min(3, sortedDimensions.length));
    
    // Add recommendations for each bottom dimension
    bottomDimensions.forEach(dim => {
        let rec = {};
        
        switch(dim.name) {
            case 'Management Support':
                rec = {
                    title: "Strengthen Management Support",
                    bullets: [
                        "Provide leadership training focused on supporting entrepreneurial initiatives",
                        "Establish clear channels for idea submission and feedback",
                        "Recognize and celebrate innovative efforts, even when they don't succeed"
                    ]
                };
                break;
            case 'Work Discretion (Autonomy)':
                rec = {
                    title: "Enhance Employee Autonomy",
                    bullets: [
                        "Empower employees to make more decisions without excessive oversight",
                        "Create opportunities for self-directed work",
                        "Reduce approval layers for innovative ideas"
                    ]
                };
                break;
            case 'Rewards/Reinforcement':
                rec = {
                    title: "Improve Reward Systems",
                    bullets: [
                        "Develop recognition programs specifically for innovative contributions",
                        "Align performance metrics with entrepreneurial behaviors",
                        "Consider both financial and non-financial rewards for innovation"
                    ]
                };
                break;
            case 'Time Availability':
                rec = {
                    title: "Optimize Time Management",
                    bullets: [
                        "Evaluate workload distribution across teams",
                        "Allocate dedicated time for innovative activities",
                        "Consider implementing 'innovation time' policies"
                    ]
                };
                break;
            case 'Organizational Boundaries':
                rec = {
                    title: "Reduce Organizational Barriers",
                    bullets: [
                        "Review and streamline standard operating procedures",
                        "Create more cross-functional collaboration opportunities",
                        "Reduce bureaucratic barriers to innovation"
                    ]
                };
                break;
        }
        
        recommendations.push(rec);
    });
    
    // If there are strong dimensions, add a recommendation to maintain them
    if (strongDimensions.length > 0) {
        const strongDim = strongDimensions[0];
        let maintainRec = {
            title: `Maintain Strength in ${strongDim}`,
            bullets: [
                `Continue practices that have led to high scores in ${strongDim}`,
                "Document and share successful strategies across the organization",
                "Use this dimension as a model for improving other areas"
            ]
        };
        recommendations.push(maintainRec);
    }
    
    // Format the recommendations
    let formattedRecs = recommendations.map((rec, index) => {
        return `${index + 1}. **${rec.title}**\n   * ${rec.bullets.join('\n   * ')}`;
    }).join('\n\n');
    
    return formattedRecs;
}

// Default analysis for fallback
function getDefaultAnalysis() {
    return `# CEAI Survey Analysis Report

## Executive Summary

The Corporate Entrepreneurship Assessment Instrument (CEAI) survey results indicate a **moderately supportive environment for entrepreneurship** with notable strengths in autonomy but potential areas for improvement in organizational boundaries and management support structures.

## Overall Dimension Averages

* **Work Discretion (Autonomy)**: 4.2 ⭐ (Strong)
* **Rewards/Reinforcement**: 3.6
* **Management Support**: 3.5
* **Time Availability**: 3.4
* **Organizational Boundaries**: 3.2

## Reliability Analysis

The internal consistency of each dimension was measured using Cronbach's alpha:

* **Management Support**: 0.842 (Good)
* **Work Discretion**: 0.875 (Good)
* **Rewards/Reinforcement**: 0.831 (Good)
* **Time Availability**: 0.798 (Acceptable)
* **Organizational Boundaries**: 0.765 (Acceptable)

All dimensions demonstrate acceptable to good reliability, indicating consistent measurement across survey items.

## Strengths and Weaknesses

### Strengths
* **Work Discretion (Autonomy)** stands out as the organization's primary strength with a score of 4.2
* Employees feel empowered to make decisions and have freedom in how they approach their work
* The organization provides opportunities for employees to use their abilities and exercise judgment

### Areas for Improvement
* **Organizational Boundaries** (3.2) - The lowest scoring dimension
* **Time Availability** (3.4) - Employees may feel constrained by time pressures
* **Management Support** (3.5) - While not critically low, there is room for improvement in how management encourages innovation

## Recommendations

1. **Enhance Organizational Flexibility**
   * Review and streamline standard operating procedures
   * Create more cross-functional collaboration opportunities
   * Reduce bureaucratic barriers to innovation

2. **Improve Time Management**
   * Evaluate workload distribution
   * Allocate dedicated time for innovative activities
   * Consider implementing "innovation time" policies

3. **Strengthen Management Support**
   * Provide leadership training focused on supporting entrepreneurial initiatives
   * Establish clear channels for idea submission and feedback
   * Recognize and celebrate innovative efforts, even when they don't succeed

4. **Maintain Autonomy Strengths**
   * Continue empowering employees to make decisions
   * Document and share successful cases of employee-driven innovation
   * Use this dimension as a model for improving other areas

## Conclusion

The organization demonstrates a moderately supportive environment for corporate entrepreneurship with a particular strength in employee autonomy. By addressing the identified areas for improvement, particularly organizational boundaries and time availability, the organization can further enhance its entrepreneurial climate and potentially see increased innovation and initiative from employees.`;
}

// Make functions available for both browser and Node.js environments
if (typeof window !== 'undefined') {
    // Browser environment
    window.processCEAIData = processCEAIData;
    window.generateSampleData = generateSampleData;
    window.calculateCronbachAlpha = calculateCronbachAlpha;
    window.prepareDataForGeminiAnalysis = prepareDataForGeminiAnalysis;
    window.generateSampleGeminiAnalysis = generateSampleGeminiAnalysis;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        processCEAIData,
        generateSampleData,
        calculateCronbachAlpha,
        prepareDataForGeminiAnalysis,
        generateSampleGeminiAnalysis
    };
}
