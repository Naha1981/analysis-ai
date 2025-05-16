document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const csvFileInput = document.getElementById('csvFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const sampleDataBtn = document.getElementById('sampleDataBtn');
    const exportBtn = document.getElementById('exportBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    // Event listeners
    uploadBtn.addEventListener('click', processUploadedFile);
    sampleDataBtn.addEventListener('click', loadSampleData);
    exportBtn.addEventListener('click', exportResults);
    
    // Current results data
    let currentResults = null;
    
    // Process the uploaded CSV file
    function processUploadedFile() {
        const file = csvFileInput.files[0];
        if (!file) {
            alert('Please select a CSV file first.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csvData = e.target.result;
                const results = processCEAIData(csvData);
                displayResults(results);
                currentResults = results;
            } catch (error) {
                alert('Error processing file: ' + error.message);
                console.error(error);
            }
        };
        reader.onerror = function() {
            alert('Error reading file.');
        };
        reader.readAsText(file);
    }
    
    // Load sample data for demonstration
    function loadSampleData() {
        const results = generateSampleData();
        displayResults(results);
        currentResults = results;
    }
    
    // Export results as JSON
    function exportResults() {
        if (!currentResults) {
            alert('No data to export.');
            return;
        }
        
        const dataStr = JSON.stringify(currentResults, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'ceai_analysis_results.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Display results in the UI
    function displayResults(results) {
        // Show results section
        resultsSection.classList.remove('d-none');
        
        // Display average scores
        displayAverageScores(results.statistics.means);
        
        // Display strengths and weaknesses
        displayStrengthsWeaknesses(results.statistics.strong_dimensions, results.statistics.weak_dimensions);
        
        // Populate dimension scores table
        populateDimensionScoresTable(results.dimension_scores);
        
        // Populate statistics table
        populateStatisticsTable(results.statistics);
        
        // Populate cleaned data table
        populateCleanedDataTable(results.cleaned_data);
        
        // Generate interpretation (this would be replaced by Gemini API call in a real implementation)
        generateInterpretation(results);
    }
    
    // Display average scores with visual indicators
    function displayAverageScores(means) {
        const container = document.getElementById('averageScores');
        container.innerHTML = '';
        
        for (const dimension in means) {
            const score = means[dimension];
            const scoreClass = getScoreClass(score);
            
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-indicator';
            scoreItem.innerHTML = `
                <div class="score-label">${dimension}</div>
                <div class="score-bar">
                    <div class="score-fill ${scoreClass}" style="width: ${score * 20}%;"></div>
                </div>
                <div class="score-value">${score.toFixed(2)}</div>
            `;
            
            container.appendChild(scoreItem);
        }
    }
    
    // Display strengths and weaknesses
    function displayStrengthsWeaknesses(strongDimensions, weakDimensions) {
        const container = document.getElementById('strengthsWeaknesses');
        container.innerHTML = '';
        
        // Add strengths
        if (strongDimensions.length > 0) {
            const strengthsHeading = document.createElement('h6');
            strengthsHeading.textContent = 'Strong Dimensions (> 4.0)';
            container.appendChild(strengthsHeading);
            
            strongDimensions.forEach(dimension => {
                const item = document.createElement('div');
                item.className = 'strength-item';
                item.innerHTML = `<i class="bi bi-star-fill"></i> ${dimension}`;
                container.appendChild(item);
            });
        } else {
            const noStrengths = document.createElement('p');
            noStrengths.innerHTML = '<i>No strong dimensions identified.</i>';
            container.appendChild(noStrengths);
        }
        
        // Add weaknesses
        if (weakDimensions.length > 0) {
            const weaknessesHeading = document.createElement('h6');
            weaknessesHeading.className = 'mt-3';
            weaknessesHeading.textContent = 'Weak Dimensions (< 2.5)';
            container.appendChild(weaknessesHeading);
            
            weakDimensions.forEach(dimension => {
                const item = document.createElement('div');
                item.className = 'weakness-item';
                item.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${dimension}`;
                container.appendChild(item);
            });
        } else {
            const noWeaknesses = document.createElement('p');
            noWeaknesses.className = 'mt-3';
            noWeaknesses.innerHTML = '<i>No weak dimensions identified.</i>';
            container.appendChild(noWeaknesses);
        }
    }
    
    // Populate dimension scores table
    function populateDimensionScoresTable(dimensionScores) {
        const tableBody = document.querySelector('#dimensionScoresTable tbody');
        tableBody.innerHTML = '';
        
        dimensionScores.forEach((scoreRow, index) => {
            const row = document.createElement('tr');
            
            // Respondent number
            const respondentCell = document.createElement('td');
            respondentCell.textContent = `Respondent ${index + 1}`;
            row.appendChild(respondentCell);
            
            // Dimension scores
            const dimensions = [
                'Management Support', 
                'Work Discretion (Autonomy)', 
                'Rewards/Reinforcement', 
                'Time Availability', 
                'Organizational Boundaries'
            ];
            
            dimensions.forEach(dimension => {
                const cell = document.createElement('td');
                const score = scoreRow[dimension];
                cell.textContent = score.toFixed(2);
                
                // Add color coding
                if (score > 4.0) {
                    cell.classList.add('table-success');
                } else if (score < 2.5) {
                    cell.classList.add('table-danger');
                }
                
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        });
    }
    
    // Populate statistics table
    function populateStatisticsTable(statistics) {
        const tableBody = document.querySelector('#statisticsTable tbody');
        tableBody.innerHTML = '';
        
        const dimensions = Object.keys(statistics.means);
        
        dimensions.forEach(dimension => {
            const row = document.createElement('tr');
            
            // Dimension name
            const nameCell = document.createElement('td');
            nameCell.textContent = dimension;
            row.appendChild(nameCell);
            
            // Mean
            const meanCell = document.createElement('td');
            const meanValue = statistics.means[dimension];
            meanCell.textContent = meanValue.toFixed(2);
            if (meanValue > 4.0) {
                meanCell.classList.add('table-success');
            } else if (meanValue < 2.5) {
                meanCell.classList.add('table-danger');
            }
            row.appendChild(meanCell);
            
            // Median
            const medianCell = document.createElement('td');
            medianCell.textContent = statistics.medians[dimension].toFixed(2);
            row.appendChild(medianCell);
            
            // Standard Deviation
            const stdDevCell = document.createElement('td');
            stdDevCell.textContent = statistics.std_devs[dimension].toFixed(2);
            row.appendChild(stdDevCell);
            
            tableBody.appendChild(row);
        });
    }
    
    // Populate cleaned data table
    function populateCleanedDataTable(cleanedData) {
        const table = document.getElementById('cleanedDataTable');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');
        
        // Clear existing content
        while (thead.children.length > 1) {
            thead.removeChild(thead.lastChild);
        }
        tbody.innerHTML = '';
        
        // Add question headers
        for (let i = 0; i < cleanedData[0].length; i++) {
            const th = document.createElement('th');
            th.textContent = `Q${i + 1}`;
            thead.appendChild(th);
        }
        
        // Add data rows
        cleanedData.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            // Add respondent number
            const respondentCell = document.createElement('td');
            respondentCell.textContent = `Respondent ${rowIndex + 1}`;
            tr.appendChild(respondentCell);
            
            // Add data cells
            row.forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    }
    
    // Generate interpretation text (would be replaced by Gemini API in a real implementation)
    function generateInterpretation(results) {
        const interpretationDiv = document.getElementById('interpretation');
        const means = results.statistics.means;
        const strongDimensions = results.statistics.strong_dimensions;
        const weakDimensions = results.statistics.weak_dimensions;
        
        let interpretationText = '';
        
        // General assessment
        const avgOfMeans = Object.values(means).reduce((sum, val) => sum + val, 0) / Object.values(means).length;
        
        if (avgOfMeans > 4.0) {
            interpretationText += 'The organization demonstrates a highly supportive environment for corporate entrepreneurship. ';
        } else if (avgOfMeans > 3.5) {
            interpretationText += 'The organization demonstrates a moderately supportive environment for corporate entrepreneurship. ';
        } else if (avgOfMeans > 2.5) {
            interpretationText += 'The organization demonstrates some support for corporate entrepreneurship, but has significant room for improvement. ';
        } else {
            interpretationText += 'The organization demonstrates limited support for corporate entrepreneurship. ';
        }
        
        // Strong dimensions
        if (strongDimensions.length > 0) {
            interpretationText += strongDimensions.length === 1 
                ? `${strongDimensions[0]} stands out with an average score of ${means[strongDimensions[0]].toFixed(2)}, indicating ` 
                : 'The following dimensions stand out as organizational strengths: ';
                
            if (strongDimensions.includes('Management Support')) {
                interpretationText += 'management actively encourages and champions innovative initiatives. ';
            }
            if (strongDimensions.includes('Work Discretion (Autonomy)')) {
                interpretationText += 'employees feel empowered to make decisions and have freedom to determine how to do their work. ';
            }
            if (strongDimensions.includes('Rewards/Reinforcement')) {
                interpretationText += 'the organization effectively recognizes and rewards entrepreneurial behavior. ';
            }
            if (strongDimensions.includes('Time Availability')) {
                interpretationText += 'employees have sufficient time to pursue innovative ideas alongside their regular responsibilities. ';
            }
            if (strongDimensions.includes('Organizational Boundaries')) {
                interpretationText += 'the organization has flexible boundaries that promote resource sharing and collaboration. ';
            }
        }
        
        // Weak dimensions
        if (weakDimensions.length > 0) {
            interpretationText += 'Areas requiring significant improvement include: ';
            
            weakDimensions.forEach((dim, i) => {
                interpretationText += `${dim} (${means[dim].toFixed(2)})`;
                if (i < weakDimensions.length - 1) interpretationText += ', ';
                else interpretationText += '. ';
            });
            
            interpretationText += 'These low scores suggest barriers to entrepreneurial activity that should be addressed. ';
        } else {
            // Suggest improvements for lowest dimension if no weak dimensions
            const lowestDim = Object.keys(means).reduce((a, b) => means[a] < means[b] ? a : b);
            
            interpretationText += `While there are no critically weak dimensions, ${lowestDim} shows the most room for improvement with a score of ${means[lowestDim].toFixed(2)}. `;
        }
        
        // Conclusion
        interpretationText += 'To enhance corporate entrepreneurship, the organization should focus on strengthening the lower-scoring dimensions while maintaining its current strengths.';
        
        interpretationDiv.innerHTML = `<p>${interpretationText}</p>`;
    }
    
    // Helper function to get score class for visual indicators
    function getScoreClass(score) {
        if (score > 4.0) return 'high';
        if (score >= 3.0) return 'medium';
        if (score >= 2.5) return 'low';
        return 'very-low';
    }
    
    // Initialize with sample data
    loadSampleData();
});
