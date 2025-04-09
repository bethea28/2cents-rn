import * as React from "react";
import { View, useWindowDimensions } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import { ReviewScreen } from "@/app/Screens/ReviewScreen";
import { DetailsScreen } from "@/app/Screens/DetailsScreen";
import { BusinessHours } from "@/app/Screens/BusinessHours";
import { PhotoScreen } from "@/app/Screens/PhotoScreen";
const renderScene = SceneMap({
  first: DetailsScreen,
  second: ReviewScreen,
  third: BusinessHours,
  fourth: PhotoScreen,
});

const routes = [
  { key: "first", title: "Details" },
  { key: "second", title: "Reviews" },
  { key: "third", title: "Hours" },
  { key: "fourth", title: "Photos" },
];

export const TabComponent = ({ navIndex }) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(navIndex);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
    />
  );
};
