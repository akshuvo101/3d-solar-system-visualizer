"use client";

import { useEffect, useRef, useState } from "react";

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
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const planetAudioRef = useRef<HTMLAudioElement | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  /*
   * --------------------------------------------------
   * Background Music
   * --------------------------------------------------
   *
   * Background music keeps playing continuously.
   * It does NOT stop when planet narration starts.
   *
   * We also handle browser autoplay restrictions by
   * retrying playback after the first user interaction.
   */

  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    const audio = backgroundAudioRef.current;

    if (!audio) return;

    audio.volume = 0.25;
    audio.loop = true;

    if (!isEnabled) {
      audio.pause();
      return;
    }

    let isMounted = true;

    const playBackground = async () => {
      if (!isMounted || !audio.paused) return;

      try {
        await audio.play();
      } catch {
        // Browser blocked autoplay.
        // Playback will be retried after user interaction.
      }
    };

    /*
     * Try immediately.
     */
    playBackground();

    /*
     * Try again when audio becomes ready.
     */
    const handleCanPlay = () => {
      playBackground();
    };

    const handleLoadedData = () => {
      playBackground();
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", handleLoadedData);

    /*
     * If the tab becomes visible again, try playback.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        playBackground();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /*
     * Cleanup listeners only.
     *
     * IMPORTANT:
     * We intentionally do NOT pause the audio here.
     * This prevents unnecessary interruptions.
     */
    return () => {
      isMounted = false;

      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", handleLoadedData);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [isEnabled]);

  /*
   * --------------------------------------------------
   * Background Source
   * --------------------------------------------------
   *
   * If backgroundUrl changes, update the audio source
   * and try to start playback again.
   */

  useEffect(() => {
    const audio = backgroundAudioRef.current;

    if (!audio || !backgroundUrl) return;

    if (!hasUserInteracted) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    if (audio.src !== new URL(backgroundUrl, window.location.href).href) {
      audio.src = backgroundUrl;
      audio.load();
    }

    if (isEnabled) {
      audio.play().catch(() => {});
    }
  }, [backgroundUrl, hasUserInteracted, isEnabled]);

  /*
   * --------------------------------------------------
   * Planet Narration
   * --------------------------------------------------
   *
   * Planet narration plays on top of the background music.
   */

  useEffect(() => {
    const audio = planetAudioRef.current;

    if (!audio) return;

    /*
     * Stop previous narration
     */
    audio.pause();
    audio.currentTime = 0;

    /*
     * No planet audio or music disabled
     */
    if (!planetUrl || !isEnabled) {
      return;
    }

    audio.volume = 1;

    const playPlanet = async () => {
      try {
        await audio.play();
      } catch {
        // Browser may block autoplay.
        // Background music remains unaffected.
      }
    };

    /*
     * Load the new narration
     */
    audio.src = planetUrl;
    audio.load();

    /*
     * Start when ready
     */
    const handleCanPlay = () => {
      playPlanet();
    };

    audio.addEventListener("canplay", handleCanPlay);

    /*
     * Also try immediately
     */
    playPlanet();

    /*
     * User interaction fallback
     */
    const handleUserInteraction = () => {
      playPlanet();
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);

      document.removeEventListener(
        "click",
        handleUserInteraction
      );

      document.removeEventListener(
        "touchstart",
        handleUserInteraction
      );

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
        loop
        preload="none"
        playsInline
      />

      {/* Planet Narration */}
      <audio
        ref={planetAudioRef}
        preload="none"
        playsInline
      />
    </>
  );
}