"use client";

import { useEffect, useRef } from "react";

type Props = {
  backgroundUrl?: string;
  planetUrl?: string;
  isEnabled?: boolean;
};

export default function AudioPlayer({
  backgroundUrl = "/audio/background.mp4",
  planetUrl,
  isEnabled = true,
}: Props) {
  const backgroundAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const planetAudioRef =
    useRef<HTMLAudioElement | null>(null);

  /*
   * --------------------------------------------------
   * Background Music
   * --------------------------------------------------
   *
   * Background music keeps playing continuously.
   * It does NOT stop when planet narration starts.
   */

  useEffect(() => {
    const audio =
      backgroundAudioRef.current;

    if (!audio) return;

    if (!isEnabled) {
      audio.pause();
      return;
    }

    audio.volume = 0.25;

    audio.play().catch(() => {});

    return () => {
      audio.pause();
    };
  }, [isEnabled]);

  /*
   * --------------------------------------------------
   * Planet Narration
   * --------------------------------------------------
   *
   * Planet narration plays on top of the
   * background music.
   */

  useEffect(() => {
    const audio =
      planetAudioRef.current;

    if (!audio) return;

    /*
     * Stop previous planet narration
     */
    audio.pause();
    audio.currentTime = 0;

    /*
     * No planet audio or music is OFF
     */
    if (!planetUrl || !isEnabled) {
      return;
    }

    /*
     * Play planet narration
     */
    audio.volume = 1;

    audio.currentTime = 0;

    audio.play().catch(() => {});

    /*
     * Cleanup when changing planet
     */
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [planetUrl, isEnabled]);

  /*
   * --------------------------------------------------
   * Render
   * --------------------------------------------------
   */

  return (
    <>
      {/* Background Music */}

      <audio
        ref={backgroundAudioRef}
        src={backgroundUrl}
        loop
        preload="auto"
        autoPlay
        playsInline
      />

      {/* Planet Narration */}

      <audio
        ref={planetAudioRef}
        src={planetUrl}
        preload="auto"
        autoPlay
        playsInline
      />
    </>
  );
}