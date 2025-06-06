import React from "react";
import {
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { useForm } from "react-hook-form";
import { useImagePicker } from "@/app/customHooks";
import { useAddCompanyMutation } from "@/store/api/api";
import { AddStoryForm } from "./AddStoryForm";
// import { BusinessHoursModal } from "./BusinessHoursModal";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { Notifier, Easing } from "react-native-notifier";

export function AddStoryScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      address: "",
      city: "",
      zip: "",
      state: "",
      hours: "",
      type: "",
      photos: [],
    },
  });
  const { pickImages, allImages } = useImagePicker();
  const [addCompany] = useAddCompanyMutation();
  const [modalVis, setModalVis] = React.useState(false);
  const userData = useSelector((state) => state.counter.userState); // Assuming your slice is named 'userSlice'
  const hoursData = useSelector((state) => state.counter.businessHours); // Assuming your slice is named 'userSlice'
  const dispatch = useDispatch();
  // dispatch(setBusinessHours(hours));

  const navigation = useNavigation();
  const onSubmit = async (data) => {
    try {
      const finalData = {
        companyInfo: data,
        allImages,
        hoursData,
        userId: userData?.data?.user?.user_id,
      };
      const request = await addCompany(finalData);
      Notifier.showNotification({
        title: "John Doe",
        description:
          "Business successfully added and will be awaiting verification!",
        duration: 0,
        swipeEnabled: true,
        hideOnPress: true,
        showAnimationDuration: 800,
        showEasing: Easing.bounce,
        // onHidden: () => console.log("Hidden"),
        // onPress: () => console.log("Press"),
      });
      navigation.navigate("Home");
    } catch (err) {
      console.log("eror with adding company", err);
      Notifier.showNotification({
        title: "John Doe",
        description: "Company was not successfully added. Fix Errors!",
        duration: 0,
        swipeEnabled: true,
        hideOnPress: true,
        showAnimationDuration: 800,
        showEasing: Easing.bounce,
        // onHidden: () => console.log("Hidden"),
        // onPress: () => console.log("Press"),
      });
    } finally {
      reset();
    }
    // console.log("request response noer", req);
    // if (request.data.message.includes("created successfully")) {
    //   // Notifier.showNotification({
    //   //   title: "John Doe",
    //   //   description:
    //   //     "Business successfully added and will be awaiting verification!",
    //   //   duration: 0,
    //   //   swipeEnabled: true,
    //   //   hideOnPress: true,
    //   //   showAnimationDuration: 800,
    //   //   showEasing: Easing.bounce,
    //   //   // onHidden: () => console.log("Hidden"),
    //   //   // onPress: () => console.log("Press"),
    //   // });
    //   // reset();
    //   // navigation.navigate("Home");
    // } else {
    // }
  };

  const addPhotos = () => {
    console.log("add phoes");
    pickImages();
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <AddStoryForm
        setModalVis={() => setModalVis(true)}
        onSubmit={onSubmit}
        hoursData={hoursData}
        addPhotos={addPhotos}
      />
      {/* <BusinessHoursModal modalVis={modalVis} hideModal={handleModalClose} /> */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  input: {
    height: 50,
    backgroundColor: "green",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  errorText: {
    color: "red",
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
});
