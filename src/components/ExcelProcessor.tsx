import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileCheck2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { analyzeCEAIData } from '@/utils/ceai-analysis';

interface ExcelProcessorProps {
  onDataProcessed: (results: any) => void;
}

// Define a module augmentation to add static methods to the component
interface ExcelProcessorComponent extends React.FC<ExcelProcessorProps> {
  handleFile: (file: File, callback: (results: any) => void) => void;
}

// Helper functions for static method
const processCSVFileStatic = async (file: File, callback: (results: any) => void) => {
  try {
    const text = await file.text();
    
    // Process the data
    const results = analyzeCEAIData(text);
    callback(results);
  } catch (error) {
    console.error("Error processing CSV file:", error);
  }
};

const processExcelFileStatic = async (file: File, callback: (results: any) => void) => {
  try {
    const data = await readExcelFileStatic(file);
    
    // Process the data
    const results = analyzeCEAIData(data);
    callback(results);
  } catch (error) {
    console.error("Error processing Excel file:", error);
  }
};

const readExcelFileStatic = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read file data"));
          return;
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // If first row has column headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Create CSV data with headers
        const csvData = Papa.unparse({
          fields: headers,
          data: rows
        });
        
        resolve(csvData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsBinaryString(file);
  });
};

// Static method to handle file processing
const handleFileStatic = (file: File, callback: (results: any) => void) => {
  // Check if file is Excel or CSV
  if (!file.name.endsWith('.xlsx') && 
      !file.name.endsWith('.xls') && 
      !file.name.endsWith('.csv')) {
    console.error("Invalid file type");
    return;
  }
  
  // Process CSV file
  if (file.name.endsWith('.csv')) {
    processCSVFileStatic(file, callback);
    return;
  }
  
  // Process Excel file
  processExcelFileStatic(file, callback);
};

const ExcelProcessor: React.FC<ExcelProcessorProps> = ({ onDataProcessed }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is Excel or CSV
    if (!file.name.endsWith('.xlsx') && 
        !file.name.endsWith('.xls') && 
        !file.name.endsWith('.csv')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file"
      });
      return;
    }

    setSelectedFile(file);
    
    // Process immediately if it's a CSV file
    if (file.name.endsWith('.csv')) {
      processCSVFile(file);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    
    try {
      const data = await readExcelFile(selectedFile);
      
      // Process the data
      const results = analyzeCEAIData(data);
      onDataProcessed(results);
      
      toast({
        title: "Analysis complete",
        description: `Processed ${results.dimensionScores.length} survey responses`
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processCSVFile = async (file: File) => {
    setIsLoading(true);
    
    try {
      const text = await file.text();
      
      // Process the data
      const results = analyzeCEAIData(text);
      onDataProcessed(results);
      
      toast({
        title: "Analysis complete",
        description: `Processed ${results.dimensionScores.length} survey responses`
      });
    } catch (error) {
      console.error("Error processing CSV file:", error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file data"));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // If first row has column headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          // Create CSV data with headers
          const csvData = Papa.unparse({
            fields: headers,
            data: rows
          });
          
          resolve(csvData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  return (
    <Card className={`p-6 animate-enter transition-all ${isDragging ? 'border-purple-400 bg-purple-50' : 'border-purple-200'}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-purple-200'} transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto flex flex-col items-center justify-center gap-4">
          {selectedFile ? (
            <>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <FileCheck2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-green-600">File selected</p>
                <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)}>
                  Change file
                </Button>
                <Button 
                  size="sm" 
                  onClick={processExcelFile}
                  disabled={isLoading || !selectedFile || selectedFile.name.endsWith('.csv')}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Process Excel File'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-purple-100 p-3 animate-pulse">
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">Upload CEAI Excel Data</p>
                <p className="text-xs text-muted-foreground">
                  Drop your Excel (.xlsx) or CSV file here or click to browse
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Required: 48 CEAI survey items</span>
                </div>
                <div className="hidden sm:block">•</div>
                <span>Likert Scale Responses</span>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button size="sm" variant="default" className="cursor-pointer" asChild>
                  <span>Browse files</span>
                </Button>
              </label>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

// Cast the component to our extended interface type and add the static method
const ExcelProcessorWithStatic = ExcelProcessor as ExcelProcessorComponent;
ExcelProcessorWithStatic.handleFile = handleFileStatic;

export default ExcelProcessorWithStatic;
