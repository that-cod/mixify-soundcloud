
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Music3, User, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-black/50 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Music3 className="h-8 w-8 text-mixify-purple-light" />
            <Link to="/" className="text-xl font-bold text-white">
              Mixify<span className="text-mixify-accent">AI</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Home
              </Link>
              {user && (
                <Link to="/mixer" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                  Mix Studio
                </Link>
              )}
              <Link to="/about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                About
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/profile" className="text-white hover:text-mixify-purple-light">
                  <User className="h-5 w-5" />
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="border-white/20 hover:border-white/40"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-white/20 hover:border-white/40">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-mixify-purple hover:bg-mixify-purple-dark">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
