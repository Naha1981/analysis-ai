
// CEAI Analysis Utilities
import Papa from 'papaparse';

// Define the types for our analysis results
export interface DimensionScore {
  name: string;
  score: number;
  reliability: number;
}

export interface DepartmentScore {
  department: string;
  [key: string]: string | number;
}

// Define the main dimension mapping according to the CEAI structure
export const dimensionMapping = {
  'Management Support': [0, 1, 2, 3, 5, 7, 8, 9],
  'Work Discretion (Autonomy)': [6, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  'Rewards/Reinforcement': [4, 10, 11, 29, 30, 31, 32, 33, 34],
  'Time Availability': [12, 13, 14, 15, 16, 35, 36, 37, 38, 39, 40],
  'Organizational Boundaries': [17, 19, 41, 42, 43, 44, 45, 46, 47]
};

// Define the Likert scale mapping
export const likertScaleMapping: Record<string, number> = {
  'strongly disagree': 1,
  'disagree': 2,
  'not sure': 3,
  'agree': 4,
  'strongly agree': 5
};

/**
 * Clean and standardize a Likert scale response
 * @param value The raw Likert response string
 * @returns The standardized numeric value or NaN if invalid
 */
export function standardizeLikertResponse(value: string): number {
  if (!value) return NaN;
  
  const normalizedValue = value.toLowerCase().trim();
  return likertScaleMapping[normalizedValue] || NaN;
}

/**
 * Calculate the mean of an array of numbers
 * @param values Array of numeric values
 * @returns The mean value
 */
export function calculateMean(values: number[]): number {
  const validValues = values.filter(v => !isNaN(v));
  if (validValues.length === 0) return NaN;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

/**
 * Calculate the median of an array of numbers
 * @param values Array of numeric values
 * @returns The median value
 */
export function calculateMedian(values: number[]): number {
  const validValues = values.filter(v => !isNaN(v)).sort((a, b) => a - b);
  if (validValues.length === 0) return NaN;
  
  const mid = Math.floor(validValues.length / 2);
  return validValues.length % 2 === 0
    ? (validValues[mid - 1] + validValues[mid]) / 2
    : validValues[mid];
}

/**
 * Calculate the standard deviation of an array of numbers
 * @param values Array of numeric values
 * @returns The standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  const validValues = values.filter(v => !isNaN(v));
  if (validValues.length <= 1) return 0;
  
  const mean = calculateMean(validValues);
  const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}

/**
 * Process a 2D array of raw survey data
 * @param rawData Array of arrays representing the survey data
 * @returns Processed and cleaned numeric data
 */
export function processRawData(rawData: string[][]): number[][] {
  // Initialize the result array
  const numericData: number[][] = [];
  const columnCount = rawData[0]?.length || 0;
  const columnMeans: number[] = Array(columnCount).fill(NaN);
  
  // First pass: Convert all valid values and calculate column means
  for (let row = 0; row < rawData.length; row++) {
    numericData[row] = [];
    for (let col = 0; col < rawData[row].length; col++) {
      const numericValue = standardizeLikertResponse(rawData[row][col]);
      numericData[row][col] = numericValue;
      
      // Collect valid values for mean calculation
      if (!isNaN(numericValue)) {
        if (isNaN(columnMeans[col])) {
          columnMeans[col] = numericValue;
        } else {
          // Running average calculation
          const count = row + 1;
          columnMeans[col] = (columnMeans[col] * (count - 1) + numericValue) / count;
        }
      }
    }
  }
  
  // Second pass: Replace NaN values with column means
  for (let row = 0; row < numericData.length; row++) {
    for (let col = 0; col < numericData[row].length; col++) {
      if (isNaN(numericData[row][col])) {
        numericData[row][col] = columnMeans[col];
      }
    }
  }
  
  return numericData;
}

/**
 * Calculate dimension scores for each respondent
 * @param cleanedData Cleaned numeric survey data
 * @returns Array of objects with dimension scores for each respondent
 */
export function calculateDimensionScores(cleanedData: number[][]): Record<string, number>[] {
  return cleanedData.map(row => {
    const scores: Record<string, number> = {};
    
    Object.entries(dimensionMapping).forEach(([dimension, indices]) => {
      const dimensionValues = indices.map(idx => row[idx]).filter(v => !isNaN(v));
      scores[dimension] = dimensionValues.length > 0
        ? parseFloat(calculateMean(dimensionValues).toFixed(2))
        : NaN;
    });
    
    return scores;
  });
}

/**
 * Calculate descriptive statistics for each dimension across all respondents
 * @param dimensionScores Array of dimension scores for each respondent
 * @returns Object containing means, medians, standard deviations, and weak/strong dimensions
 */
export function calculateDescriptiveStatistics(dimensionScores: Record<string, number>[]): {
  means: Record<string, number>;
  medians: Record<string, number>;
  stdDevs: Record<string, number>;
  weakDimensions: string[];
  strongDimensions: string[];
} {
  const dimensions = Object.keys(dimensionScores[0] || {});
  const dimensionValues: Record<string, number[]> = {};
  
  // Group values by dimension
  dimensions.forEach(dim => {
    dimensionValues[dim] = dimensionScores
      .map(score => score[dim])
      .filter(v => !isNaN(v));
  });
  
  // Calculate statistics
  const means: Record<string, number> = {};
  const medians: Record<string, number> = {};
  const stdDevs: Record<string, number> = {};
  const weakDimensions: string[] = [];
  const strongDimensions: string[] = [];
  
  dimensions.forEach(dim => {
    const values = dimensionValues[dim];
    means[dim] = parseFloat(calculateMean(values).toFixed(2));
    medians[dim] = parseFloat(calculateMedian(values).toFixed(2));
    stdDevs[dim] = parseFloat(calculateStandardDeviation(values).toFixed(2));
    
    // Identify weak and strong dimensions
    if (means[dim] < 2.5) weakDimensions.push(dim);
    if (means[dim] > 4.0) strongDimensions.push(dim);
  });
  
  return {
    means,
    medians,
    stdDevs,
    weakDimensions,
    strongDimensions
  };
}

/**
 * Calculate Cronbach's Alpha reliability coefficient
 * @param scores Array of arrays containing item scores
 * @returns Reliability coefficient
 */
export function calculateCronbachAlpha(scores: number[][]): number {
  if (scores.length === 0 || scores[0].length === 0) return NaN;

  const k = scores[0].length; // Number of items
  const itemVariances = Array(k).fill(0);
  let totalVariance = 0;

  // Calculate variance for each item
  scores.forEach(row => {
    row.forEach((val, i) => {
      itemVariances[i] += val * val / scores.length;
    });
    const rowSum = row.reduce((sum, val) => sum + val, 0);
    totalVariance += rowSum * rowSum / scores.length;
  });

  // Calculate means and adjust variances
  scores[0].map((_, i) => {
    const mean = scores.reduce((sum, row) => sum + row[i], 0) / scores.length;
    itemVariances[i] -= mean * mean;
  });

  // Adjust total variance
  const totalMean = scores.reduce((sum, row) => {
    const rowSum = row.reduce((s, v) => s + v, 0);
    return sum + rowSum;
  }, 0) / scores.length;
  
  totalVariance = totalVariance / scores.length - totalMean * totalMean;

  // Calculate alpha
  const sumItemVariances = itemVariances.reduce((sum, v) => sum + v, 0);
  return (k / (k - 1)) * (1 - sumItemVariances / totalVariance) || 0;
}

/**
 * Main function to process CEAI survey data
 * @param csvData The raw CSV data as a string
 * @returns Processed analysis results
 */
export function analyzeCEAIData(csvData: string): {
  cleanedData: number[][];
  dimensionScores: Record<string, number>[];
  statistics: {
    means: Record<string, number>;
    medians: Record<string, number>;
    stdDevs: Record<string, number>;
    weakDimensions: string[];
    strongDimensions: string[];
  };
  dimensionScoresArray: DimensionScore[];
  departmentScores: DepartmentScore[];
} {
  // Parse the CSV data
  const parseResult = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  const rawData = parseResult.data as Record<string, string>[];
  
  // Extract the answers (assuming 48 columns named Answer1 to Answer48)
  const answerColumns = Array.from({ length: 48 }, (_, i) => `Answer${i + 1}`);
  const rawAnswers = rawData.map(row => 
    answerColumns.map(col => row[col] || '')
  );
  
  // Process the raw data
  const cleanedData = processRawData(rawAnswers);
  const dimensionScores = calculateDimensionScores(cleanedData);
  const statistics = calculateDescriptiveStatistics(dimensionScores);
  
  // Generate the legacy format data for backward compatibility
  const dimensionScoresArray = Object.entries(statistics.means).map(([name, score]) => {
    // Calculate reliability for each dimension
    const dimensionIndices = dimensionMapping[name as keyof typeof dimensionMapping] || [];
    const dimensionData = cleanedData.map(row => 
      dimensionIndices.map(idx => row[idx])
    ).filter(arr => arr.every(v => !isNaN(v)));
    
    const reliability = calculateCronbachAlpha(dimensionData);
    
    return {
      name,
      score,
      reliability
    };
  });
  
  // Process department scores if department column exists
  const departmentScores: DepartmentScore[] = [];
  if (rawData[0]?.department) {
    const departments = [...new Set(rawData.map(row => row.department || 'Unknown'))];
    
    departments.forEach(department => {
      const deptRows = dimensionScores.filter((_, idx) => 
        rawData[idx]?.department === department
      );
      
      if (deptRows.length > 0) {
        const deptScore: DepartmentScore = { department };
        
        Object.keys(deptRows[0]).forEach(dim => {
          const values = deptRows.map(row => row[dim]).filter(v => !isNaN(v));
          deptScore[dim] = values.length > 0 
            ? calculateMean(values).toFixed(2) 
            : 'N/A';
        });
        
        departmentScores.push(deptScore);
      }
    });
  }
  
  return {
    cleanedData,
    dimensionScores,
    statistics,
    dimensionScoresArray,
    departmentScores
  };
}

// Legacy function for backward compatibility
export function processData(data: any[]): {
  dimensionScores: DimensionScore[];
  departmentScores: DepartmentScore[];
} {
  // Convert the data to CSV format
  const csv = Papa.unparse(data);
  
  // Use the new analysis function
  const result = analyzeCEAIData(csv);
  
  return {
    dimensionScores: result.dimensionScoresArray,
    departmentScores: result.departmentScores
  };
}
