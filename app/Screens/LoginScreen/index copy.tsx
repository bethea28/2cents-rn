// import React, { useState } from "react";
// import {
//     View,
//     StyleSheet,
//     TouchableOpacity,
//     Text,
//     TextInput,
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
// } from "react-native";
// import { useForm, Controller } from "react-hook-form";
// import { useDispatch } from "react-redux";
// import * as AppleAuthentication from 'expo-apple-authentication';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
// import { auth } from "@/store/api/firebaseConfig"; // Ensure this path exists

// // Your existing logic imports
// import { setUserState } from "@/store/globalState/globalState";
// import { useAuthLoginMutation } from "@/store/api/api";
// import { login } from "@/store/authReducer";
// import { authTokenStore } from "@/app/customHooks";

// export function LoginScreen({ navigation }: any) {
//     const dispatch = useDispatch();
//     const [loginApi, { isLoading }] = useAuthLoginMutation();
//     const [socialLoading, setSocialLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState("");

//     const { handleSubmit, control, formState: { errors } } = useForm();

//     // 🛡️ STAFF TIP: Social Logic Handler
//     const onGoogleButtonPress = async () => {
//         setSocialLoading(true);
//         setErrorMessage("");
//         try {
//             await GoogleSignin.hasPlayServices();
//             const { data } = await GoogleSignin.signIn();
//             const idToken = data?.idToken;

//             if (!idToken) throw new Error("No ID Token found");

//             const googleCredential = GoogleAuthProvider.credential(idToken);
//             const userCredential = await signInWithCredential(auth, googleCredential);

//             // Sync with your Redux & Storage
//             const userData = {
//                 userId: userCredential.user.uid,
//                 email: userCredential.user.email,
//                 userName: userCredential.user.displayName,
//                 profilePic: userCredential.user.photoURL,
//             };

//             dispatch(login(userData));
//             dispatch(setUserState(userData));
//             // No navigation needed, Redux state change triggers the swap!
//         } catch (err: any) {
//             setErrorMessage("Google Sign-In failed. Try again.");
//         } finally {
//             setSocialLoading(false);
//         }
//     };

//     const onSubmit = async (data: any) => {
//         setErrorMessage("");
//         try {
//             const response: any = await loginApi(data).unwrap();
//             if (response?.token && response?.refreshToken) {
//                 authTokenStore.storeTokens(response.token, response.refreshToken);
//                 dispatch(login(response.user));
//                 dispatch(setUserState(response.user));
//             }
//         } catch (err: any) {
//             setErrorMessage(err?.data?.error || "Invalid Secret Key or Email");
//         }
//     };

//     return (
//         <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
//             <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

//                 <Text style={styles.title}>2CENTS</Text>
//                 <Text style={styles.subtitle}>ENTER THE ARENA</Text>

//                 {/* --- SOCIAL FAST LANE --- */}
//                 <View style={styles.socialWrapper}>
//                     <TouchableOpacity
//                         style={styles.googleButton}
//                         onPress={onGoogleButtonPress}
//                         disabled={socialLoading}
//                     >
//                         <Text style={styles.googleButtonText}>Continue with Google</Text>
//                     </TouchableOpacity>

//                     {Platform.OS === 'ios' && (
//                         <AppleAuthentication.AppleAuthenticationButton
//                             buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
//                             buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
//                             cornerRadius={10}
//                             style={styles.appleButton}
//                             onPress={async () => { /* Add Apple Logic Similar to Google */ }}
//                         />
//                     )}
//                 </View>

//                 <View style={styles.dividerWrapper}>
//                     <View style={styles.line} />
//                     <Text style={styles.dividerText}>OR USE SECRET KEY</Text>
//                     <View style={styles.line} />
//                 </View>

//                 {/* --- TRADITIONAL LANE --- */}
//                 {errorMessage ? (
//                     <View style={styles.errorBox}>
//                         <Text style={styles.errorBanner}>{errorMessage}</Text>
//                     </View>
//                 ) : null}

//                 <View style={styles.inputWrapper}>
//                     <Text style={styles.label}>EMAIL</Text>
//                     <Controller
//                         name="email"
//                         control={control}
//                         render={({ field: { onChange, value } }) => (
//                             <TextInput
//                                 style={[styles.input, errors.email && styles.inputError]}
//                                 placeholder="fighter@arena.com"
//                                 placeholderTextColor="#333"
//                                 value={value}
//                                 onChangeText={onChange}
//                                 autoCapitalize="none"
//                             />
//                         )}
//                     />
//                 </View>

//                 <View style={styles.inputWrapper}>
//                     <Text style={styles.label}>SECRET KEY</Text>
//                     <Controller
//                         name="password"
//                         control={control}
//                         render={({ field: { onChange, value } }) => (
//                             <TextInput
//                                 style={[styles.input, errors.password && styles.inputError]}
//                                 placeholder="••••••••"
//                                 placeholderTextColor="#333"
//                                 secureTextEntry
//                                 value={value}
//                                 onChangeText={onChange}
//                             />
//                         )}
//                     />
//                 </View>

//                 <TouchableOpacity style={styles.battleButton} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
//                     {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>LOGIN</Text>}
//                 </TouchableOpacity>

//                 <TouchableOpacity onPress={() => navigation.navigate("Registration")} style={styles.footerLink}>
//                     <Text style={styles.footerText}>New to the arena? <Text style={styles.linkText}>Claim a Handle</Text></Text>
//                 </TouchableOpacity>
//             </ScrollView>
//         </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: "#000" },
//     scrollContent: { padding: 25, justifyContent: "center", flexGrow: 1 },
//     title: { fontSize: 42, fontWeight: "900", color: "#a349a4", textAlign: "center", letterSpacing: 2 },
//     subtitle: { fontSize: 12, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 30, letterSpacing: 4, opacity: 0.6 },
//     socialWrapper: { gap: 12, marginBottom: 30 },
//     googleButton: { backgroundColor: "#fff", padding: 16, borderRadius: 10, alignItems: "center" },
//     googleButtonText: { color: "#000", fontWeight: "900", fontSize: 15 },
//     appleButton: { width: '100%', height: 50 },
//     dividerWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, opacity: 0.3 },
//     line: { flex: 1, height: 1, backgroundColor: '#fff' },
//     dividerText: { color: '#fff', paddingHorizontal: 10, fontSize: 10, fontWeight: '900' },
//     inputWrapper: { marginBottom: 20 },
//     label: { color: '#444', fontSize: 11, fontWeight: '900', marginBottom: 8 },
//     input: { backgroundColor: "#0A0A0A", color: "#fff", padding: 16, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#1A1A1A' },
//     inputError: { borderColor: '#550000' },
//     battleButton: { backgroundColor: "#a349a4", padding: 18, borderRadius: 10, alignItems: "center", marginTop: 10 },
//     buttonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
//     errorBox: { backgroundColor: 'rgba(255,0,0,0.1)', padding: 12, borderRadius: 8, marginBottom: 20 },
//     errorBanner: { color: "#FF4444", textAlign: "center", fontSize: 12, fontWeight: '600' },
//     footerLink: { marginTop: 30, alignItems: 'center' },
//     footerText: { color: '#444', fontSize: 13 },
//     linkText: { color: '#a349a4', fontWeight: 'bold' }
// });


