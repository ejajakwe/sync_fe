import React from "react";

// Komponen Textarea reusable
export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-4 py-2 bg-[#2d2d2d] text-white rounded-lg border border-[#444] focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400 resize-none ${className}`}
      {...props}
    />
  );
}