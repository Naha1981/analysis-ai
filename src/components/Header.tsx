
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return <header className="bg-white bg-opacity-80 backdrop-blur-sm py-4 px-6 shadow-sm border-b border-purple-200 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          <span className="font-semibold text-lg">CEAI Analytics</span>
        </Link>
      </div>
    </header>;
};
export default Header;
