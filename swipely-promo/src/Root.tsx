import React from "react";
import { Composition } from "remotion";
import { SwipelyPromo } from "./SwipelyPromo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SwipelyPromo"
      component={SwipelyPromo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
