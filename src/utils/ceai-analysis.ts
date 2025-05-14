
// CEAI Analysis Utilities

export interface DimensionScore {
  name: string;
  score: number;
  reliability: number;
}

export interface DepartmentScore {
  department: string;
  [key: string]: string | number;
}

// Define the dimensions and their associated questions
export const dimensions = {
  'Management Support': { questions: Array.from({length: 10}, (_, i) => `Answer${i+1}`), scores: [] as number[] },
  'Autonomy': { questions: Array.from({length: 10}, (_, i) => `Answer${i+11}`), scores: [] as number[] },
  'Rewards': { questions: Array.from({length: 9}, (_, i) => `Answer${i+21}`), scores: [] as number[] },
  'Time Availability': { questions: Array.from({length: 9}, (_, i) => `Answer${i+30}`), scores: [] as number[] },
  'Organizational Boundaries': { questions: Array.from({length: 10}, (_, i) => `Answer${i+39}`), scores: [] as number[] }
};

// Process the CSV data
export function processData(data: any[]): {
  dimensionScores: DimensionScore[];
  departmentScores: DepartmentScore[];
} {
  // Reset scores arrays
  Object.keys(dimensions).forEach(dim => {
    dimensions[dim as keyof typeof dimensions].scores = [];
  });
  
  // Compute dimension scores and collect data
  const departmentScores: Record<string, { counts: number, totals: Record<string, number> }> = {};
  
  data.forEach(row => {
    Object.keys(dimensions).forEach(dim => {
      const dimKey = dim as keyof typeof dimensions;
      const scores = dimensions[dimKey].questions.map(q => parseFloat(row[q])).filter(v => !isNaN(v));
      
      if (scores.length === dimensions[dimKey].questions.length) {
        const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
        dimensions[dimKey].scores.push(avg);

        // Department breakdown
        const dept = row.department || 'Unknown';
        if (!departmentScores[dept]) {
          departmentScores[dept] = { counts: 0, totals: {} };
          Object.keys(dimensions).forEach(d => departmentScores[dept].totals[d] = 0);
        }
        departmentScores[dept].totals[dim] += avg;
        departmentScores[dept].counts++;
      }
    });
  });

  // Calculate overall averages
  const dimensionScores: DimensionScore[] = [];
  Object.keys(dimensions).forEach(dim => {
    const dimKey = dim as keyof typeof dimensions;
    const scores = dimensions[dimKey].scores;
    const average = scores.length > 0 ? scores.reduce((sum, val) => sum + val, 0) / scores.length : 0;
    
    // Calculate Cronbach's Alpha
    const questionScores = data.map(row => 
      dimensions[dimKey].questions.map(q => parseFloat(row[q])).filter(v => !isNaN(v))
    ).filter(arr => arr.length === dimensions[dimKey].questions.length);
    
    const reliability = calculateCronbachAlpha(questionScores);
    
    dimensionScores.push({
      name: dim,
      score: average,
      reliability
    });
  });

  // Format department scores for display
  const formattedDepartmentScores: DepartmentScore[] = Object.keys(departmentScores).map(dept => {
    const deptData: DepartmentScore = { department: dept };
    Object.keys(dimensions).forEach(dim => {
      deptData[dim] = (departmentScores[dept].totals[dim] / departmentScores[dept].counts).toFixed(2);
    });
    return deptData;
  });

  return {
    dimensionScores,
    departmentScores: formattedDepartmentScores
  };
}

// Calculate Cronbach's Alpha
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
