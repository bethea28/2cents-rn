import React, { useState } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
// import ImageView from "react-native-image-viewing";

const styles = StyleSheet.create({
  imageContainer: {
    width: "50%",
    aspectRatio: 1,
    padding: 5,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
});

const images = [
  { uri: "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4" },
  { uri: "https://images.unsplash.com/photo-1573273787173-0eb81a833b34" },
  { uri: "https://images.unsplash.com/photo-1569569970363-df7b6160d111" },
  { uri: "https://reactnative.dev/img/tiny_logo.png" },
];

export const PhotoScreen = () => {
  const companyInfo = useSelector((state) => state.counter.companyInfo);
  const [visible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => {
        setSelectedIndex(index);
        setIsVisible(true);
      }}
    >
      <Image style={styles.image} source={{ uri: item.uri }} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "pink" }}>
      <Text style={{ padding: 10, fontSize: 20, fontWeight: "bold" }}>
        Photo Screen
      </Text>

      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={2}
      />
      {/* 
      <ImageView
        images={images}
        imageIndex={selectedIndex}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      /> */}
    </View>
  );
};
