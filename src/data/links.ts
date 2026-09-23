/**
 * Entry points listed on the top page.
 */
export interface Destination {
  /** Stable id, also used to tint the artwork on hover. */
  id: string;
  title: string;
  brand: string;
  description: string;
  href: string;
  /** Host shown to the visitor, without protocol. */
  label: string;
}

export const destinations: readonly Destination[] = [
  {
    id: "web",
    title: "Web Design",
    brand: "アンドクリエイト",
    description: "Web制作・WordPress開発",
    href: "https://andcre.com/",
    label: "andcre.com",
  },
  {
    id: "virtual",
    title: "Virtual Works",
    brand: "ROGIX Activity",
    description: "VRChatワールド・3Dライブ制作",
    href: "https://virtual.andcre.com/",
    label: "virtual.andcre.com",
  },
  {
    id: "booth",
    title: "BOOTH",
    brand: "#StudioLouie",
    description: "Unity向け3D小道具・パーティクル",
    href: "https://andcreate.booth.pm/",
    label: "andcreate.booth.pm",
  },
  {
    id: "docs",
    title: "Documents",
    brand: "#StudioLouie",
    description: "アセットの使い方",
    href: "https://andcreate.github.io/vdc/",
    label: "andcreate.github.io/vdc",
  },
];
