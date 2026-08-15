"use client";

import { Suspense } from "react";
import ScannerContent from "./ScannerContent";

export default function GateScannerPage() {
  return (
    <Suspense fallback={<p>Carregando scanner...</p>}>
      <ScannerContent />
    </Suspense>
  );
}