import { addItem, updateItemName, updateItemQuantity } from "@/services/db";
import { searchItemImage } from "@/services/imageSearch";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
export default function ItemEdit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const numericId = Number(params.id);

  const [name, setName] = useState((params.name as string) || "");
  const [quantity, setQuantity] = useState((params.quantity as string) || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter an item name");
      return;
    }
    const QuantityValue = parseInt(quantity, 10) || 1;

    setLoading(true);
    try {
      if (numericId) {
        await updateItemQuantity(numericId, QuantityValue);
        await updateItemName(numericId, name);
      } else {
        const image_url = await searchItemImage(name);
        await addItem(name, QuantityValue, image_url);
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content Card */}
        <View style={styles.contentCard}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.mainTitle}>
              {numericId ? "Edit" : "Input"}{" "}
              <Text style={{ fontWeight: "900" }}>Item</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.pillInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Apples"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Quantity</Text>
              <TextInput
                style={styles.pillInput}
                value={quantity}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setQuantity(text.replace(/[^0-9]/g, ""))
                }
                placeholder="e.g. 5"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.idText}>Modifying Record #{params.id}</Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000ff", // Matches the dark top area
    marginTop: 50
  },
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  saveBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: "#121212",
    fontWeight: "bold",
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#EBEBEB", // Light gray background from image
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 10,
  },
  scrollContent: {
    padding: 30,
  },
  mainTitle: {
    fontSize: 32,
    color: "#000",
    marginBottom: 30,
    fontWeight: "400",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
    marginLeft: 5,
  },
  pillInput: {
    backgroundColor: "white",
    height: 55,
    borderRadius: 30, // Creates the pill shape
    paddingHorizontal: 20,
    fontSize: 16,
    // Optional: add a very subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  idText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 20,
  },
});
