import React from "react";
import { Composition } from "remotion";
import { SwipelyPromo } from "./SwipelyPromo";
import { LaunchPromo } from "./LaunchPromo";
import { PhonePromo } from "./PhonePromo";

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
    <Composition
      id="LaunchPromo"
      component={LaunchPromo}
      durationInFrames={150}
      fps={30}
      width={800}
      height={800}
    />
    <Composition
      id="PhonePromo"
      component={PhonePromo}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
