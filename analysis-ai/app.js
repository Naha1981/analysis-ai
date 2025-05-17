document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const aiCsvFileInput = document.getElementById('aiCsvFile');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadSampleAiBtn = document.getElementById('loadSampleAiBtn');
    const exportAiBtn = document.getElementById('exportAiBtn');
    const aiResultsSection = document.getElementById('aiResultsSection');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // Navigation tabs
    const aiAnalysisTab = document.getElementById('ai-analysis-tab');
    const settingsTab = document.getElementById('settings-tab');
    
    // Content sections
    const aiAnalysisSection = document.getElementById('aiAnalysisSection');
    const settingsSection = document.getElementById('settingsSection');
    
    // Event listeners
    analyzeBtn.addEventListener('click', processWithAI);
    loadSampleAiBtn.addEventListener('click', loadSampleAIAnalysis);
    exportAiBtn.addEventListener('click', exportAIResults);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Tab navigation
    aiAnalysisTab.addEventListener('click', function(e) {
        e.preventDefault();
        showSection('ai-analysis');
    });
    
    settingsTab.addEventListener('click', function(e) {
        e.preventDefault();
        showSection('settings');
    });
    
    // Current results data
    let currentAIResults = null;
    
    // Load saved API key if available
    loadSavedSettings();
    
    // Show the appropriate section based on tab
    function showSection(section) {
        // Reset active state
        [aiAnalysisTab, settingsTab].forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all sections
        aiAnalysisSection.classList.add('d-none');
        settingsSection.classList.add('d-none');
        
        // Show selected section
        switch(section) {
            case 'ai-analysis':
                aiAnalysisTab.classList.add('active');
                aiAnalysisSection.classList.remove('d-none');
                break;
            case 'settings':
                settingsTab.classList.add('active');
                settingsSection.classList.remove('d-none');
                break;
        }
    }
    
    // Process CSV with AI
    async function processWithAI() {
        const file = aiCsvFileInput.files[0];
        if (!file) {
            showMessage('Please select a CSV file first', 'error');
            return;
        }

        showMessage('Processing with AI...', 'info');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

        // Display loading indicator
        aiResultsSection.classList.remove('d-none');
        const resultsContainer = document.getElementById('aiAnalysisResults');
        resultsContainer.innerHTML = `
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Analyzing your data with AI...</p>
            </div>
        `;

        try {
            // Read the file as text
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const csvData = e.target.result;
                    
                    // Call the API
                    const response = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ csvData }),
                    });

                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }

                    const result = await response.json();
                    displayAIResults(result.analysis);
                    currentAIResults = result.analysis;
                    
                    // If there's a note (e.g., fallback analysis was used), show it
                    if (result.note) {
                        const noteElement = document.createElement('div');
                        noteElement.className = 'alert alert-info mt-3';
                        noteElement.innerHTML = `<small><i class="bi bi-info-circle"></i> ${result.note}</small>`;
                        resultsContainer.appendChild(noteElement);
                    }
                    
                    showMessage('AI analysis complete!', 'success');
                } catch (error) {
                    console.error('Error processing with AI:', error);
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <h4 class="alert-heading">Analysis Error</h4>
                            <p>${error.message}</p>
                            <hr>
                            <p class="mb-0">Please try again or contact support if the problem persists.</p>
                        </div>
                    `;
                    showMessage('Error processing with AI: ' + error.message, 'error');
                } finally {
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = 'Analyze with AI';
                }
            };
            
            reader.onerror = function() {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Error reading file.
                    </div>
                `;
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = 'Analyze with AI';
                showMessage('Error reading file', 'error');
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Error initiating file read:', error);
            showMessage('Error: ' + error.message, 'error');
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = 'Analyze with AI';
        }
    }
    
    // Load sample AI analysis
    function loadSampleAIAnalysis() {
        aiResultsSection.classList.remove('d-none');
        const analysis = generateSampleGeminiAnalysis();
        displayAIResults(analysis);
        currentAIResults = analysis;
    }
    
    // This section has been removed as we're focusing only on AI analysis
    
    // Export AI results as text
    function exportAIResults() {
        if (!currentAIResults) {
            alert('No AI analysis to export.');
            return;
        }
        
        const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(currentAIResults);
        
        const exportFileDefaultName = 'ceai_ai_analysis.txt';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Save user settings
    function saveSettings() {
        const theme = document.getElementById('darkTheme').checked ? 'dark' : 'light';
        
        // Save to local storage
        localStorage.setItem('ceaiTheme', theme);
        
        // Apply theme
        applyTheme(theme);
        
        alert('Settings saved successfully!');
    }
    
    // Load saved settings
    function loadSavedSettings() {
        const savedTheme = localStorage.getItem('ceaiTheme') || 'light';
        
        if (savedTheme === 'dark') {
            document.getElementById('darkTheme').checked = true;
        } else {
            document.getElementById('lightTheme').checked = true;
        }
        
        // Apply theme
        applyTheme(savedTheme);
    }
    
    // Apply theme
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    // Display notifications to the user
    function showMessage(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Create toast content
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Add toast to container
        toastContainer.appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    }
    
    // Display AI analysis results
    function displayAIResults(analysis) {
        const resultsContainer = document.getElementById('aiAnalysisResults');
        
        // Convert markdown to HTML (simple implementation)
        let html = analysis
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            .replace(/<\/li>\n<li>/g, '</li><li>')
            .replace(/<\/li>\n/g, '</li></ul>\n')
            .replace(/\n<li>/g, '\n<ul><li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>');
        
        resultsContainer.innerHTML = html;
    }
    
    // Initialize with sample AI analysis
    loadSampleAIAnalysis();
});
