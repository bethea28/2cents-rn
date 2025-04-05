import React from "react";
import { View, FlatList, Pressable, Image } from "react-native";
import { Text, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useGetReviewsQuery } from "@/store/api/api";

export function ReviewScreen({ route: { params } }) {
  const navigation = useNavigation();
  const userData = useSelector((state) => state.counter.userData);
  const companyInfo = useSelector((state) => state.counter.companyInfo);
  console.log("USER DATA", companyInfo);
  //   return;
  const { data: allCompanyReviews } = useGetReviewsQuery({
    companyId: companyInfo?.companyId,
  });
  console.log("PARAMS NOW ", allCompanyReviews);
  React.useEffect(() => {
    const getReviews = async () => {
      try {
        // const req = await getCompanyReviews({ companyId });
      } catch (err) {
        console.log("err", err);
      }
    };
    getReviews();
  }, []);
  console.log("PARAMS NOW WE GOT");
  return (
    <View style={{ flex: 1 }}>
      {allCompanyReviews?.reviews.map((review, index) => {
        return (
          <View
            key={index.toString()}
            style={{ marginTop: 10, backgroundColor: "yellow" }}
          >
            <Text>Review: {review.review}</Text>
            <Text>Rating: {review.rating}</Text>
            <Text>Display Name: {review.displayName}</Text>
          </View>
        );
      })}
    </View>
  );
}
