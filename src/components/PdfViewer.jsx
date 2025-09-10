import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

// Helper function to convert a Data URL to a Blob
function dataURLtoBlob(dataurl) {
  const commaIndex = dataurl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Invalid data URL format: no comma found.");
  }
  const header = dataurl.substring(0, commaIndex);
  let base64Data = dataurl.substring(commaIndex + 1);
  if (!base64Data) {
    throw new Error("Base64 data is empty.");
  }
  base64Data = base64Data.trim().replace(/\s/g, "");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
  const byteString = atob(base64Data);
  const byteNumbers = new Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteNumbers[i] = byteString.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

const PdfViewer = () => {
  // ✅ Get the entire file state and handle multiple formats
  const fileState = useSelector((state) => state.file);
  const [pdfURL, setPdfURL] = useState(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    console.log("PDF Viewer - File state:", fileState);

    // ✅ Handle different state formats
    let dataUrl = null;

    if (typeof fileState === "string") {
      // Legacy format - direct URL string
      dataUrl = fileState;
    } else if (fileState && typeof fileState === "object") {
      // New format - check for url property or file property
      dataUrl = fileState.url || fileState.file;
    }

    console.log("PDF Viewer - Data URL:", dataUrl, typeof dataUrl);

    // ✅ Ensure dataUrl is a string before calling startsWith
    if (dataUrl && typeof dataUrl === "string") {
      let blobUrl;

      if (dataUrl.startsWith("data:")) {
        try {
          const blob = dataURLtoBlob(dataUrl);
          blobUrl = URL.createObjectURL(blob);
          console.log("PDF Viewer - Created blob URL from data URL");
        } catch (error) {
          console.error("Failed to convert data URL to Blob:", error);
          return;
        }
      } else if (dataUrl.startsWith("blob:")) {
        blobUrl = dataUrl;
        console.log("PDF Viewer - Using existing blob URL");
      } else if (dataUrl.startsWith("http")) {
        // Handle HTTP URLs directly
        blobUrl = dataUrl;
        console.log("PDF Viewer - Using HTTP URL");
      } else {
        console.error("Unknown URL format:", dataUrl);
        return;
      }

      setPdfURL(blobUrl);

      return () => {
        // Only revoke if we created the blob URL from a data URL
        if (
          dataUrl.startsWith("data:") &&
          blobUrl &&
          blobUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(blobUrl);
        }
      };
    } else {
      // Clear PDF URL if no valid data URL
      setPdfURL(null);
      console.log("PDF Viewer - No valid data URL found");
    }
  }, [fileState]);

  return (
    <div>
      {pdfURL ? (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
          <div
            style={{
              height: "90vh",
              backgroundColor: "black",
              position: "relative",
              width: "45vw",
              zIndex: 100,
              overflow: "visible",
            }}
          >
            <Viewer fileUrl={pdfURL} plugins={[defaultLayoutPluginInstance]} />
          </div>
        </Worker>
      ) : (
        <p>No PDF to display</p>
      )}
    </div>
  );
};

export default PdfViewer;
