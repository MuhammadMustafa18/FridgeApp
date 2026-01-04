import { addItem } from "@/services/db";
import { sendImageToGemini } from "@/services/gemini";
import { searchItemImage } from "@/services/imageSearch";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [zoom, setZoom] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    console.log("Attempting to take picture...");
    if (cameraRef.current) {
      try {
        console.log("Calling takePictureAsync...");
        const photoData = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
        console.log("takePictureAsync result:", photoData?.uri); // Log URI, don't log full base64
        if (photoData && photoData.base64) {
          setPhoto(photoData.uri);
          console.log("Photo captured:", photoData.uri);
          setLoading(true);
          try {
            const result = await sendImageToGemini(photoData.base64);
            console.log("Gemini result:", result);
            setAiResponse(result);
          } catch (error) {
            console.error("Gemini error:", error);
            setAiResponse("Error analyzing image.");
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to take picture:", error);
      }
    } else {
      console.warn("Camera ref is null");
    }
  };

  const saveItems = async () => {
    try {
      setSaving(true);
      // Clean up the response text - remove markdown code blocks if present
      const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      const items = JSON.parse(cleanJson);

      if (!Array.isArray(items)) {
        throw new Error("Invalid response format: expected an array");
      }

      for (const item of items) {
        const imageUrl = await searchItemImage(item.name);
        // Ensure quantity is a number, parse it if it's a string like "3"
        const qty = typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity;
        await addItem(item.name, qty, imageUrl);
      }

      Alert.alert("Success", "Items saved to your fridge!");
      setPhoto(null);
      setAiResponse("");
    } catch (error) {
      console.error("Error saving items:", error);
      Alert.alert("Error", "Failed to save items. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          ) : aiResponse ? (
            <View style={{ flex: 1 }}>
              <ScrollView style={styles.responseContainer}>
                <Text style={styles.responseText}>{aiResponse}</Text>
              </ScrollView>
              <View style={styles.previewControls}>
                <Button title={saving ? "Saving..." : "Save to Fridge"} onPress={saveItems} disabled={saving} />
                <View style={{ width: 10 }} />
                <Button title="Retake" onPress={() => { setPhoto(null); setAiResponse(""); }} disabled={saving} />
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
          mode="picture"
          zoom={zoom}
          onCameraReady={() => console.log("Camera ready")}
          onMountError={(e) => console.error("Camera mount error:", e)}
        >
          <View style={styles.controlsContainer}>
            <View style={styles.zoomControls}>
              <TouchableOpacity onPress={() => setZoom(Math.max(0, zoom - 0.1))} style={styles.zoomButton}>
                <Text style={styles.zoomText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.zoomText}>{(zoom * 10).toFixed(1)}x</Text>
              <TouchableOpacity onPress={() => setZoom(Math.min(1, zoom + 0.1))} style={styles.zoomButton}>
                <Text style={styles.zoomText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 40,
  },
  zoomControls: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
  },
  zoomButton: {
    paddingHorizontal: 20,
  },
  zoomText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  preview: {
    flex: 1,
    resizeMode: "contain",
  },
  previewControls: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  responseContainer: {
    padding: 20,
    backgroundColor: "#1a1a1a",
    maxHeight: 200,
  },
  responseText: {
    color: "white",
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
});
