const audio = new Audio("/sound.mp3");
audio.volume = 0.5;
export const play = () => {
  if (audio.paused) {
    audio.currentTime = 0;
    audio.play();
  }
};
