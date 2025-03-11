
import React from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Music3, AudioWaveform, Upload, Download, Headphones } from 'lucide-react';

const Index: React.FC = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-mixify-purple/20 to-transparent opacity-30" />
        
        <div className="container px-4 mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-2 bg-mixify-purple/20 rounded-full mb-4">
              <Music3 className="h-6 w-6 text-mixify-purple-light" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              AI-Powered Music Mixing
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl">
              Seamlessly blend two tracks into professional-quality mixes with the power of AI. 
              Upload, analyze, and create amazing mashups in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link to="/mixer">
                  <Button size="lg" className="bg-mixify-purple hover:bg-mixify-purple-dark">
                    <Headphones className="mr-2 h-5 w-5" />
                    Start Mixing
                  </Button>
                </Link>
              ) : (
                <Link to="/signup">
                  <Button size="lg" className="bg-mixify-purple hover:bg-mixify-purple-dark">
                    Get Started
                  </Button>
                </Link>
              )}
              <Link to="/about">
                <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/5">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-black/30">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6 rounded-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-mixify-purple/20 mb-4">
                <Upload className="h-6 w-6 text-mixify-purple-light" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Tracks</h3>
              <p className="text-white/70">
                Upload two songs you want to mix. We support MP3, WAV, and other common audio formats.
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-mixify-purple/20 mb-4">
                <AudioWaveform className="h-6 w-6 text-mixify-purple-light" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
              <p className="text-white/70">
                Our AI analyzes tempo, key, and patterns to create the perfect blend between your tracks.
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-mixify-purple/20 mb-4">
                <Download className="h-6 w-6 text-mixify-purple-light" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Download Mix</h3>
              <p className="text-white/70">
                Preview your AI-generated mix and download the final track in high quality.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="glass-card p-8 md:p-12 rounded-xl bg-gradient-to-r from-mixify-purple/20 to-mixify-dark">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
              <AudioWaveform className="h-12 w-12 text-mixify-purple-light mb-6" />
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Create Your First Mix?
              </h2>
              
              <p className="text-xl text-white/80 mb-8">
                Join thousands of music enthusiasts creating amazing mixes with MixifyAI.
              </p>
              
              {user ? (
                <Link to="/mixer">
                  <Button size="lg" className="bg-mixify-purple hover:bg-mixify-purple-dark">
                    Go to Mix Studio
                  </Button>
                </Link>
              ) : (
                <Link to="/signup">
                  <Button size="lg" className="bg-mixify-purple hover:bg-mixify-purple-dark">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
