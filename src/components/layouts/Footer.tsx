
import React from 'react';
import { Link } from 'react-router-dom';
import { Music3, Github, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-lg border-t border-white/10 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Music3 className="h-6 w-6 text-mixify-purple-light" />
            <span className="text-lg font-bold text-white">
              Mixify<span className="text-mixify-accent">AI</span>
            </span>
          </div>
          
          <div className="flex gap-8">
            <Link to="/" className="text-gray-300 hover:text-white text-sm">
              Home
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-white text-sm">
              About
            </Link>
            {/* Remove links to non-existent routes */}
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Privacy
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Terms
            </a>
          </div>
          
          <div className="flex gap-4">
            <a href="#" className="text-gray-300 hover:text-white">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} MixifyAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
