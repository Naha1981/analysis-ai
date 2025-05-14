
import React, { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileCheck2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  }, []);

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a CSV file"
      });
      return;
    }

    setSelectedFile(file);
    onFileSelected(file);
    toast({
      title: "File uploaded successfully",
      description: `${file.name} is ready for analysis`,
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
              <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)}>
                Change file
              </Button>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-purple-100 p-3 animate-pulse">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">Upload CEAI survey data</p>
                <p className="text-xs text-muted-foreground">
                  Drop your CSV file here or click to browse
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Required columns: Answer1-Answer48</span>
                </div>
                <div className="hidden sm:block">•</div>
                <span>Optional: department, timestamp</span>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
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

export default FileUploader;
