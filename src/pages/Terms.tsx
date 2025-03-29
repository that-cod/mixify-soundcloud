
import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Scale } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <MainLayout>
      <div className="container px-4 mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
          <p className="text-xl text-white/80 mb-12">
            By using MixifyAI, you agree to comply with and be bound by the following terms and conditions.
          </p>
          
          <Card className="glass-card mb-12">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-mixify-purple-light" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold mb-4">Usage Terms</h2>
                </div>
                
                <div className="md:w-2/3">
                  <p className="text-white/80 mb-4">
                    MixifyAI provides an AI-powered music mixing service. You may use our services for personal or commercial use, subject to these terms.
                  </p>
                  <p className="text-white/80">
                    You are responsible for ensuring you have the necessary rights to upload and mix any audio content using our platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card mb-12">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                    <Scale className="h-8 w-8 text-mixify-purple-light" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold mb-4">Copyright</h2>
                </div>
                
                <div className="md:w-2/3">
                  <p className="text-white/80 mb-4">
                    By uploading content to MixifyAI, you affirm that you have all necessary rights to that content and grant us a license to process it for mixing purposes.
                  </p>
                  <p className="text-white/80">
                    Any mixes created using our platform are owned by you, but we retain rights to the underlying technology and algorithms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-6">Limitation of Liability</h2>
          <p className="text-white/80 mb-4">
            MixifyAI provides its services "as is" without warranties of any kind. We are not liable for any damages arising from your use of our services.
          </p>
          <p className="text-white/80 mb-4">
            These terms were last updated on {new Date().toLocaleDateString()}.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Terms;
