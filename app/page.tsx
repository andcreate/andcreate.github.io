// import Image from "next/image";
import Hero from "@/app/Hero";

import Logotype_A from "@/app/components/logos/logotype_A";
import ROGIX_LOGO from "@/app/components/logos/rogixLogo";
import Sl_logo from "@/app/components/logos/sl_logo";
import AC_type from "@/app/components/andcreate";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - #andCreate",
    default: "#andCreate",
  },
  description: "I like to create something that is a win & win for everyone.",
};

export default function Home() {
  return (
    <div className="h-screen relative">
      <div className="flex flex-col h-dvh items-center  align gap-5 lg:gap-8">
        <main className="flex-1 min-h-0 ">
          <Hero />
          <div className="relative z-10 h-dvh flex flex-col items-center justify-center">

            <h1 className="text-5 lg:text-8 text-gray-300 font-bold italic font-montserrat py-8"><AC_type /></h1>
            <dl className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
              <dt className="col-span-1 self-center">
                <span className="text-3 lg:text-5 font-doto">- Web Development</span>
              </dt>
              <dd className="col-span-1 self-center">
                <a href="https://www.andcre.com" target="_blank">
                  <Logotype_A style={{ width: "170px", height: "50px" }} />
                </a>
              </dd>
              <dt className="col-span-1 self-center">
                <span className="text-3 lg:text-5 font-doto">- VR Portfolio</span>
              </dt>
              <dd className="col-span-1 self-center">
                <a href="https://virtual.andcre.com" target="_blank">
                  <ROGIX_LOGO style={{ width: "50px", height: "50px" }} color={"#FFF"} />
                </a>
              </dd>
              <dt className="col-span-1 self-center">
                <span className="text-3 lg:text-5 font-doto">- Degital Contents</span>
              </dt>
              <dd className="col-span-1 self-center">
                <a href="https://andcreate.booth.pm/" target="_blank">
                  <Sl_logo style={{ width: "170px", height: "50px" }} />
                </a>
              </dd>
              <dt className="col-span-1 self-center">
                <span className="text-3 lg:text-5 font-doto">- Degital Contents Docs</span>
              </dt>
              <dd className="col-span-1 self-center">
                <a href="https://andcreate.github.io/vdc/" target="_blank">
                  Studio Louie Docs
                </a>
              </dd>
            </dl>
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
