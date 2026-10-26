/**
 * Lighting cues, one per destination, like a console's cue list.
 * 行き先ごとの照明キュー（照明卓のキューリストに相当）。
 */
export interface Cue {
  /** Moving-head beam colour. / ムービングライトのビーム色 */
  beam: string;
  /** Back-wall LED tint. / 背面 LED の色 */
  wall: string;
  /** Camera orbit around the "&", radians. / 「&」周りのカメラ方位角（ラジアン） */
  azimuth: number;
  /** Camera height offset. / カメラの高さオフセット */
  elevation: number;
  /** Beam sweep speed. / ビームのスイング速度 */
  sweep: number;
}

/** Idle state uses the page accent (read from CSS at runtime). / 待機時はページのアクセント色（実行時に CSS から読む） */
export const IDLE_CUE: Cue = {
  beam: "#f3efe8",
  wall: "#b11226",
  azimuth: 0.18,
  elevation: 0,
  sweep: 0.45,
};

export const CUES: Readonly<Record<string, Cue>> = {
  web: { beam: "#dfe7ff", wall: "#3a4a8a", azimuth: -0.55, elevation: 0.35, sweep: 0.3 },
  virtual: { beam: "#ff3d5e", wall: "#b11226", azimuth: 0.6, elevation: -0.1, sweep: 1.1 },
  booth: { beam: "#ffb35c", wall: "#8a4a12", azimuth: -0.2, elevation: 0.8, sweep: 0.6 },
  docs: { beam: "#bfe6ff", wall: "#1d5a6e", azimuth: 0.95, elevation: 0.5, sweep: 0.25 },
};

export const cueFor = (id: string | null): Cue => (id && CUES[id]) || IDLE_CUE;
