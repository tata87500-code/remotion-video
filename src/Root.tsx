import React from "react";
import { Composition } from "remotion";
import { ExplainerVideo, DURATION_IN_FRAMES, FPS } from "./ExplainerVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ExplainerVideo"
      component={ExplainerVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};