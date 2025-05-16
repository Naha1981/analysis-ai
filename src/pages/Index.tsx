
import React, { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/Header';
import AnalysisSection from '@/components/AnalysisSection';
import EmptyState from '@/components/EmptyState';
import ExcelProcessor from '@/components/ExcelProcessor';
import { DimensionScore, DepartmentScore } from '@/utils/ceai-analysis';
import { Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([]);
  const [departmentScores, setDepartmentScores] = useState<DepartmentScore[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDataProcessed = (results: any) => {
    setAnalysisResult(results);
    setDimensionScores(results.dimensionScoresArray);
    setDepartmentScores(results.departmentScores);
    setHasData(true);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header />
      
      <main className="container mx-auto px-4">
        <div className="grid gap-6">
          {!hasData ? (
            <EmptyState onUpload={handleUploadClick} />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Analysis Results</h2>
                <div className="flex gap-2">
                  <Link to="/ai-analysis">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Analysis
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="animate-enter">
                <ExcelProcessor onDataProcessed={handleDataProcessed} />
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-4" />
                  <p className="text-muted-foreground">Analyzing survey data...</p>
                </div>
              ) : (
                <AnalysisSection 
                  dimensionScores={dimensionScores}
                  departmentScores={departmentScores}
                  analysisResult={analysisResult}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      </main>
      
      <input 
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const processor = new ExcelProcessor({ onDataProcessed: handleDataProcessed });
            processor.handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

export default Index;
