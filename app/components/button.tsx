"use client";
import TargetCursor from '@/app/components/TargetCursor/TargetCursor';

export default function App() {
  return (
    <div className="flex flex-col gap-4">
      <TargetCursor
        spinDuration={0}
        hideDefaultCursor={true}
      />
        <a href="https://www.andcre.com/" target="_blank" className="cursor-target font-doto font-bold text-5 py-2 px-4 border border-white">
        Web Development
        </a>
        <a href="https://virtual.andcre.com/" className="cursor-target font-doto font-bold text-5 py-2 px-4 border border-white">
        VR Portfolio
        </a>
        <a href="https://andcreate.booth.pm/" target="_blank" className="cursor-target font-doto font-bold text-5 py-2 px-4 border border-white">
        Booth
        </a>
        <a href="https://andcreate.github.io/vdc/" target="_blank" className="cursor-target font-doto font-bold text-5 py-2 px-4 border border-white">
        Documents
        </a>
    </div>
  );
}