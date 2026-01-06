import { useImagePreview } from "@/context/ImagePreviewContext";
import {
  addItem,
  confirmAllItems,
  deleteItem,
  getItems,
  saveRecipe
} from "@/services/db";
import { Item, RecipeTemp } from "@/types";

import { suggestRecipesFromGroq } from "@/services/getRecipes";
import { searchItemImage } from "@/services/imageSearch";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import "../../global.css";

export default function HomeScreen() {
  const { previewImage, setPreviewImage } = useImagePreview();
  const [items, setItems] = useState<Item[]>([]);
  const [wholeInventory, setWholeInventory] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [suggestedMeals, setSuggestedMeals] = useState<RecipeTemp[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      loadConfirmedInventory();
    }, [])
  );

  useEffect(() => {
    const sourceItems = isOn ? wholeInventory : items;
    if (sourceItems.length === 0) {
      setSuggestedMeals([]);
      return;
    }

    const run = async () => {
      const ingredientNames = sourceItems.map((i) =>
        i.name.trim().toLowerCase()
      );
      const recipes = await suggestRecipesFromGroq(ingredientNames);
      console.log("recipes", recipes);
      // setSuggestedMeals(recipes); // Wait for images
      const recipesWithImages = await attachImages(recipes);
      setSuggestedMeals(recipesWithImages);
    };

    run();
  }, [items, isOn]);

  const loadItems = async () => {
    const data = await getItems("draft");
    setItems(data);
  };
  const loadConfirmedInventory = async () => {
    const data = await getItems("confirmed");
    setWholeInventory(data);
  };

  const handleConfirmAll = async () => {
    try {
      await confirmAllItems();
      Alert.alert("Success", "All items added to inventory!");
      await loadItems();
    } catch (e) {
      Alert.alert("Error", "Failed to confirm all items");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteItem(id);
      await loadItems();
    } catch (e) {
      Alert.alert("Error", "Failed to delete item");
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Required", "Please enter an item name");
      return;
    }

    try {
      setAdding(true);
      const image_url = await searchItemImage(newItemName);
      const qty = parseInt(newItemQuantity) || 1;
      await addItem(newItemName, qty, image_url);
      setNewItemName("");
      setNewItemQuantity("1");
      setModalVisible(false);
      await loadItems();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not add item");
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      (async () => {
        const recipesWithImages = await suggestRandomRecipe(items);
        setSuggestedMeals(recipesWithImages);
      })();
    }
  }, [items]);

  const attachImages = async (recipes: RecipeTemp[]): Promise<RecipeTemp[]> => {
    if (recipes.length == 0) return [];
    const recipesWithImages = await Promise.all(
      recipes.map(async (recipe) => {
        const image_url = await searchItemImage(recipe.name);
        return { ...recipe, image_url: image_url };
      })
    );
    return recipesWithImages;
  };

  const suggestRandomRecipe = async (items: Item[]): Promise<RecipeTemp[]> => {
    const availableNames = items.map((i) => i.name.toLowerCase());
    const recipes = [
      { name: "Omelette", ingredients: ["eggs", "milk", "cheese"] },
      { name: "Tomato Soup", ingredients: ["tomato", "water", "salt"] },
      { name: "Pancakes", ingredients: ["milk", "flour", "egg"] },
      { name: "Salad", ingredients: ["tomato", "lettuce", "cucumber"] },
      { name: "Fries", ingredients: ["potatoes"] },
      { name: "Pie", ingredients: ["blueberries"] },
    ];

    const possibleRecipes = recipes.filter((recipe) =>
      recipe.ingredients.some((ing) => availableNames.includes(ing))
    );
    if (possibleRecipes.length === 0) return [];

    const recipesWithImages = await Promise.all(
      possibleRecipes.map(async (recipe) => {
        const image_url = await searchItemImage(recipe.name);
        return { ...recipe, image_url: image_url };
      })
    );
    return recipesWithImages;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Transparent Spacer to show black bg */}
        <View style={{ height: 140 }} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <Text style={styles.appTitle}>
            Recently <Text style={{ fontWeight: "900" }}>Scanned</Text>
          </Text>

          {previewImage && (
            <View style={{ marginBottom: 20 }}>
              <Image source={{ uri: previewImage }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
              <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 20 }}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Items Grid */}
          <View style={styles.itemsGrid}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemWrapper}>
                {/* Square Image Box */}
                <View style={styles.imageBox}>
                  {/* Delete Badge */}
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.deleteBadge}
                  >
                    <Ionicons name="trash-outline" size={12} color="white" />
                  </TouchableOpacity>

                  <Image
                    source={{
                      uri: item.image_url || "https://via.placeholder.com/150",
                    }}
                    style={styles.itemImage}
                  />

                  {/* Edit Button inside Box */}
                  <TouchableOpacity style={styles.editOverlay}>
                    <Ionicons name="pencil" size={12} color="#333" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Info Outside Box */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.qtyContainer}>
                    <Ionicons name="cube-outline" size={12} color="#999" />
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Manual Input Card - Always shows at the end */}
            {/* Manual Input Card */}
            <View style={styles.itemWrapper}>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={[styles.imageBox, styles.manualCard]}
              >
                <Ionicons name="pencil-outline" size={32} color="#333" />
                <Text style={styles.manualText}>Manual Input</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Action Button */}
          {items.length > 0 && (
            <TouchableOpacity
              onPress={handleConfirmAll}
              style={styles.mainActionButton}
            >
              <Text style={styles.mainActionText}>Add items to Inventory</Text>
            </TouchableOpacity>
          )}

          {/* Recipes Section */}
          <View style={{ marginTop: 30 }}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionHeader}>
                Recipes Of <Text style={{ fontWeight: "900" }}>Recently</Text>
              </Text>
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.sectionHeader}>
                <Text style={{ fontWeight: "900" }}>Scanned</Text> Items
              </Text>
            </View>
          </View>

          {/* Recipes List */}
          <View style={{ marginTop: 15, marginBottom: 80 }}>
            {suggestedMeals.map((item, i) => (
              <View style={styles.recipeCard} key={i}>
                <View style={styles.recipeImagePlaceholder}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.recipeImage}
                    />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: "white" }} />
                  )}
                </View>

                <View style={styles.recipeContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.recipeTitle}>{item.name}</Text>
                    <TouchableOpacity onPress={() => saveRecipe(item)}>
                      <Ionicons name="bookmark-outline" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.recipeIngredients}>
                    Ingredients: {item.ingredients.join(", ")}
                  </Text>
                </View>
              </View>
            ))}

            {/* View More Button */}
            {suggestedMeals.length > 0 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>View More</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Manual Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>

            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Milk"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonAdd]}
                onPress={handleAddItem}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonTextAdd}>Add Item</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP * 2) / 3;

const styles = StyleSheet.create({
  // Legacy container valid for reference, but using sheetContainer now
  container: {
    padding: 20,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 80,
    minHeight: height - 100, // Ensure it fills screen
    overflow: 'hidden',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#000",
    marginBottom: 20,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  itemWrapper: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  imageBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH, // Square
    backgroundColor: "white",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    // Soft shadow for the box
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden', // Contain image
  },
  itemCard: {
    // Legacy mapping support if needed, but we mostly use wrapper/imageBox now
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  manualCard: {
    // Just ensuring the manual card looks like an image box
    borderWidth: 0,
  },
  deleteBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FF5252",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  imageContainer: {
    width: "80%",
    height: "50%",
    marginBottom: 5,
    marginTop: 10,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  editText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
  itemInfo: {
    width: "100%",
    alignItems: 'flex-start', // Left align
    paddingHorizontal: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "left",
    marginBottom: 2,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#999",
    fontWeight: '500',
  },
  manualText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  mainActionButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 24,
    width: "100%",
  },
  mainActionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    lineHeight: 32,
  },
  headerRow: {},
  recipeCard: {
    marginBottom: 24,
  },
  recipeImagePlaceholder: {
    width: "100%",
    height: 150, // Large rectangular box
    backgroundColor: "white",
    borderRadius: 24, // Rounder corners
    overflow: "hidden",
    marginBottom: 12,
    // Optional shadow for the image box itself if desired
  },
  recipeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recipeContent: {
    paddingHorizontal: 4, // Slight indent alignment
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginBottom: 4,
  },
  recipeIngredients: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  viewMoreButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 16,
    borderRadius: 30, // Pill shape
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  viewMoreText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#f0f0f0",
  },
  buttonAdd: {
    backgroundColor: "#4CAF50",
  },
  buttonTextCancel: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextAdd: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
