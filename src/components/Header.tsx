
import React from 'react';
import { TrendingUp } from 'lucide-react';

const Header = () => {
  return <header className="bg-white bg-opacity-80 backdrop-blur-sm py-4 px-6 shadow-sm border-b border-purple-200 mb-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          <span className="font-semibold text-lg">CEAI Analytics</span>
        </div>
      </div>
    </header>;
};

export default Header;
