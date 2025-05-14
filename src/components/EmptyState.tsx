
import React from 'react';
import { ChartBarIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  onUpload: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onUpload }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-enter">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mb-6">
          <ChartBarIcon className="h-12 w-12 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CEAI Analytics Platform</h2>
        <p className="text-muted-foreground mb-6">
          Upload your Corporate Entrepreneurship Assessment Instrument (CEAI) survey data to analyze the five key dimensions and gain valuable insights.
        </p>
        
        <div className="flex flex-col space-y-2">
          <Button onClick={onUpload} className="w-full">Upload Survey Data</Button>
          <Button variant="link" className="text-sm" onClick={() => window.open('https://drive.google.com/uc?export=download&id=1ULsg-aeNrMup0lAXs53pHYL3k9YfyOua', '_blank')}>
            Download Sample CSV
          </Button>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-white rounded-lg p-4 border border-muted shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-1">5 Dimensions</h3>
            <p className="text-xs text-muted-foreground">Management Support, Autonomy, Rewards, Time Availability, Organizational Boundaries</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-muted shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-1">48 Questions</h3>
            <p className="text-xs text-muted-foreground">Comprehensive analysis with Cronbach's Alpha reliability metrics</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium">New! AI-Powered Analysis</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Try our new Gemini AI integration for advanced insights and detailed reports
          </p>
          <Link to="/ai-analysis">
            <Button variant="outline" size="sm" className="w-full">
              Try AI Analysis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
