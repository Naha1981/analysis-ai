
import React from 'react';
import { ArrowTrendingUpIcon } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white bg-opacity-80 backdrop-blur-sm py-4 px-6 shadow-sm border-b border-purple-200 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-2 rounded-lg shadow-md">
            <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">CEAI Analytics</h1>
            <p className="text-xs text-muted-foreground">Version 10.0</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm font-medium text-muted-foreground">Enterprise Edition</span>
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Active
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
