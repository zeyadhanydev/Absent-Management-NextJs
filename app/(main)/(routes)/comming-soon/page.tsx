import { Card } from "@/components/ui/card";

export default function CommingSoon() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black/95">
      <Card className="relative w-full max-w-4xl mx-4 overflow-hidden rounded-lg shadow-xl">
        <video autoPlay playsInline loop className="w-full h-full object-cover">
          <source src="/comming-soon.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Card>
    </div>
  );
}
