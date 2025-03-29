
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Music, Sparkles, Info } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto">
        <section className="py-12 px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-mixify-purple-light to-mixify-accent">
            AI-Powered Audio Mixing
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mb-8">
            Upload your tracks and let our AI create professional-quality mixes in seconds.
            Adjust parameters or use natural language to describe your desired sound.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button 
              className="bg-mixify-purple hover:bg-mixify-purple-dark text-white px-8 py-6 text-lg"
              onClick={() => navigate('/mixer')}
            >
              <Music className="mr-2 h-5 w-5" /> 
              Start Mixing
            </Button>
            <Button 
              variant="outline" 
              className="px-8 py-6 text-lg"
              onClick={() => navigate('/multi-track-mixer')}
            >
              <Sparkles className="mr-2 h-5 w-5" /> 
              Advanced Multi-Track Studio
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Simple Mixing</h3>
              <p className="text-white/70">
                Upload two tracks and let our AI handle the technical details to create a seamless mix.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">AI-Guided</h3>
              <p className="text-white/70">
                Describe your desired mix in plain language and our AI will set the optimal parameters.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Advanced Studio</h3>
              <p className="text-white/70">
                Access professional multi-track mixing with advanced effects and complete control.
              </p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Home;
