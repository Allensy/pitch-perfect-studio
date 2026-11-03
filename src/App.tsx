import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { Studio } from '@/app/Studio';
import { StudioBoundary } from '@/app/StudioBoundary';
import type { Runtime } from '@/domain/types';
import './styles.css';

export default function App({ runtime }: { runtime: Runtime }) {
  return (
    <StudioBoundary runtime={runtime}>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <Studio runtime={runtime} />
        </LazyMotion>
      </MotionConfig>
    </StudioBoundary>
  );
}
