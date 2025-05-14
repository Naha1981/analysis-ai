
import React, { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import AnalysisSection from '@/components/AnalysisSection';
import EmptyState from '@/components/EmptyState';
import { processData, DimensionScore, DepartmentScore } from '@/utils/ceai-analysis';
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

  const handleFileSelected = (file: File) => {
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Validate the CSV structure
          const firstRow = results.data[0] as Record<string, string>;
          const missingColumns = [];
          
          // Check if required columns exist
          for (let i = 1; i <= 48; i++) {
            const columnName = `Answer${i}`;
            if (!firstRow.hasOwnProperty(columnName)) {
              missingColumns.push(columnName);
            }
          }
          
          if (missingColumns.length > 0) {
            toast({
              variant: "destructive",
              title: "Invalid CSV format",
              description: `Missing required columns: ${missingColumns.slice(0, 3).join(', ')}${missingColumns.length > 3 ? '...' : ''}`
            });
            setIsLoading(false);
            return;
          }
          
          // Process the data
          const { dimensionScores, departmentScores } = processData(results.data as Record<string, string>[]);
          
          setDimensionScores(dimensionScores);
          setDepartmentScores(departmentScores);
          setHasData(true);
          
          toast({
            title: "Analysis complete",
            description: `Analyzed ${results.data.length} survey responses`
          });
        } catch (error) {
          console.error("Error processing data:", error);
          toast({
            variant: "destructive",
            title: "Analysis failed",
            description: "An error occurred while processing the data"
          });
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast({
          variant: "destructive",
          title: "Parsing failed",
          description: "Failed to parse the CSV file"
        });
        setIsLoading(false);
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
                <FileUploader onFileSelected={handleFileSelected} />
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
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelected(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

export default Index;
