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

// Make functions available globally
window.processCEAIData = processCEAIData;
window.generateSampleData = generateSampleData;
