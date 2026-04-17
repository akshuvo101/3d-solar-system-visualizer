"use client";

import { useEffect, useMemo } from "react";

type Props = {
  sourceUrl?: string;
  isEnabled?: boolean;
};

const extractYouTubeId = (url: string) => {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = url.match(regex);
  return match?.[1] ?? null;
};

export default function AudioPlayer({
  sourceUrl = "/audio/space.mp3",
  isEnabled = true,
}: Props) {
  const youtubeId = useMemo(() => extractYouTubeId(sourceUrl), [sourceUrl]);

  useEffect(() => {
    if (youtubeId || !isEnabled) return;

    const audio = new Audio(sourceUrl);
    audio.loop = true;
    audio.volume = 0.3;

    audio.play().catch(() => {});

    return () => audio.pause();
  }, [isEnabled, sourceUrl, youtubeId]);

  if (youtubeId && isEnabled) {
    return (
      <iframe
        title="Background Space Audio"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}`}
        allow="autoplay; encrypted-media"
        className="hidden"
      />
    );
  }

  return null;
}
