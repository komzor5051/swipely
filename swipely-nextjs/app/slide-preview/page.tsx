import { Suspense } from "react";
import SlidePreviewClient from "./SlidePreviewClient";

export default function SlidePreviewPage() {
  return (
    <Suspense>
      <SlidePreviewClient />
    </Suspense>
  );
}
