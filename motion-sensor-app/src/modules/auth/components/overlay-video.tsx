import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";

const videoSource = require("../../../../assets/videos/landing.mp4");

const OverlayVideo = () => {
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true; // required for autoplay on iOS, otherwise play() silently no-ops
    player.play();
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  );
};

export default OverlayVideo;
