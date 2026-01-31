import Hero from "@/components/Hero";
import { ChromaGrid } from "@/components/ChromaGrid";

const gridItems = [
  {
    image: "/thumb_andcre.png",
    title: "andCreate",
    subtitle: "Web Development",
    handle: "@alpha",
    borderColor: "#249aa0",
    gradient: "linear-gradient(145deg, #165a62, #000)",
    url: "https://andcre.com/",
  },
  {
    image: "/thumb_rogix.png",
    title: "ROGIX Portfolio",
    subtitle: "VR PROJECT",
    handle: "@beta",
    borderColor: "#777777",
    gradient: "linear-gradient(210deg, #191919, #000)",
    url: "https://virtual.andcre.com/",
  },
  {
    image: "/thumb_booth.png",
    title: "Booth",
    subtitle: "Unity Props",
    handle: "@gamma",
    borderColor: "#ffa4a9",
    gradient: "linear-gradient(165deg, #fc4d50, #000)",
    url: "https://andcreate.booth.pm/",
  },
  {
    image: "/thumb_docs.png",
    title: "Document",
    subtitle: "Unity Props Docs",
    handle: "@delta",
    borderColor: "#f2caad",
    gradient: "linear-gradient(195deg, #bf9169, #000)",
    url: "https://andcreate.github.io/vdc/",
  },
];

export default function App() {
  return (
    <div className="h-screen relative">
      <div className="flex flex-col h-dvh items-center gap-5 lg:gap-8">
        <main className="flex-1 min-h-0">
          <Hero />
          <div className="relative z-10 h-dvh flex items-center justify-center">
            <ChromaGrid
              items={gridItems}
              columns={2}
              rows={2}
              cardSize={180}
              radius={250}
            />
          </div>
        </main>
        <footer className="relative z-10 flex-none">
          <div className="py-3">
            <p>&copy; andCreate</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
