export const StandaloneCameraScreen = ({ route, navigation }) => {
    const { mode, storyId } = route.params;
    const [createStory] = useCreateStoryMutation();
    const [updateStory] = useUpdateStoryStatusMutation();

    const handleVideoSave = async (videoUri) => {
        // 1. Convert to Blob to fix the 243B file error
        const blob = await uriToBlob(videoUri);

        // 2. Upload to Firebase
        const videoUrl = await uploadToFirebase(blob);

        if (mode === 'rebuttal') {
            // Logic for User B responding
            await updateStory({
                mode: 'rebuttal',
                id: storyId,
                // sideBVideoUrl: videoUrl,
                status: 'complete',
                rebuttalSubmittedAt: new Date(),
                sideBAcknowledged: true
            })
        } else {
            // Logic for User A starting a new beef
            await createStory({
                sideAVideoUrl: videoUrl,
                status: 'pending-response'
            }).unwrap();
        }

        navigation.navigate('Home');
    };

    return (
        <View style={{ flex: 1 }}>
            <CameraComponent onVideoRecorded={handleVideoSave} />
        </View>
    );
};