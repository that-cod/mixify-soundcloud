
import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, LockKeyhole } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <MainLayout>
      <div className="container px-4 mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-xl text-white/80 mb-12">
            At MixifyAI, we take your privacy seriously. This policy outlines how we collect, use, and protect your data.
          </p>
          
          <Card className="glass-card mb-12">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 rounded-full bg-mixify-purple/20 flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-mixify-purple-light" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold mb-4">Data Collection</h2>
                </div>
                
                <div className="md:w-2/3">
                  <p className="text-white/80 mb-4">
                    We collect minimal data necessary to provide our services. This includes account information and audio files you upload for mixing.
                  </p>
                  <p className="text-white/80">
                    Your audio files are stored securely and used solely for the purpose of creating AI-generated mixes.
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
                    <LockKeyhole className="h-8 w-8 text-mixify-purple-light" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                </div>
                
                <div className="md:w-2/3">
                  <p className="text-white/80 mb-4">
                    We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or destruction.
                  </p>
                  <p className="text-white/80">
                    All data transfers are encrypted using secure SSL technology, and we regularly audit our systems for potential vulnerabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-6">Your Rights</h2>
          <p className="text-white/80 mb-4">
            You have the right to access, correct, or delete your personal data at any time. To exercise these rights, please contact our support team.
          </p>
          <p className="text-white/80 mb-4">
            This privacy policy was last updated on {new Date().toLocaleDateString()}.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;
