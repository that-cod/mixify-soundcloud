
import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { AudioWaveform, Music3, Lightbulb, Sparkles } from 'lucide-react';

const About: React.FC = () => {
  return (
    <MainLayout>
      <div className="container px-4 mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About MixifyAI</h1>
          <p className="text-xl text-white/80 mb-12">
            A revolutionary platform that combines artificial intelligence with music mixing to create professional-quality mashups.
          </p>
          
          <Card className="glass-card mb-12">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                    <Lightbulb className="h-8 w-8 text-mixify-purple-light" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                </div>
                
                <div className="md:w-2/3">
                  <p className="text-white/80 mb-4">
                    MixifyAI was created with a simple mission: to democratize music mixing and make it accessible to everyone, regardless of their technical expertise or equipment.
                  </p>
                  <p className="text-white/80">
                    We believe that creativity shouldn't be limited by technical barriers. Our platform empowers music enthusiasts, DJs, content creators, and casual listeners to create professional-quality mashups with just a few clicks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="glass-card overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                  <Music3 className="h-6 w-6 text-mixify-purple-light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Audio Analysis</h3>
                <p className="text-white/70">
                  Our AI analyzes your music tracks to identify tempo, key, genre, and other important musical elements.
                </p>
              </div>
              <div className="h-2 bg-gradient-to-r from-mixify-purple to-mixify-accent" />
            </Card>
            
            <Card className="glass-card overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                  <AudioWaveform className="h-6 w-6 text-mixify-purple-light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Beat Matching</h3>
                <p className="text-white/70">
                  The system automatically aligns beats, adjusts tempos, and creates seamless transitions between tracks.
                </p>
              </div>
              <div className="h-2 bg-gradient-to-r from-mixify-purple to-mixify-accent" />
            </Card>
            
            <Card className="glass-card overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-mixify-purple-light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Mixing</h3>
                <p className="text-white/70">
                  Advanced algorithms handle volume balancing, EQ adjustments, and effects to create professional quality mixes.
                </p>
              </div>
              <div className="h-2 bg-gradient-to-r from-mixify-purple to-mixify-accent" />
            </Card>
          </div>
          
          <h2 className="text-2xl font-bold mb-6">Technology</h2>
          
          <p className="text-white/80 mb-6">
            MixifyAI is built with cutting-edge technologies:
          </p>
          
          <ul className="list-disc pl-6 mb-12 text-white/80 space-y-2">
            <li><strong>Audio Analysis:</strong> We use advanced signal processing and machine learning to analyze musical attributes.</li>
            <li><strong>Beat Detection:</strong> Precise tempo and beat identification for perfect synchronization.</li>
            <li><strong>Vocal Isolation:</strong> Sophisticated algorithms to identify and properly handle vocals from both tracks.</li>
            <li><strong>Harmonic Mixing:</strong> Key detection and adjustment to ensure harmonic compatibility.</li>
            <li><strong>Cloud Processing:</strong> All heavy computational work happens in the cloud, so you don't need a powerful computer.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mb-6">Get Started Today</h2>
          
          <p className="text-white/80 mb-6">
            Ready to create your first mix? Sign up for a free account and start transforming your music today.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
