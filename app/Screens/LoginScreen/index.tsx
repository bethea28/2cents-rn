



import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useDispatch } from "react-redux";

// Your existing logic imports (UNCHANGED)
import { setUserState } from "@/store/globalState/globalState";
import { useAuthLoginMutation, useAuthRegisterMutation } from "@/store/api/api";
import { login } from "@/store/authReducer";
import { authTokenStore } from "@/app/customHooks";

export function LoginScreen({ navigation }: any) {
    const dispatch = useDispatch();
    // const [loginApi, { isLoading }] = useAuthLoginMutation();
    const [register, { isLoading }] = useAuthRegisterMutation();

    const [errorMessage, setErrorMessage] = useState("");

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data: any) => {
        setErrorMessage("");
        try {
            const response: any = await loginApi(data).unwrap();

            if (response?.token && response?.refreshToken) {
                // 1. Store the keys
                authTokenStore.storeTokens(response.token, response.refreshToken);

                // 2. Sync Redux state 
                // 🛡️ IMPORTANT: These dispatches trigger the MainApp re-render
                dispatch(login(response.user));
                dispatch(setUserState(response.user));

                // ❌ REMOVE THIS LINE:
                // navigation?.navigate('Feed') 

                // Why? Because as soon as dispatch(login) happens, 
                // the LoginScreen is destroyed and replaced by the Feed.
            }
        } catch (err: any) {
            const errorDetail = err?.data?.error || "Invalid Secret Key or Email";
            setErrorMessage(errorDetail);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>RESUME THE BATTLE</Text>

                {errorMessage ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorBanner}>{errorMessage}</Text>
                    </View>
                ) : null}

                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>EMAIL</Text>
                    <Controller
                        name="email"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: "Email is required",
                            pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" }
                        }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="fighter@arena.com"
                                placeholderTextColor="#333"
                                keyboardType="email-address"
                                value={value}
                                onChangeText={onChange}
                                autoCapitalize="none"
                            />
                        )}
                    />
                    {errors.email && <Text style={styles.errorText}>{String(errors.email.message)}</Text>}
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>SECRET KEY</Text>
                    <Controller
                        name="password"
                        control={control}
                        defaultValue=""
                        rules={{ required: "Password is required" }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[styles.input, errors.password && styles.inputError]}
                                placeholder="••••••••"
                                placeholderTextColor="#333"
                                secureTextEntry
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.password && <Text style={styles.errorText}>{String(errors.password.message)}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.battleButton, isLoading && { opacity: 0.7 }]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>LOGIN</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate("Registration")}
                    style={styles.footerLink}
                >
                    <Text style={styles.footerText}>
                        New to the arena? <Text style={styles.linkText}>Claim a Handle</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    scrollContent: { padding: 25, justifyContent: "center", flexGrow: 1 },
    title: { fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 40, letterSpacing: 1 },
    inputWrapper: { marginBottom: 20, width: '100%' },
    label: { color: '#444', fontSize: 11, fontWeight: '900', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: "#0A0A0A", color: "#fff", padding: 16, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#1A1A1A' },
    inputError: { borderColor: '#550000' },
    battleButton: { backgroundColor: "#a349a4", padding: 18, borderRadius: 10, alignItems: "center", marginTop: 15 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
    errorBox: { backgroundColor: 'rgba(255,0,0,0.05)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,0,0,0.1)' },
    errorBanner: { color: "#FF4444", textAlign: "center", fontSize: 13, fontWeight: '600' },
    errorText: { color: "#FF4444", fontSize: 11, marginTop: 5, fontWeight: '600' },
    footerLink: { marginTop: 30, alignItems: 'center' },
    footerText: { color: '#444', fontSize: 13 },
    linkText: { color: '#a349a4', fontWeight: 'bold' }
});