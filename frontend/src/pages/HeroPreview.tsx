import ShaderShowcase from "@/components/ui/hero";

// Standalone preview route for the new shader hero component.
// Wire this into Home.tsx (or wherever it belongs) once you've reviewed it,
// then feel free to delete this file and its route in App.tsx.
export default function HeroPreview() {
  return (
    <div className="min-h-screen h-full w-full">
      <ShaderShowcase />
    </div>
  );
}
