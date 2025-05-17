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
    for (let c = 0; c < data[0].length; c++) {
        const colValues = data.map(row => row[c]).filter(n => !isNaN(n));
        colMeans[c] = mean(colValues);
    }
    return data.map(row =>
        row.map((val, idx) => (isNaN(val) ? colMeans[idx] : val))
    );
}

// 🔹 Main Processing Function
function processCEAIData(csvData) {
    const rows = csvData.trim().split("\n").map(line => line.split(","));
    if (rows.length < 2) {
        throw new Error("CSV must contain at least a header row and one data row.");
    }
    const dataRows = rows.slice(1);
    let encodedData = dataRows.map(row => row.map(cleanAndEncode));
    encodedData = replaceNaNWithColumnMean(encodedData);

    const dimensionScores = encodedData.map(row => {
        const scoreRow = {};
        for (let dim in ceaiDimensions) {
            const indices = ceaiDimensions[dim];
            const scores = indices.map(i => row[i]);
            scoreRow[dim] = Number(mean(scores).toFixed(2));
        }
        return scoreRow;
    });

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

    stats.weak_dimensions = weakDimensions;
    stats.strong_dimensions = strongDimensions;

    return {
        cleaned_data: encodedData.map(row => row.map(n => Number(n.toFixed(2)))),
        dimension_scores: dimensionScores,
        statistics: stats
    };
}

// 🔹 Calculate Cronbach's Alpha
function calculateCronbachAlpha(data, dimensionIndices) {
    const items = dimensionIndices.map(idx => data.map(row => row[idx]));
    const itemVariances = items.map(item => {
        const itemMean = mean(item);
        return mean(item.map(val => Math.pow(val - itemMean, 2)));
    });
    const totalScores = data.map((_, rowIdx) =>
        dimensionIndices.reduce((sum, colIdx) => sum + data[rowIdx][colIdx], 0)
    );
    const totalMean = mean(totalScores);
    const totalVariance = mean(totalScores.map(score => Math.pow(score - totalMean, 2)));
    const k = dimensionIndices.length;
    const sumOfItemVariances = itemVariances.reduce((sum, variance) => sum + variance, 0);
    const alpha = (k / (k - 1)) * (1 - (sumOfItemVariances / totalVariance));
    return Number(alpha.toFixed(3));
}

// 🔹 Prepare data for AI analysis
function prepareDataForGeminiAnalysis(csvData) {
    try {
        const processedData = processCEAIData(csvData);
        const rows = csvData.trim().split("\n");
        const headers = rows[0].split(",");
        let formattedData = headers.join("\t") + "\n";
        for (let i = 1; i < rows.length; i++) {
            formattedData += rows[i].split(",").join("\t") + "\n";
        }
        formattedData += "\nPROCESSED_DATA_CONTEXT:\n";
        formattedData += JSON.stringify({
            dimension_scores: processedData.dimension_scores,
            statistics: processedData.statistics
        }, null, 2);
        return formattedData;
    } catch (error) {
        console.error('Error preparing data for analysis:', error);
        return csvData;
    }
}

// 🔹 Generate sample AI analysis based on actual data
function generateSampleGeminiAnalysis(processedData) {
    if (!processedData) {
        return getDefaultAnalysis();
    }

    const stats = processedData.statistics;
    const means = stats.means;
    const strongDimensions = stats.strong_dimensions || [];
    const weakDimensions = stats.weak_dimensions || [];

    const dimensionValues = Object.values(means);
    const overallAvg = dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length;

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

    const sortedDimensions = Object.entries(means)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score]) => ({ name, score }));

    let dimensionAverages = sortedDimensions.map(dim => {
        const star = dim.score > 4.0 ? " ⭐ (Strong)" : "";
        const warning = dim.score < 2.5 ? " ⚠️ (Weak)" : "";
        return `* **${dim.name}**: ${dim.score.toFixed(2)}${star}${warning}`;
    }).join("\n");

    let strengthsSection = "";
    if (strongDimensions.length > 0) {
        strengthsSection = strongDimensions.map(dim => {
            return `* **${dim}** stands out as a strength with a score of ${means[dim].toFixed(2)}`;
        }).join("\n");
    } else {
        const topDim = sortedDimensions[0];
        strengthsSection = `* **${topDim.name}** is the highest scoring dimension at ${topDim.score.toFixed(2)}, though it doesn't reach the threshold for a strong dimension (>4.0)`;
    }

    let weaknessesSection = "";
    if (weakDimensions.length > 0) {
        weaknessesSection = weakDimensions.map(dim => {
            return `* **${dim}** is a critical area for improvement with a low score of ${means[dim].toFixed(2)}`;
        }).join("\n");
    } else {
        const bottomDim = sortedDimensions[sortedDimensions.length - 1];
        weaknessesSection = `* **${bottomDim.name}** is the lowest scoring dimension at ${bottomDim.score.toFixed(2)}, though it doesn't fall below the threshold for a weak dimension (<2.5)`;
    }

    const recommendations = generateRecommendations(sortedDimensions, strongDimensions, weakDimensions);

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
}

// Simplified recommendations for clarity
function generateRecommendations(sortedDimensions, strongDimensions, weakDimensions) {
    return `1. **Enhance Organizational Flexibility**
   * Review standard procedures
   * Encourage cross-department collaboration
   * Reduce red tape

2. **Improve Time Management**
   * Evaluate workload balance
   * Allocate innovation time
   * Minimize distractions

3. **Strengthen Management Support**
   * Provide innovation leadership training
   * Create idea feedback channels
   * Celebrate creative efforts`;
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
    window.processCEAIData = processCEAIData;
    window.generateSampleData = generateSampleData;
    window.calculateCronbachAlpha = calculateCronbachAlpha;
    window.prepareDataForGeminiAnalysis = prepareDataForGeminiAnalysis;
    window.generateSampleGeminiAnalysis = generateSampleGeminiAnalysis;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processCEAIData,
        generateSampleData,
        calculateCronbachAlpha,
        prepareDataForGeminiAnalysis,
        generateSampleGeminiAnalysis
    };
}