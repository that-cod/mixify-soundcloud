
import { MixingStage } from './types';

export const MIXING_STAGES: Array<{
  id: MixingStage;
  label: string;
  description: string;
  adjustableParams: string[];
}> = [
  {
    id: 'prepare',
    label: 'Prepare Tracks',
    description: 'Loading and preprocessing audio files',
    adjustableParams: []
  },
  {
    id: 'stemSeparation',
    label: 'Stem Separation',
    description: 'Separating vocals, drums, bass, and other instruments',
    adjustableParams: ['stemSeparationQuality']
  },
  {
    id: 'bpmMatching',
    label: 'BPM Matching',
    description: 'Synchronizing the tempo of both tracks',
    adjustableParams: ['bpmMatchEnabled', 'bpmMatchStrength']
  },
  {
    id: 'vocalProcessing',
    label: 'Vocal Processing',
    description: 'Adjusting vocal levels and applying effects',
    adjustableParams: ['vocalLevel1', 'vocalLevel2', 'vocalEQ']
  },
  {
    id: 'beatProcessing',
    label: 'Beat Processing',
    description: 'Adjusting drum and bass levels',
    adjustableParams: ['beatLevel1', 'beatLevel2', 'beatEQ']
  },
  {
    id: 'effectsApplication',
    label: 'Effects',
    description: 'Applying audio effects to enhance the mix',
    adjustableParams: ['echo', 'reverb', 'compression']
  },
  {
    id: 'finalMix',
    label: 'Final Mix',
    description: 'Combining all elements into final output',
    adjustableParams: ['crossfadeLength', 'outputGain', 'stereoWidth']
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Mix completed successfully',
    adjustableParams: []
  }
];
