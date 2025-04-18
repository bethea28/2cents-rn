import * as React from "react";
import { Avatar } from "react-native-paper";
import {
  Pressable,
  View,
  StyleSheet,
  Text,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { setCompanyInfo } from "@/store/globalState/globalState";
import { useDispatch } from "react-redux";
import StarRatingDisplay from "react-native-star-rating-widget";
import { useGetReviewsQuery } from "@/store/api/api";

// Define a Material Design inspired color palette (using the provided colors)
const primaryColor = "#a349a4"; // Purple 500 (approx.)
const primaryLightColor = "#d67bff"; // Purple 200 (approx.)
const primaryDarkColor = "#751976"; // Purple 700 (approx.)
const secondaryColor = "#f28e1c"; // Orange A200 (approx.)
const secondaryLightColor = "#ffc04f"; // Orange A100 (approx.)
const secondaryDarkColor = "#b95f00"; // Orange A400 (approx.)
const backgroundColor = "#f7b767"; // Light Orange 200 (approx.)
const textColorPrimary = "#ffffff"; // White
const textColorSecondary = "#333333"; // Dark Gray
const surfaceColor = "#FFFFFF"; // White (for cards)
const shadowColor = "#000";
const disabledColor = "#E0E0E0"; // Grey 300

const LeftContent = (props) => <Avatar.Icon {...props} icon="folder" />;

export const CompanyCard = ({ title, mainImage, wholeData }) => {
  const {
    data: allCompanyReviews,
    isLoading,
    isError,
  } = useGetReviewsQuery({
    companyId: wholeData.id,
  });
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const handleNavigate = (navIndex) => {
    dispatch(setCompanyInfo(wholeData));
    navigation.navigate("Info", { wholeData, navIndex });
  };

  const StarRate = ({ changeRating, rating, styles }) => {
    return (
      <StarRatingDisplay
        starSize={25}
        style={{ marginRight: 20 }}
        rating={rating}
        starStyle={{ width: 10 }}
        onChange={() => {}}
      />
    );
  };

  const AddressComponent = ({ phone, addy, city, state, zip, title }) => (
    <>
      <Text style={styles.title}>{title}</Text>

      <>
        <Text>{addy}</Text>
        <View style={{ flexDirection: "row" }}>
          <Text>{city}</Text>
          <Text> {state}</Text>
          <Text> {zip}</Text>
        </View>
        <Text>{phone}</Text>
      </>
    </>
  );
  const ratings = React.useMemo(() => {
    if (!allCompanyReviews?.reviews) return [];
    const length = allCompanyReviews.reviews.length;
    const rating = allCompanyReviews?.reviews?.reduce((a, b) => {
      return a + b.rating;
    }, 0);
    return rating / length;
  }, [isLoading]);

  const addy = wholeData.companyInfo.address;
  const city = wholeData.companyInfo.city;
  const state = wholeData.companyInfo.state;
  const zip = wholeData.companyInfo.zip;
  // console.log("whole data now", wholeData);
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <AddressComponent
          title={title}
          addy={addy}
          city={city}
          state={state}
          zip={zip}
          phone={1234567}
        />
        {/* <StarRate styles={{ width: 100 }} rating={5} /> */}
      </View>
      <ImageBackground
        style={[styles.cover, { justifyContent: "flex-end" }]}
        source={{
          uri:
            mainImage ||
            "https://www.rollingstone.com/wp-content/uploads/2022/02/0001x.jpg?w=1581&h=1054&crop=1&s",
        }}
        onError={(err) => console.log("what is image error", err)}
      >
        <Pressable
          onPress={() => handleNavigate(3)}
          style={({ pressed }) => [
            { backgroundColor: pressed ? "red" : "green" },
          ]}
        >
          <Text style={{ fontSize: 24 }}>See all Photos </Text>
        </Pressable>
      </ImageBackground>
      <View style={styles.actions}>
        <View style={styles.actionsContainer}>
          <View style={{ marginRight: 48 }}>
            {ratings ? <StarRate rating={ratings} /> : <StarRate rating={0} />}
            <Text style={{ marginLeft: 10 }}>
              {allCompanyReviews?.reviews?.length} Reviews
            </Text>
          </View>
          <Pressable
            onPress={() => handleNavigate(0)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: pressed ? secondaryLightColor : primaryColor },
            ]}
            android_ripple={{ color: primaryDarkColor }}
          >
            <Text style={styles.buttonText}>Details</Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigate(1)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: pressed ? secondaryLightColor : primaryColor },
            ]}
            android_ripple={{ color: primaryDarkColor }}
          >
            <Text style={styles.buttonText}>Reviews</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // marginTop: 16,
    backgroundColor: surfaceColor,
    borderRadius: 4,
    elevation: 2, // Subtle shadow
    // marginHorizontal: 16,
    overflow: "hidden", // Clip content for rounded corners
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: textColorSecondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: textColorSecondary,
  },
  cover: {
    height: 200,
    width: "100%",
  },
  actions: {
    padding: 8,
    // flexDirection: "row",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  button: {
    backgroundColor: primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
    elevation: 1, // Subtle button shadow
  },
  buttonText: {
    color: textColorPrimary,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
