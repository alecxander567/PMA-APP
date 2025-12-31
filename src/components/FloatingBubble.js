import { Animated, Easing, View } from "react-native";
import { useEffect, useRef } from "react";

const FloatingBubble = ({ size, style }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateY]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "white",
          opacity: 0.2,
          justifyContent: "center",
          alignItems: "center",
        }}>
        <View
          style={{
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: (size * 0.3) / 2,
            backgroundColor: "rgba(255,255,255,0.6)",
            position: "absolute",
            top: size * 0.15,
            left: size * 0.15,
          }}
        />
      </View>
    </Animated.View>
  );
};

export default FloatingBubble;
