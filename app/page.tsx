// import Image from "next/image";
import Hero from "@/app/Hero";

import AC_type from "@/app/components/andcreate";
import TargetButton from "@/app/components/button";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - #andCreate",
    default: "#andCreate",
  },
  description: "I like to create something that is a win & win for everyone.",
};

/**
 * The root page of this Next.js app.
 *
 * This page is the entry point for the app, and is rendered on the server.
 *
 * @returns The JSX element for the root page.
 */
export default function Home() {
  return (
    <div className="h-screen relative">
      <div className="flex flex-col h-dvh items-center  align gap-5 lg:gap-8">
        <main className="flex-1 min-h-0 ">
          <Hero />
          <div className="relative z-10 h-dvh flex flex-col items-center justify-center">

            <h1 className="text-5 lg:text-7 text-gray-300 font-semibold italic font-montserrat py-8"><AC_type /></h1>
            <TargetButton />
          </div>
        </main>
        <footer className="relative z-10 flex-none">
          <div className="py-3">
            <p className="font-noto-sans">&copy; andCreate</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
